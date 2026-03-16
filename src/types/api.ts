// Tipos para la API de ClinicPro

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'STAFF';
  isActive: boolean;
  clinicId: string | null;
  clinic?: Clinic;
  createdAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  plan: string;
  whatsappEnabled: boolean;
  settings?: ClinicSettings;
  createdAt: string;
}

export interface ClinicSettings {
  id: string;
  clinicId: string;
  businessHours: Record<string, { open: string | null; close: string | null }>;
  appointmentDuration: number;
  timeSlotInterval: number;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderTime: string;
  customFields: any[];
}

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  medicalHistory?: string;
  allergies?: string;
  notes?: string;
  customData?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  _count?: {
    appointments: number;
    payments: number;
  };
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface WorkingHours {
  monday: { start: string; end: string } | null;
  tuesday: { start: string; end: string } | null;
  wednesday: { start: string; end: string } | null;
  thursday: { start: string; end: string } | null;
  friday: { start: string; end: string } | null;
  saturday: { start: string; end: string } | null;
  sunday: { start: string; end: string } | null;
}

export interface Professional {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty?: string;
  color: string;
  isActive: boolean;
  workingHours: WorkingHours;
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  clinicId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  serviceId: string;
  service: {
    id: string;
    name: string;
    duration: number;
  };
  professionalId?: string;
  professional?: Professional;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  notes?: string;
  notificationSent: boolean;
  reminderSent: boolean;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';

export interface Payment {
  id: string;
  clinicId: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  appointmentId?: string;
  appointment?: {
    id: string;
    date: string;
    service: { name: string };
  };
  amount: number;
  method: PaymentMethod;
  concept: string;
  notes?: string;
  paidAt: string;
}

export interface Debt {
  patientId: string;
  patientName: string;
  phone: string;
  email: string;
  totalServices: number;
  totalPaid: number;
  debt: number;
  hasDebt: boolean;
}

export interface Notification {
  id: string;
  clinicId: string;
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage?: string;
  appointmentId?: string;
  sentAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalServices: number;
  todayAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  completedThisMonth: number;
  todayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  totalDebt: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent: {
    patients: Patient[];
    appointments: Appointment[];
    payments: Payment[];
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
