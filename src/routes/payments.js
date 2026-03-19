const express = require('express');
const { Op } = require('sequelize');
const { Payment, Patient, Appointment, Debt, Provider } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/payments
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (type) {
      whereClause.type = type;
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: Appointment, as: 'appointment', attributes: ['id', 'date', 'time'] },
        { model: Provider, as: 'provider', attributes: ['id', 'name', 'rut'] },
      ],
      order: [['paidAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// GET /api/payments/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const payments = await Payment.findAll({ where: whereClause });
    
    const todayPayments = payments.filter(p => p.paidAt && p.paidAt.toISOString().startsWith(today));
    const monthPayments = payments.filter(p => {
      const date = new Date(p.paidAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    const yearPayments = payments.filter(p => {
      const date = new Date(p.paidAt);
      return date.getFullYear() === thisYear;
    });

    // Group by method
    const byMethod = {};
    payments.forEach(p => {
      if (!byMethod[p.method]) {
        byMethod[p.method] = { count: 0, total: 0 };
      }
      byMethod[p.method].count++;
      byMethod[p.method].total += parseFloat(p.amount);
    });

    res.json({
      today: todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      month: monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      year: yearPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      total: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      byMethod: Object.entries(byMethod).map(([method, data]) => ({
        method,
        ...data,
      })),
    });
  } catch (error) {
    console.error('Get payments summary error:', error);
    res.status(500).json({ error: 'Error al obtener resumen de pagos' });
  }
});

// POST /api/payments
router.post('/', authenticate, async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      clinicId: req.clinicId,
      paidAt: new Date(),
    });

    const paymentWithDetails = await Payment.findByPk(payment.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Appointment, as: 'appointment' },
        { model: Provider, as: 'provider' },
      ],
    });

    res.status(201).json({ 
      message: 'Pago registrado', 
      payment: paymentWithDetails 
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const payment = await Payment.findOne({ where: whereClause });
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    await payment.destroy();

    res.json({ message: 'Pago eliminado' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
});

module.exports = router;
