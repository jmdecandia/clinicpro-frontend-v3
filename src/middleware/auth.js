const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'clinicpro-secret-key-2024';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verify user exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }
      
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.clinicId = decoded.clinicId;
      req.user = user;
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    
    next();
  };
}

function requireClinicAccess(req, res, next) {
  // Super admin can access all clinics
  if (req.userRole === 'SUPER_ADMIN') {
    return next();
  }
  
  // Check if user has access to the requested clinic
  const requestedClinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
  
  if (requestedClinicId && requestedClinicId !== req.clinicId) {
    return res.status(403).json({ error: 'No tienes acceso a esta clínica' });
  }
  
  next();
}

module.exports = {
  authenticate,
  requireRole,
  requireClinicAccess,
  JWT_SECRET,
};
