const express = require('express');
const { Op } = require('sequelize');
const { 
  Patient, 
  Service, 
  Appointment, 
  Payment, 
  Professional, 
  TimeBlock, 
  Debt 
} = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const clinicId = req.clinicId;
    
    // For Super Admin without clinic
    if (!clinicId) {
      const totalClinics = await Clinic.count();
      const totalUsers = await User.count();
      const totalPatients = await Patient.count();
      
      return res.json({
        stats: {
          totalClinics,
          totalUsers,
          totalPatients,
          totalServices: 0,
          todayAppointments: 0,
          upcomingAppointments: 0,
          pendingAppointments: 0,
          completedThisMonth: 0,
          todayRevenue: 0,
          monthRevenue: 0,
          totalRevenue: 0,
          totalDebt: 0,
        },
        recent: {
          patients: [],
          appointments: [],
          payments: [],
        },
      });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get counts
    const [
      totalPatients,
      totalServices,
      todayAppointments,
      pendingAppointments,
      completedThisMonth,
      monthRevenue,
      totalRevenue,
    ] = await Promise.all([
      Patient.count({ where: { clinicId, isActive: true } }),
      Service.count({ where: { clinicId, isActive: true } }),
      Appointment.count({ 
        where: { 
          clinicId, 
          date: todayStr,
          status: ['PENDING', 'CONFIRMED', 'COMPLETED'],
        } 
      }),
      Appointment.count({ 
        where: { 
          clinicId, 
          status: 'PENDING',
          date: { [Op.gte]: todayStr },
        } 
      }),
      Appointment.count({ 
        where: { 
          clinicId, 
          status: 'COMPLETED',
          date: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth },
        } 
      }),
      Payment.sum('amount', { 
        where: { 
          clinicId, 
          type: 'INCOME',
          paidAt: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth },
        } 
      }),
      Payment.sum('amount', { where: { clinicId, type: 'INCOME' } }),
    ]);

    // Get today's revenue
    const todayRevenue = await Payment.sum('amount', {
      where: {
        clinicId,
        type: 'INCOME',
        paidAt: { [Op.gte]: new Date(todayStr) },
      },
    });

    // Get total debt
    const debts = await Debt.findAll({
      where: {
        clinicId,
        status: ['PENDING', 'PARTIAL'],
      },
    });
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.remainingAmount), 0);

    // Get recent data
    const [recentPatients, recentAppointments, recentPayments] = await Promise.all([
      Patient.findAll({
        where: { clinicId, isActive: true },
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      Appointment.findAll({
        where: { clinicId },
        include: [
          { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
          { model: Service, as: 'service', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      Payment.findAll({
        where: { clinicId },
        order: [['paidAt', 'DESC']],
        limit: 5,
      }),
    ]);

    // Calculate revenue by professional
    const professionals = await Professional.findAll({
      where: { clinicId, isActive: true },
    });

    const revenueByProfessional = [];
    for (const prof of professionals) {
      const profAppointments = await Appointment.findAll({
        where: {
          clinicId,
          professionalId: prof.id,
          status: 'COMPLETED',
        },
      });

      const profRevenue = profAppointments.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

      // Get payments associated with this professional's appointments
      const appointmentIds = profAppointments.map(a => a.id);
      const profPayments = await Payment.findAll({
        where: {
          clinicId,
          appointmentId: { [Op.in]: appointmentIds },
        },
      });

      const totalReceived = profPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      revenueByProfessional.push({
        professionalId: prof.id,
        professionalName: `${prof.firstName} ${prof.lastName}`,
        specialty: prof.specialty,
        appointmentsCount: profAppointments.length,
        revenue: profRevenue,
        received: totalReceived,
        pending: Math.max(0, profRevenue - totalReceived),
      });
    }

    revenueByProfessional.sort((a, b) => b.revenue - a.revenue);

    // Calculate revenue by service
    const services = await Service.findAll({
      where: { clinicId, isActive: true },
    });

    const revenueByService = [];
    for (const svc of services) {
      const svcAppointments = await Appointment.findAll({
        where: {
          clinicId,
          serviceId: svc.id,
          status: 'COMPLETED',
        },
      });

      const svcRevenue = svcAppointments.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

      revenueByService.push({
        serviceId: svc.id,
        serviceName: svc.name,
        appointmentsCount: svcAppointments.length,
        revenue: svcRevenue,
      });
    }

    revenueByService.sort((a, b) => b.revenue - a.revenue);

    // Calculate occupancy rate
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Count working days
    let workingDays = 0;
    for (let d = new Date(startOfCurrentMonth); d <= endOfCurrentMonth; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) workingDays++;
    }

    const hoursPerDay = 8;

    // Get time blocks for the month
    const monthTimeBlocks = await TimeBlock.findAll({
      where: {
        clinicId,
        date: { [Op.gte]: startOfCurrentMonth, [Op.lte]: endOfCurrentMonth },
      },
    });

    // Calculate blocked hours
    const blockedHoursByProfessional = {};
    monthTimeBlocks.forEach(block => {
      if (!blockedHoursByProfessional[block.professionalId]) {
        blockedHoursByProfessional[block.professionalId] = 0;
      }
      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);
      const hours = (endH + endM / 60) - (startH + startM / 60);
      blockedHoursByProfessional[block.professionalId] += hours;
    });

    // Calculate available slots
    let totalAvailableSlots = 0;
    for (const prof of professionals) {
      const profWorkingHours = hoursPerDay * workingDays;
      const profBlockedHours = blockedHoursByProfessional[prof.id] || 0;
      totalAvailableSlots += Math.max(0, profWorkingHours - profBlockedHours);
    }

    // Get appointments for the month
    const monthAppointments = await Appointment.count({
      where: {
        clinicId,
        date: { [Op.gte]: startOfCurrentMonth, [Op.lte]: endOfCurrentMonth },
      },
    });

    const occupiedSlots = monthAppointments;
    const occupancyRate = totalAvailableSlots > 0 
      ? Math.round((occupiedSlots / totalAvailableSlots) * 100)
      : 0;

    res.json({
      stats: {
        totalPatients,
        totalServices,
        todayAppointments,
        upcomingAppointments: pendingAppointments,
        pendingAppointments,
        completedThisMonth,
        todayRevenue: todayRevenue || 0,
        monthRevenue: monthRevenue || 0,
        totalRevenue: totalRevenue || 0,
        totalDebt,
        occupancyRate,
      },
      analytics: {
        revenueByProfessional,
        revenueByService,
        occupancy: {
          occupancyRate,
          totalSlots: totalAvailableSlots,
          occupiedSlots,
          workingDays,
          blockedHours: Object.values(blockedHoursByProfessional).reduce((a, b) => a + b, 0),
        },
      },
      recent: {
        patients: recentPatients,
        appointments: recentAppointments,
        payments: recentPayments,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

module.exports = router;
