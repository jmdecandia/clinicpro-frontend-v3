const bcrypt = require('bcryptjs');
const { sequelize, Clinic, User, Patient, Professional, Service, Provider } = require('../models');

async function seed() {
  try {
    console.log('🌱 Iniciando seed de datos...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Clear existing data (optional - be careful in production)
    console.log('🧹 Limpiando datos existentes...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0').catch(() => {});
    
    // Create demo clinic
    console.log('🏥 Creando clínica demo...');
    const clinic = await Clinic.create({
      name: 'Clínica Demo',
      slug: 'clinica-demo',
      description: 'Clínica de demostración para pruebas',
      email: 'demo@clinicpro.com',
      phone: '+598 99 123 456',
      address: 'Av. 18 de Julio 1234',
      city: 'Montevideo',
      country: 'UY',
      primaryColor: '#0ea5e9',
      secondaryColor: '#6366f1',
      isActive: true,
      plan: 'free',
      whatsappEnabled: true,
      clientType: 'patient',
      clientTypeLabel: 'Paciente',
      professionalType: 'professional',
      professionalTypeLabel: 'Profesional',
      countryCode: '+598',
    });
    
    console.log('👤 Creando usuarios...');
    
    // Super Admin
    const adminPass = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin@clinicpro.com',
      password: adminPass,
      name: 'Administrador Principal',
      phone: '+598 99 111 111',
      role: 'SUPER_ADMIN',
      isActive: true,
      clinicId: null,
    });
    
    // Clinic Admin
    const clinicAdminPass = await bcrypt.hash('clinica123', 10);
    await User.create({
      email: 'clinica@demo.com',
      password: clinicAdminPass,
      name: 'Admin Clínica Demo',
      phone: '+598 99 222 222',
      role: 'CLINIC_ADMIN',
      isActive: true,
      clinicId: clinic.id,
    });
    
    // Staff
    const staffPass = await bcrypt.hash('staff123', 10);
    await User.create({
      email: 'staff@demo.com',
      password: staffPass,
      name: 'Personal de Clínica',
      phone: '+598 99 333 333',
      role: 'STAFF',
      isActive: true,
      clinicId: clinic.id,
    });
    
    console.log('🦷 Creando pacientes...');
    
    const patients = await Patient.bulkCreate([
      {
        clinicId: clinic.id,
        firstName: 'Juan',
        lastName: 'García',
        email: 'juan@email.com',
        phone: '+598 99 444 444',
        address: 'Calle Uruguay 123',
        city: 'Montevideo',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        firstName: 'María',
        lastName: 'López',
        email: 'maria@email.com',
        phone: '+598 99 555 555',
        address: 'Av. Brasil 456',
        city: 'Montevideo',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos@email.com',
        phone: '+598 99 666 666',
        address: 'Calle Argentina 789',
        city: 'Montevideo',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana@email.com',
        phone: '+598 99 777 777',
        address: 'Av. Italia 321',
        city: 'Montevideo',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        firstName: 'Pedro',
        lastName: 'Silva',
        email: 'pedro@email.com',
        phone: '+598 99 888 888',
        address: 'Calle Paraguay 654',
        city: 'Montevideo',
        isActive: true,
      },
    ]);
    
    console.log('💼 Creando profesionales...');
    
    const professionals = await Professional.bulkCreate([
      {
        clinicId: clinic.id,
        firstName: 'Dra. Ana',
        lastName: 'Martínez',
        email: 'ana.martinez@clinica.com',
        phone: '+598 99 100 001',
        specialty: 'Odontología General',
        color: '#ef4444',
        workingHours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: null,
        },
        isActive: true,
      },
      {
        clinicId: clinic.id,
        firstName: 'Dr. Laura',
        lastName: 'Gómez',
        email: 'laura.gomez@clinica.com',
        phone: '+598 99 100 002',
        specialty: 'Endodoncia',
        color: '#8b5cf6',
        workingHours: {
          monday: { start: '10:00', end: '19:00' },
          tuesday: { start: '10:00', end: '19:00' },
          wednesday: { start: '10:00', end: '19:00' },
          thursday: { start: '10:00', end: '19:00' },
          friday: { start: '10:00', end: '19:00' },
          saturday: null,
          sunday: null,
        },
        isActive: true,
      },
      {
        clinicId: clinic.id,
        firstName: 'Dra. Carmen',
        lastName: 'Ruiz',
        email: 'carmen.ruiz@clinica.com',
        phone: '+598 99 100 003',
        specialty: 'Ortodoncia',
        color: '#06b6d4',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: null,
        },
        isActive: true,
      },
    ]);
    
    console.log('🛠️ Creando servicios...');
    
    const services = await Service.bulkCreate([
      {
        clinicId: clinic.id,
        name: 'Consulta General',
        description: 'Consulta odontológica general',
        price: 1500.00,
        duration: 30,
        category: 'consulta',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        name: 'Limpieza Dental',
        description: 'Limpieza profesional completa',
        price: 2500.00,
        duration: 45,
        category: 'tratamiento',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        name: 'Extracción',
        description: 'Extracción dental',
        price: 3500.00,
        duration: 60,
        category: 'cirugia',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        name: 'Blanqueamiento',
        description: 'Blanqueamiento dental',
        price: 8000.00,
        duration: 90,
        category: 'estetica',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        name: 'Ortodoncia Consulta',
        description: 'Consulta de ortodoncia',
        price: 2000.00,
        duration: 45,
        category: 'ortodoncia',
        isActive: true,
      },
    ]);
    
    console.log('🏢 Creando proveedores...');
    
    await Provider.bulkCreate([
      {
        clinicId: clinic.id,
        name: 'Distribuidora Dental S.A.',
        rut: '210123450017',
        address: 'Av. Italia 5678, Montevideo',
        phone: '+598 2601 2345',
        email: 'ventas@distdental.com.uy',
        contactName: 'Juan Pérez',
        notes: 'Proveedor principal de insumos dentales',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        name: 'Laboratorios Dentales Uruguay',
        rut: '210987650011',
        address: 'Calle Colonia 1234, Montevideo',
        phone: '+598 2900 5678',
        email: 'contacto@labdental.com.uy',
        contactName: 'María González',
        notes: 'Prótesis dentales y laboratorio',
        isActive: true,
      },
      {
        clinicId: clinic.id,
        name: 'Equipos Médicos del Sur',
        rut: '211234560018',
        address: 'Av. 18 de Julio 4321, Montevideo',
        phone: '+598 2700 9876',
        email: 'info@equiposmedicos.com.uy',
        contactName: 'Carlos López',
        notes: 'Equipos y materiales odontológicos',
        isActive: true,
      },
    ]);
    
    console.log('✅ Seed completado exitosamente!');
    console.log('');
    console.log('📧 Credenciales de prueba:');
    console.log('  Super Admin:  admin@clinicpro.com / admin123');
    console.log('  Admin Clínica: clinica@demo.com / clinica123');
    console.log('  Staff:         staff@demo.com / staff123');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
