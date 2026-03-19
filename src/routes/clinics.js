const express = require('express');
const { Clinic, User } = require('../models');
const { authenticate, requireRole, requireClinicAccess } = require('../middleware/auth');

const router = express.Router();

// Helper functions for default labels
function getDefaultClientTypeLabel(type) {
  const labels = {
    patient: 'Paciente',
    client: 'Cliente',
    customer: 'Cliente',
    guest: 'Huésped',
    student: 'Estudiante',
    member: 'Miembro',
  };
  return labels[type] || 'Paciente';
}

function getDefaultProfessionalTypeLabel(type) {
  const labels = {
    professional: 'Profesional',
    doctor: 'Doctor',
    stylist: 'Estilista',
    therapist: 'Terapeuta',
    trainer: 'Entrenador',
    consultant: 'Consultor',
  };
  return labels[type] || 'Profesional';
}

// GET /api/clinics
router.get('/', async (req, res) => {
  try {
    const clinics = await Clinic.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    res.json(clinics);
  } catch (error) {
    console.error('Get clinics error:', error);
    res.status(500).json({ error: 'Error al obtener clínicas' });
  }
});

// GET /api/clinics/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    res.json(clinic);
  } catch (error) {
    console.error('Get clinic error:', error);
    res.status(500).json({ error: 'Error al obtener clínica' });
  }
});

// GET /api/clinics/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ 
      where: { slug: req.params.slug, isActive: true } 
    });
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    res.json(clinic);
  } catch (error) {
    console.error('Get clinic by slug error:', error);
    res.status(500).json({ error: 'Error al obtener clínica' });
  }
});

// POST /api/clinics (solo Super Admin)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      email, 
      phone, 
      address, 
      city, 
      country,
      clientType, 
      clientTypeLabel, 
      professionalType, 
      professionalTypeLabel, 
      countryCode,
      ...otherData 
    } = req.body;

    // Check if slug already exists
    const existingClinic = await Clinic.findOne({ where: { slug } });
    if (existingClinic) {
      return res.status(400).json({ error: 'El slug ya está en uso' });
    }

    const clinic = await Clinic.create({
      name,
      slug,
      description,
      email,
      phone,
      address,
      city,
      country: country || 'UY',
      clientType: clientType || 'patient',
      clientTypeLabel: clientTypeLabel || getDefaultClientTypeLabel(clientType || 'patient'),
      professionalType: professionalType || 'professional',
      professionalTypeLabel: professionalTypeLabel || getDefaultProfessionalTypeLabel(professionalType || 'professional'),
      countryCode: countryCode || '+598',
      isActive: true,
      plan: 'free',
      whatsappEnabled: true,
      ...otherData,
    });
    
    res.status(201).json({ message: 'Clínica creada', clinic });
  } catch (error) {
    console.error('Create clinic error:', error);
    res.status(500).json({ error: 'Error al crear clínica' });
  }
});

// PUT /api/clinics/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    // Solo SUPER_ADMIN o CLINIC_ADMIN de esa clínica
    if (req.userRole !== 'SUPER_ADMIN' && req.clinicId !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    await clinic.update(req.body);
    
    res.json({ message: 'Clínica actualizada', clinic });
  } catch (error) {
    console.error('Update clinic error:', error);
    res.status(500).json({ error: 'Error al actualizar clínica' });
  }
});

// DELETE /api/clinics/:id (solo Super Admin)
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    await clinic.update({ isActive: false });
    
    res.json({ message: 'Clínica desactivada' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    res.status(500).json({ error: 'Error al desactivar clínica' });
  }
});

module.exports = router;
