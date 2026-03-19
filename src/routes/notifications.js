const express = require('express');
const { Notification, Patient, Appointment, Service } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: Appointment, as: 'appointment', attributes: ['id', 'date', 'time'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// POST /api/notifications
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, type, subject, message, appointmentId } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Create notification record
    const notification = await Notification.create({
      clinicId: req.clinicId,
      patientId,
      type,
      subject,
      message,
      appointmentId: appointmentId || null,
      status: 'SENT',
      sentAt: new Date(),
      sentBy: req.userId,
    });

    // Generate WhatsApp URL if needed
    let whatsappUrl = null;
    if (type === 'WHATSAPP' && patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }

    res.status(201).json({
      message: 'Notificación enviada',
      notification,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Error al enviar notificación' });
  }
});

// POST /api/notifications/send-whatsapp - Send WhatsApp to patient
router.post('/send-whatsapp', authenticate, async (req, res) => {
  try {
    const { patientId, message, appointmentId } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    if (!patient.phone) {
      return res.status(400).json({ error: 'El paciente no tiene teléfono registrado' });
    }

    // Create notification record
    const notification = await Notification.create({
      clinicId: req.clinicId,
      patientId,
      type: 'WHATSAPP',
      subject: 'Mensaje de WhatsApp',
      message,
      appointmentId: appointmentId || null,
      status: 'SENT',
      sentAt: new Date(),
      sentBy: req.userId,
    });

    // Generate WhatsApp URL
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      message: 'Enlace de WhatsApp generado',
      notification,
      whatsappUrl,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
      },
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: 'Error al generar enlace de WhatsApp' });
  }
});

// POST /api/notifications/confirm-appointment - Confirm appointment
router.post('/confirm-appointment', authenticate, async (req, res) => {
  try {
    const { appointmentId, patientId } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Service, as: 'service' },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Update appointment status
    await appointment.update({ status: 'CONFIRMED' });

    // Create confirmation notification
    const message = `Hola ${patient.firstName},\n\nTu cita ha sido confirmada:\n\n📅 Fecha: ${appointment.date}\n🕐 Hora: ${appointment.time}\n🦷 Servicio: ${appointment.service?.name || ''}\n\nTe esperamos!`;

    const notification = await Notification.create({
      clinicId: req.clinicId,
      patientId,
      type: 'WHATSAPP',
      subject: 'Confirmación de cita',
      message,
      appointmentId,
      status: 'SENT',
      sentAt: new Date(),
      sentBy: req.userId,
    });

    // Generate WhatsApp URL
    let whatsappUrl = null;
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }

    res.json({
      message: 'Cita confirmada',
      appointment,
      notification,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({ error: 'Error al confirmar cita' });
  }
});

// POST /api/notifications/reminders
router.post('/reminders', authenticate, async (req, res) => {
  try {
    const { days = 1 } = req.body;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));
    const dateStr = targetDate.toISOString().split('T')[0];

    const appointments = await Appointment.findAll({
      where: {
        clinicId: req.clinicId,
        date: dateStr,
        status: ['PENDING', 'CONFIRMED'],
        reminderSent: false,
      },
      include: [
        { model: Patient, as: 'patient' },
        { model: Service, as: 'service' },
      ],
    });

    const reminders = [];
    for (const appointment of appointments) {
      const message = `Hola ${appointment.patient?.firstName || ''},\n\nTe recordamos tu cita:\n\n📅 Fecha: ${appointment.date}\n🕐 Hora: ${appointment.time}\n🦷 Servicio: ${appointment.service?.name || ''}\n\nTe esperamos!`;

      const notification = await Notification.create({
        clinicId: req.clinicId,
        patientId: appointment.patientId,
        type: 'WHATSAPP',
        subject: 'Recordatorio de cita',
        message,
        appointmentId: appointment.id,
        status: 'SENT',
        sentAt: new Date(),
        sentBy: req.userId,
      });

      // Mark reminder as sent
      await appointment.update({ reminderSent: true });

      const cleanPhone = appointment.patient?.phone?.replace(/\D/g, '');
      const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : null;

      reminders.push({
        appointment,
        notification,
        whatsappUrl,
      });
    }

    res.json({
      message: `${reminders.length} recordatorios enviados`,
      reminders,
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({ error: 'Error al enviar recordatorios' });
  }
});

// GET /api/notifications/config
router.get('/config', authenticate, (req, res) => {
  res.json({
    configured: false,
    config: {
      publicKey: '',
      serviceId: '',
      templateId: '',
    },
  });
});

module.exports = router;
