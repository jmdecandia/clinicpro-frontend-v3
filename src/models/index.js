const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// ==================== CLINIC MODEL ====================
const Clinic = sequelize.define('Clinic', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(2),
    defaultValue: 'UY',
  },
  logoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  primaryColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#0ea5e9',
  },
  secondaryColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#6366f1',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
    defaultValue: 'free',
  },
  whatsappEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  clientType: {
    type: DataTypes.ENUM('patient', 'client', 'customer', 'guest', 'student', 'member'),
    defaultValue: 'patient',
  },
  clientTypeLabel: {
    type: DataTypes.STRING(50),
    defaultValue: 'Paciente',
  },
  professionalType: {
    type: DataTypes.ENUM('professional', 'doctor', 'stylist', 'therapist', 'trainer', 'consultant'),
    defaultValue: 'professional',
  },
  professionalTypeLabel: {
    type: DataTypes.STRING(50),
    defaultValue: 'Profesional',
  },
  countryCode: {
    type: DataTypes.STRING(5),
    defaultValue: '+598',
  },
}, {
  tableName: 'clinics',
  timestamps: true,
});

// ==================== USER MODEL ====================
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'CLINIC_ADMIN', 'STAFF'),
    defaultValue: 'STAFF',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// ==================== PATIENT MODEL ====================
const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  documentId: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'patients',
  timestamps: true,
});

// ==================== PROFESSIONAL MODEL ====================
const Professional = sequelize.define('Professional', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  specialty: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#0ea5e9',
  },
  workingHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: null,
      sunday: null,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'professionals',
  timestamps: true,
});

// ==================== SERVICE MODEL ====================
const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'services',
  timestamps: true,
});

// ==================== APPOINTMENT MODEL ====================
const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
    defaultValue: 'PENDING',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'appointments',
  timestamps: true,
});

// ==================== TIME BLOCK MODEL ====================
const TimeBlock = sequelize.define('TimeBlock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  recurringDays: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'time_blocks',
  timestamps: true,
});

// ==================== PAYMENT MODEL ====================
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('CASH', 'CARD', 'TRANSFER', 'CHECK', 'OTHER'),
    defaultValue: 'CASH',
  },
  concept: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('INCOME', 'EXPENSE'),
    defaultValue: 'INCOME',
  },
  paidAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

// ==================== DEBT MODEL ====================
const Debt = sequelize.define('Debt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PARTIAL', 'PAID'),
    defaultValue: 'PENDING',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'debts',
  timestamps: true,
});

// ==================== PROVIDER MODEL ====================
const Provider = sequelize.define('Provider', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rut: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contactName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'providers',
  timestamps: true,
});

// ==================== NOTIFICATION MODEL ====================
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('EMAIL', 'WHATSAPP', 'SMS', 'PUSH'),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED', 'DELIVERED'),
    defaultValue: 'PENDING',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

// ==================== PROFESSIONAL NOTE MODEL ====================
const ProfessionalNote = sequelize.define('ProfessionalNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'professional_notes',
  timestamps: true,
});

// ==================== ATTACHMENT MODEL ====================
const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fileType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'attachments',
  timestamps: true,
});

// ==================== DEFINE RELATIONSHIPS ====================

// Clinic relationships
Clinic.hasMany(User, { foreignKey: 'clinicId', as: 'users' });
Clinic.hasMany(Patient, { foreignKey: 'clinicId', as: 'patients' });
Clinic.hasMany(Professional, { foreignKey: 'clinicId', as: 'professionals' });
Clinic.hasMany(Service, { foreignKey: 'clinicId', as: 'services' });
Clinic.hasMany(Appointment, { foreignKey: 'clinicId', as: 'appointments' });
Clinic.hasMany(TimeBlock, { foreignKey: 'clinicId', as: 'timeBlocks' });
Clinic.hasMany(Payment, { foreignKey: 'clinicId', as: 'payments' });
Clinic.hasMany(Debt, { foreignKey: 'clinicId', as: 'debts' });
Clinic.hasMany(Provider, { foreignKey: 'clinicId', as: 'providers' });
Clinic.hasMany(Notification, { foreignKey: 'clinicId', as: 'notifications' });
Clinic.hasMany(ProfessionalNote, { foreignKey: 'clinicId', as: 'professionalNotes' });

User.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Patient.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Professional.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Service.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Appointment.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
TimeBlock.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Payment.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Debt.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Provider.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
Notification.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
ProfessionalNote.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });

// Appointment relationships
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Appointment.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });

Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
Service.hasMany(Appointment, { foreignKey: 'serviceId', as: 'appointments' });
Professional.hasMany(Appointment, { foreignKey: 'professionalId', as: 'appointments' });

// TimeBlock relationships
TimeBlock.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });
Professional.hasMany(TimeBlock, { foreignKey: 'professionalId', as: 'timeBlocks' });

// Payment relationships
Payment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Payment.belongsTo(Debt, { foreignKey: 'debtId', as: 'debt' });
Payment.belongsTo(Provider, { foreignKey: 'providerId', as: 'provider' });

Patient.hasMany(Payment, { foreignKey: 'patientId', as: 'payments' });
Appointment.hasMany(Payment, { foreignKey: 'appointmentId', as: 'payments' });
Debt.hasMany(Payment, { foreignKey: 'debtId', as: 'payments' });
Provider.hasMany(Payment, { foreignKey: 'providerId', as: 'payments' });

// Debt relationships
Debt.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Debt.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

Patient.hasMany(Debt, { foreignKey: 'patientId', as: 'debts' });
Appointment.hasOne(Debt, { foreignKey: 'appointmentId', as: 'debt' });

// Notification relationships
Notification.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Notification.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Notification.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });

Patient.hasMany(Notification, { foreignKey: 'patientId', as: 'notifications' });
Appointment.hasMany(Notification, { foreignKey: 'appointmentId', as: 'notifications' });
User.hasMany(Notification, { foreignKey: 'sentBy', as: 'sentNotifications' });

// Professional Note relationships
ProfessionalNote.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
ProfessionalNote.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });
ProfessionalNote.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
ProfessionalNote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Patient.hasMany(ProfessionalNote, { foreignKey: 'patientId', as: 'professionalNotes' });
Professional.hasMany(ProfessionalNote, { foreignKey: 'professionalId', as: 'professionalNotes' });
Appointment.hasMany(ProfessionalNote, { foreignKey: 'appointmentId', as: 'professionalNotes' });
User.hasMany(ProfessionalNote, { foreignKey: 'createdBy', as: 'createdNotes' });

// Attachment relationships
Attachment.belongsTo(ProfessionalNote, { foreignKey: 'noteId', as: 'note' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

ProfessionalNote.hasMany(Attachment, { foreignKey: 'noteId', as: 'attachments' });
User.hasMany(Attachment, { foreignKey: 'uploadedBy', as: 'uploadedAttachments' });

module.exports = {
  sequelize,
  Clinic,
  User,
  Patient,
  Professional,
  Service,
  Appointment,
  TimeBlock,
  Payment,
  Debt,
  Provider,
  Notification,
  ProfessionalNote,
  Attachment,
};
