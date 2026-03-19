const express = require('express');
const { Service } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/services
router.get('/', authenticate, async (req, res) => {
  try {
    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (req.query.active === 'true') {
      whereClause.isActive = true;
    }

    const services = await Service.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// GET /api/services/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const service = await Service.findOne({ where: whereClause });
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
});

// POST /api/services
router.post('/', authenticate, async (req, res) => {
  try {
    const service = await Service.create({
      ...req.body,
      clinicId: req.clinicId,
      isActive: true,
    });

    res.status(201).json({ message: 'Servicio creado', service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// PUT /api/services/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const service = await Service.findOne({ where: whereClause });
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await service.update(req.body);

    res.json({ message: 'Servicio actualizado', service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const service = await Service.findOne({ where: whereClause });
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await service.update({ isActive: false });

    res.json({ message: 'Servicio desactivado' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Error al desactivar servicio' });
  }
});

module.exports = router;
