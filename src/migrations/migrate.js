const sequelize = require('../config/database');
const models = require('../models');

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');
    
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();
