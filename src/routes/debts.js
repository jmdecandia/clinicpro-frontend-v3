const express = require('express');
const { Debt, Patient, Payment } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/debts
router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, status } = req.query;

    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (status) {
      whereClause.status = status;
    }

    const debts = await Debt.findAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate totals
    const totalDebt = debts
      .filter(d => d.status === 'PENDING' || d.status === 'PARTIAL')
      .reduce((sum, d) => sum + parseFloat(d.remainingAmount), 0);

    const totalPaid = debts
      .filter(d => d.status === 'PAID')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    res.json({
      debts,
      summary: {
        totalDebt,
        totalPaid,
        count: debts.length,
        pendingCount: debts.filter(d => d.status === 'PENDING').length,
      },
    });
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Error al obtener deudas' });
  }
});

// GET /api/debts/patient/:patientId
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.query;

    const patient = await Patient.findByPk(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const whereClause = { patientId: req.params.patientId };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const debts = await Debt.findAll({
      where: whereClause,
      include: [
        { model: Payment, as: 'payments' },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalDebt = debts
      .filter(d => d.status === 'PENDING' || d.status === 'PARTIAL')
      .reduce((sum, d) => sum + parseFloat(d.remainingAmount), 0);

    res.json({
      patient,
      debts,
      totalDebt,
    });
  } catch (error) {
    console.error('Get patient debts error:', error);
    res.status(500).json({ error: 'Error al obtener deudas del paciente' });
  }
});

// POST /api/debts
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, amount, reason, appointmentId, notes, dueDate } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const debt = await Debt.create({
      clinicId: req.clinicId,
      patientId,
      amount: parseFloat(amount),
      remainingAmount: parseFloat(amount),
      paidAmount: 0,
      reason: reason || 'Deuda pendiente',
      appointmentId: appointmentId || null,
      notes: notes || '',
      dueDate: dueDate || null,
      status: 'PENDING',
    });

    const debtWithPatient = await Debt.findByPk(debt.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json({
      message: 'Deuda registrada',
      debt: debtWithPatient,
    });
  } catch (error) {
    console.error('Create debt error:', error);
    res.status(500).json({ error: 'Error al registrar deuda' });
  }
});

// POST /api/debts/:id/payment
router.post('/:id/payment', authenticate, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;

    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const debt = await Debt.findOne({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient' },
      ],
    });

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const paymentAmount = parseFloat(amount);
    const newPaidAmount = parseFloat(debt.paidAmount) + paymentAmount;
    const newRemainingAmount = parseFloat(debt.amount) - newPaidAmount;

    // Determine new status
    let newStatus = 'PARTIAL';
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID';
    }

    await debt.update({
      paidAmount: newPaidAmount,
      remainingAmount: Math.max(0, newRemainingAmount),
      status: newStatus,
    });

    // Create payment record
    const payment = await Payment.create({
      clinicId: req.clinicId,
      patientId: debt.patientId,
      debtId: debt.id,
      appointmentId: debt.appointmentId,
      amount: paymentAmount,
      method: method || 'CASH',
      concept: `Pago de deuda: ${debt.reason}`,
      notes: notes || '',
      type: 'INCOME',
      paidAt: new Date(),
    });

    res.json({
      message: newStatus === 'PAID' ? 'Deuda saldada completamente' : 'Pago registrado',
      debt,
      payment,
    });
  } catch (error) {
    console.error('Debt payment error:', error);
    res.status(500).json({ error: 'Error al registrar pago de deuda' });
  }
});

// DELETE /api/debts/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const debt = await Debt.findOne({ where: whereClause });
    
    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    await debt.destroy();

    res.json({ message: 'Deuda eliminada' });
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ error: 'Error al eliminar deuda' });
  }
});

module.exports = router;
