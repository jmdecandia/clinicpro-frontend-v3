const express = require('express');
const { Op } = require('sequelize');
const { Patient, Appointment, Debt, ProfessionalNote } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/patients
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId, isActive: true }
      : { isActive: true };

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { documentId: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: patients } = await Patient.findAndCountAll({
      where: whereClause,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const patient = await Patient.findOne({
      where: whereClause,
      include: [
        { 
          model: Appointment, 
          as: 'appointments',
          limit: 10,
          order: [['date', 'DESC']],
        },
        { 
          model: Debt, 
          as: 'debts',
        },
        {
          model: ProfessionalNote,
          as: 'professionalNotes',
          limit: 10,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

// POST /api/patients
router.post('/', authenticate, async (req, res) => {
  try {
    const patient = await Patient.create({
      ...req.body,
      clinicId: req.clinicId,
      isActive: true,
    });

    res.status(201).json({ message: 'Paciente creado', patient });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

// PUT /api/patients/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const patient = await Patient.findOne({ where: whereClause });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    await patient.update(req.body);

    res.json({ message: 'Paciente actualizado', patient });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const patient = await Patient.findOne({ where: whereClause });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    await patient.update({ isActive: false });

    res.json({ message: 'Paciente desactivado' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Error al desactivar paciente' });
  }
});

// GET /api/patients/:id/history - Get patient treatment history
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const patient = await Patient.findOne({ where: whereClause });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const appointments = await Appointment.findAll({
      where: { patientId: req.params.id },
      order: [['date', 'DESC'], ['time', 'DESC']],
    });

    const notes = await ProfessionalNote.findAll({
      where: { patientId: req.params.id },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      patient,
      appointments,
      notes,
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ error: 'Error al obtener historial del paciente' });
  }
});

module.exports = router;
