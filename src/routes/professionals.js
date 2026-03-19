const express = require('express');
const { Professional, Appointment, TimeBlock } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/professionals
router.get('/', authenticate, async (req, res) => {
  try {
    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (req.query.active === 'true') {
      whereClause.isActive = true;
    }

    const professionals = await Professional.findAll({
      where: whereClause,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });

    res.json(professionals);
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
});

// GET /api/professionals/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const professional = await Professional.findOne({ where: whereClause });
    
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    res.json(professional);
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({ error: 'Error al obtener profesional' });
  }
});

// POST /api/professionals
router.post('/', authenticate, async (req, res) => {
  try {
    const professional = await Professional.create({
      ...req.body,
      clinicId: req.clinicId,
      isActive: true,
    });

    res.status(201).json({ message: 'Profesional creado', professional });
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({ error: 'Error al crear profesional' });
  }
});

// PUT /api/professionals/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const professional = await Professional.findOne({ where: whereClause });
    
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    await professional.update(req.body);

    res.json({ message: 'Profesional actualizado', professional });
  } catch (error) {
    console.error('Update professional error:', error);
    res.status(500).json({ error: 'Error al actualizar profesional' });
  }
});

// DELETE /api/professionals/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const professional = await Professional.findOne({ where: whereClause });
    
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    await professional.update({ isActive: false });

    res.json({ message: 'Profesional desactivado' });
  } catch (error) {
    console.error('Delete professional error:', error);
    res.status(500).json({ error: 'Error al desactivar profesional' });
  }
});

// GET /api/professionals/:id/schedule - Get professional schedule
router.get('/:id/schedule', authenticate, async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    const whereClause = { professionalId: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    if (date) {
      whereClause.date = date;
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const [appointments, timeBlocks] = await Promise.all([
      Appointment.findAll({
        where: {
          ...whereClause,
          status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
        },
        order: [['date', 'ASC'], ['time', 'ASC']],
      }),
      TimeBlock.findAll({
        where: whereClause,
        order: [['date', 'ASC'], ['startTime', 'ASC']],
      }),
    ]);

    res.json({
      appointments,
      timeBlocks,
    });
  } catch (error) {
    console.error('Get professional schedule error:', error);
    res.status(500).json({ error: 'Error al obtener agenda del profesional' });
  }
});

module.exports = router;
