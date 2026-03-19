const express = require('express');
const { Op } = require('sequelize');
const { Appointment, Patient, Service, Professional, TimeBlock } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments
router.get('/', authenticate, async (req, res) => {
  try {
    const { professionalId, date, startDate, endDate, status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (professionalId) {
      whereClause.professionalId = professionalId;
    }

    if (date) {
      whereClause.date = date;
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'duration'] },
        { model: Professional, as: 'professional', attributes: ['id', 'firstName', 'lastName', 'color'] },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// GET /api/appointments/today
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { professionalId } = req.query;

    const whereClause = {
      date: today,
      status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
    };

    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    if (professionalId) {
      whereClause.professionalId = professionalId;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'duration'] },
        { model: Professional, as: 'professional', attributes: ['id', 'firstName', 'lastName', 'color'] },
      ],
      order: [['time', 'ASC']],
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({ error: 'Error al obtener citas de hoy' });
  }
});

// GET /api/appointments/availability
router.get('/availability', authenticate, async (req, res) => {
  try {
    const { date, duration, professionalId } = req.query;
    
    if (!date || !duration) {
      return res.status(400).json({ error: 'Fecha y duración requeridas' });
    }

    const clinicId = req.clinicId;
    const durationMinutes = parseInt(duration);
    
    // Get professional working hours
    let workingHours = { start: '09:00', end: '18:00' };
    if (professionalId) {
      const professional = await Professional.findByPk(professionalId);
      if (professional && professional.workingHours) {
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(date).getDay()];
        const dayHours = professional.workingHours[dayOfWeek];
        if (dayHours) {
          workingHours = dayHours;
        } else {
          return res.json({ 
            date,
            professionalId,
            duration: durationMinutes,
            availableSlots: [],
            occupiedSlots: [],
            message: 'El profesional no trabaja este día'
          });
        }
      }
    }
    
    // Generate slots
    const allSlots = [];
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    const interval = 30;
    
    for (let hour = startHour; hour < endHour || (hour === endHour && 0 < endMin); hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        if (hour === endHour && minute >= endMin) break;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(time);
      }
    }
    
    // Get existing appointments
    const existingAppointments = await Appointment.findAll({
      where: {
        clinicId,
        date,
        professionalId: professionalId || { [Op.ne]: null },
        status: { [Op.not]: 'CANCELLED' },
      },
    });
    
    // Get time blocks
    const timeBlocks = await TimeBlock.findAll({
      where: {
        clinicId,
        date,
        professionalId: professionalId || { [Op.ne]: null },
      },
    });
    
    // Occupied slots
    const occupiedSlots = new Set(existingAppointments.map(a => a.time));
    
    // Blocked slots
    timeBlocks.forEach(block => {
      const [blockStartHour, blockStartMin] = block.startTime.split(':').map(Number);
      const [blockEndHour, blockEndMin] = block.endTime.split(':').map(Number);
      
      for (let hour = blockStartHour; hour <= blockEndHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
          if (hour === blockStartHour && minute < blockStartMin) continue;
          if (hour === blockEndHour && minute >= blockEndMin) break;
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          occupiedSlots.add(time);
        }
      }
    });
    
    const availableSlots = allSlots.filter(slot => !occupiedSlots.has(slot));
    
    res.json({ 
      date,
      professionalId,
      duration: durationMinutes,
      availableSlots,
      occupiedSlots: Array.from(occupiedSlots),
      timeBlocks: timeBlocks.map(b => ({ start: b.startTime, end: b.endTime, reason: b.reason }))
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

// GET /api/appointments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const appointment = await Appointment.findOne({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient' },
        { model: Service, as: 'service' },
        { model: Professional, as: 'professional' },
      ],
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Error al obtener cita' });
  }
});

// POST /api/appointments
router.post('/', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      clinicId: req.clinicId,
      status: 'PENDING',
      notificationSent: false,
      reminderSent: false,
    });

    const appointmentWithDetails = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Service, as: 'service' },
        { model: Professional, as: 'professional' },
      ],
    });

    res.status(201).json({ 
      message: 'Cita creada', 
      appointment: appointmentWithDetails 
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const appointment = await Appointment.findOne({ where: whereClause });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await appointment.update(req.body);

    const appointmentWithDetails = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Service, as: 'service' },
        { model: Professional, as: 'professional' },
      ],
    });

    res.json({ 
      message: 'Cita actualizada', 
      appointment: appointmentWithDetails 
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// PATCH /api/appointments/:id/status - Change appointment status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Estado requerido' });
    }

    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const appointment = await Appointment.findOne({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient' },
        { model: Service, as: 'service' },
        { model: Professional, as: 'professional' },
      ],
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await appointment.update({ status });

    res.json({
      message: 'Estado actualizado',
      appointment,
    });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const appointment = await Appointment.findOne({ where: whereClause });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await appointment.update({ status: 'CANCELLED' });

    res.json({ message: 'Cita cancelada' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
});

module.exports = router;
