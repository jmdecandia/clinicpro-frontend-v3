const express = require('express');
const { Op } = require('sequelize');
const { TimeBlock, Professional } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/time-blocks
router.get('/', authenticate, async (req, res) => {
  try {
    const { professionalId, date, startDate, endDate } = req.query;

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

    const timeBlocks = await TimeBlock.findAll({
      where: whereClause,
      include: [
        { model: Professional, as: 'professional', attributes: ['id', 'firstName', 'lastName', 'color'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    res.json(timeBlocks);
  } catch (error) {
    console.error('Get time blocks error:', error);
    res.status(500).json({ error: 'Error al obtener bloqueos de tiempo' });
  }
});

// POST /api/time-blocks
router.post('/', authenticate, async (req, res) => {
  try {
    const { professionalId, date, startTime, endTime, reason, startDate, endDate } = req.body;
    
    // If date range provided, create multiple blocks
    if (startDate && endDate) {
      const blocks = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const block = await TimeBlock.create({
          clinicId: req.clinicId,
          professionalId,
          date: d.toISOString().split('T')[0],
          startTime: startTime || '00:00',
          endTime: endTime || '23:59',
          reason: reason || 'Bloqueado',
        });
        blocks.push(block);
      }
      
      res.status(201).json({ 
        message: `${blocks.length} bloqueos creados`, 
        blocks,
        count: blocks.length
      });
      return;
    }
    
    // Single day block
    const block = await TimeBlock.create({
      clinicId: req.clinicId,
      professionalId,
      date,
      startTime,
      endTime,
      reason: reason || 'Bloqueado',
    });
    
    res.status(201).json({ message: 'Bloqueo creado', block });
  } catch (error) {
    console.error('Create time block error:', error);
    res.status(500).json({ error: 'Error al crear bloqueo' });
  }
});

// DELETE /api/time-blocks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.clinicId) {
      whereClause.clinicId = req.clinicId;
    }

    const block = await TimeBlock.findOne({ where: whereClause });
    
    if (!block) {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }

    await block.destroy();
    
    res.json({ message: 'Bloqueo eliminado' });
  } catch (error) {
    console.error('Delete time block error:', error);
    res.status(500).json({ error: 'Error al eliminar bloqueo' });
  }
});

module.exports = router;
