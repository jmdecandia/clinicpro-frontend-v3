/**
 * ClinicPro Backend v2.0 - PostgreSQL Edition
 * Multi-tenant clinic management system with persistent storage
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const clinicRoutes = require('./routes/clinics');
const patientRoutes = require('./routes/patients');
const serviceRoutes = require('./routes/services');
const professionalRoutes = require('./routes/professionals');
const appointmentRoutes = require('./routes/appointments');
const timeBlockRoutes = require('./routes/timeBlocks');
const paymentRoutes = require('./routes/payments');
const providerRoutes = require('./routes/providers');
const debtRoutes = require('./routes/debts');
const notificationRoutes = require('./routes/notifications');
const professionalNoteRoutes = require('./routes/professionalNotes');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/time-blocks', timeBlockRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/professional-notes', professionalNoteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Sync models (in production, use migrations instead)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║           🏥 ClinicPro API Server v2.0.0               ║
║              PostgreSQL Edition                        ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  🌐 Server running on: http://0.0.0.0:${PORT}           ║
║  📊 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║  🐘 Database: PostgreSQL                               ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  📧 Credenciales de prueba:                            ║
║                                                        ║
║  Super Admin:  admin@clinicpro.com / admin123          ║
║  Admin Clínica: clinica@demo.com / clinica123          ║
║  Staff:         staff@demo.com / staff123              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
