const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Clinic } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users
router.get('/', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.userRole === 'CLINIC_ADMIN') {
      whereClause.clinicId = req.clinicId;
    }
    
    if (req.query.clinicId) {
      whereClause.clinicId = req.query.clinicId;
    }

    const users = await User.findAll({
      where: whereClause,
      include: [
        { model: Clinic, as: 'clinic', attributes: ['id', 'name'] },
      ],
      order: [['name', 'ASC']],
      attributes: { exclude: ['password'] },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Clinic, as: 'clinic', attributes: ['id', 'name'] },
      ],
      attributes: { exclude: ['password'] },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check permissions
    if (req.userRole === 'CLINIC_ADMIN' && user.clinicId !== req.clinicId) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST /api/users
router.post('/', authenticate, async (req, res) => {
  try {
    const { email, password, name, role, clinicId, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      clinicId: clinicId || req.clinicId,
      phone,
      isActive: true,
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({ message: 'Usuario creado', user: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check permissions
    if (req.userRole === 'CLINIC_ADMIN' && user.clinicId !== req.clinicId) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const { password, ...updateData } = req.body;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check permissions
    if (req.userRole === 'CLINIC_ADMIN' && user.clinicId !== req.clinicId) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

module.exports = router;
