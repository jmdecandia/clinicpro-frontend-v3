const express = require('express');
const { ProfessionalNote, Patient, Professional, Appointment, Attachment } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/professional-notes
router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, appointmentId, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    const { count, rows: notes } = await ProfessionalNote.findAndCountAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: Professional, as: 'professional', attributes: ['id', 'firstName', 'lastName'] },
        { model: Attachment, as: 'attachments' },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      data: notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get professional notes error:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

// GET /api/professional-notes/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const note = await ProfessionalNote.findOne({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient' },
        { model: Professional, as: 'professional' },
        { model: Appointment, as: 'appointment' },
        { model: Attachment, as: 'attachments' },
      ],
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get professional note error:', error);
    res.status(500).json({ error: 'Error al obtener nota' });
  }
});

// POST /api/professional-notes
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, appointmentId, professionalId, title, content, tags } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const note = await ProfessionalNote.create({
      clinicId: req.clinicId,
      patientId,
      appointmentId: appointmentId || null,
      professionalId: professionalId || req.userId,
      title: title || 'Nota',
      content: content || '',
      tags: tags || [],
      createdBy: req.userId,
    });

    const noteWithData = await ProfessionalNote.findByPk(note.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: Professional, as: 'professional', attributes: ['id', 'firstName', 'lastName'] },
        { model: Attachment, as: 'attachments' },
      ],
    });

    res.status(201).json({
      message: 'Nota registrada',
      note: noteWithData,
    });
  } catch (error) {
    console.error('Create professional note error:', error);
    res.status(500).json({ error: 'Error al registrar nota' });
  }
});

// PUT /api/professional-notes/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const note = await ProfessionalNote.findOne({ where: whereClause });
    
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    await note.update(req.body);

    const noteWithData = await ProfessionalNote.findByPk(note.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: Professional, as: 'professional', attributes: ['id', 'firstName', 'lastName'] },
        { model: Attachment, as: 'attachments' },
      ],
    });

    res.json({
      message: 'Nota actualizada',
      note: noteWithData,
    });
  } catch (error) {
    console.error('Update professional note error:', error);
    res.status(500).json({ error: 'Error al actualizar nota' });
  }
});

// DELETE /api/professional-notes/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const note = await ProfessionalNote.findOne({ where: whereClause });
    
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    // Delete associated attachments
    await Attachment.destroy({ where: { noteId: req.params.id } });

    await note.destroy();

    res.json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Delete professional note error:', error);
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
});

// POST /api/professional-notes/:id/attachments
router.post('/:id/attachments', authenticate, async (req, res) => {
  try {
    const note = await ProfessionalNote.findByPk(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    if (req.clinicId && note.clinicId !== req.clinicId) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const { fileName, fileType, fileUrl, fileSize, description } = req.body;

    const attachment = await Attachment.create({
      noteId: req.params.id,
      fileName: fileName || 'archivo',
      fileType: fileType || 'application/octet-stream',
      fileUrl: fileUrl || '',
      fileSize: fileSize || 0,
      description: description || '',
      uploadedBy: req.userId,
    });

    res.status(201).json({
      message: 'Adjunto agregado',
      attachment,
    });
  } catch (error) {
    console.error('Create attachment error:', error);
    res.status(500).json({ error: 'Error al agregar adjunto' });
  }
});

module.exports = router;
