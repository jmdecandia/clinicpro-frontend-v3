const express = require('express');
const { Provider, Payment } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/providers
router.get('/', authenticate, async (req, res) => {
  try {
    const whereClause = req.clinicId 
      ? { clinicId: req.clinicId }
      : {};

    if (req.query.active === 'true') {
      whereClause.isActive = true;
    }

    const providers = await Provider.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });

    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// GET /api/providers/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const provider = await Provider.findOne({
      where: whereClause,
      include: [
        { 
          model: Payment, 
          as: 'payments',
          limit: 20,
          order: [['paidAt', 'DESC']],
        },
      ],
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
});

// POST /api/providers
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, rut, address, phone, email, contactName, notes } = req.body;

    const provider = await Provider.create({
      clinicId: req.clinicId,
      name,
      rut: rut || '',
      address: address || '',
      phone: phone || '',
      email: email || '',
      contactName: contactName || '',
      notes: notes || '',
      isActive: true,
    });

    res.status(201).json({ message: 'Proveedor creado', provider });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// PUT /api/providers/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const provider = await Provider.findOne({ where: whereClause });
    
    if (!provider) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await provider.update(req.body);

    res.json({ message: 'Proveedor actualizado', provider });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

// DELETE /api/providers/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const provider = await Provider.findOne({ where: whereClause });
    
    if (!provider) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await provider.update({ isActive: false });

    res.json({ message: 'Proveedor desactivado' });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({ error: 'Error al desactivar proveedor' });
  }
});

module.exports = router;
