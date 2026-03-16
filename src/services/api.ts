import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { 
  AuthResponse, 
  LoginCredentials, 
  User, 
  Clinic, 
  ClinicSettings,
  Patient, 
  Service, 
  Appointment, 
  Payment, 
  Notification,
  DashboardData,
  Debt,
  PaginatedResponse,
  ApiError,
  Professional,
  TimeBlock
} from '@/types/api';

// Configuración base de axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clinicpro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Error de conexión - backend no disponible
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.error('❌ Backend no disponible:', API_URL);
      error.message = 'No se puede conectar con el servidor. Por favor, verifica que el backend esté ejecutándose.';
    }
    
    if (error.response?.status === 401) {
      // No redirigir si estamos en la página de login (para mostrar el error de credenciales)
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (!isLoginPage) {
        // Token expirado o inválido - solo redirigir si no estamos en login
        localStorage.removeItem('clinicpro_token');
        localStorage.removeItem('clinicpro_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  getProfile: () =>
    api.get<User>('/auth/profile'),

  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    clinicId?: string;
  }) => api.post<{ message: string; user: User }>('/auth/register', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  listUsers: () =>
    api.get<User[]>('/auth/users'),

  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/auth/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete(`/auth/users/${id}`),

  updateProfile: (data: { name?: string; email?: string; phone?: string }) =>
    api.put<User>('/auth/profile', data),
};

// ==================== USERS (Admin) ====================

export const userApi = {
  list: (params?: { clinicId?: string; role?: string; search?: string }) =>
    api.get<User[]>('/users', { params }),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  create: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    clinicId?: string;
    isActive?: boolean;
  }) => api.post<{ message: string; user: User }>('/users', data),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    api.put<User>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),
};

// ==================== CLINICS ====================

export const clinicApi = {
  list: () =>
    api.get<Clinic[]>('/clinics'),

  getBySlug: (slug: string) =>
    api.get<Clinic>(`/clinics/slug/${slug}`),

  getById: (id: string) =>
    api.get<Clinic>(`/clinics/${id}`),

  create: (data: Partial<Clinic>) =>
    api.post<{ message: string; clinic: Clinic }>('/clinics', data),

  update: (id: string, data: Partial<Clinic>) =>
    api.put<{ message: string; clinic: Clinic }>(`/clinics/${id}`, data),

  delete: (id: string) =>
    api.delete(`/clinics/${id}`),

  getStats: (id: string) =>
    api.get<{
      totalPatients: number;
      totalAppointments: number;
      todayAppointments: number;
      monthRevenue: number;
      totalDeuda: number;
    }>(`/clinics/${id}/stats`),

  updateSettings: (id: string, settings: Partial<ClinicSettings>) =>
    api.put(`/clinics/${id}/settings`, settings),
};

// ==================== PATIENTS ====================

export const patientApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Patient>>('/patients', { params }),

  getById: (id: string) =>
    api.get<Patient>(`/patients/${id}`),

  create: (data: Partial<Patient>) =>
    api.post<{ message: string; patient: Patient }>('/patients', data),

  update: (id: string, data: Partial<Patient>) =>
    api.put<{ message: string; patient: Patient }>(`/patients/${id}`, data),

  delete: (id: string) =>
    api.delete(`/patients/${id}`),

  getDebt: (id: string) =>
    api.get<{
      patientId: string;
      patientName: string;
      totalServices: number;
      totalPaid: number;
      debt: number;
      lastPayment?: string;
    }>(`/patients/${id}/debt`),
};

// ==================== SERVICES ====================

export const serviceApi = {
  list: (params?: { active?: boolean; category?: string }) =>
    api.get<Service[]>('/services', { params }),

  getCategories: () =>
    api.get<string[]>('/services/categories'),

  getById: (id: string) =>
    api.get<Service>(`/services/${id}`),

  create: (data: Partial<Service>) =>
    api.post<{ message: string; service: Service }>('/services', data),

  update: (id: string, data: Partial<Service>) =>
    api.put<{ message: string; service: Service }>(`/services/${id}`, data),

  delete: (id: string) =>
    api.delete(`/services/${id}`),
};

// ==================== PROFESSIONALS ====================

export const professionalApi = {
  list: (params?: { active?: boolean }) =>
    api.get<Professional[]>('/professionals', { params }),

  getById: (id: string) =>
    api.get<Professional>(`/professionals/${id}`),

  create: (data: Partial<Professional>) =>
    api.post<{ message: string; professional: Professional }>('/professionals', data),

  update: (id: string, data: Partial<Professional>) =>
    api.put<{ message: string; professional: Professional }>(`/professionals/${id}`, data),

  delete: (id: string) =>
    api.delete(`/professionals/${id}`),
};

// ==================== TIME BLOCKS ====================

export const timeBlockApi = {
  list: (params?: { professionalId?: string; date?: string }) =>
    api.get<TimeBlock[]>('/time-blocks', { params }),

  create: (data: Partial<TimeBlock>) =>
    api.post<{ message: string; block: TimeBlock }>('/time-blocks', data),

  delete: (id: string) =>
    api.delete(`/time-blocks/${id}`),
};

// ==================== APPOINTMENTS ====================

export const appointmentApi = {
  list: (params?: {
    date?: string;
    status?: string;
    patientId?: string;
    professionalId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<Appointment>>('/appointments', { params }),

  getToday: (professionalId?: string) =>
    api.get<Appointment[]>('/appointments/today', { params: professionalId ? { professionalId } : undefined }),

  getById: (id: string) =>
    api.get<Appointment>(`/appointments/${id}`),

  create: (data: Partial<Appointment>) =>
    api.post<{ message: string; appointment: Appointment }>('/appointments', data),

  update: (id: string, data: Partial<Appointment>) =>
    api.put<{ message: string; appointment: Appointment }>(`/appointments/${id}`, data),

  changeStatus: (id: string, status: string) =>
    api.patch<{ message: string; appointment: Appointment }>(`/appointments/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete(`/appointments/${id}`),

  getAvailability: (date: string, duration?: number, professionalId?: string) =>
    api.get<{
      availableSlots: string[];
      occupiedSlots: string[];
      timeBlocks: { start: string; end: string; reason: string }[];
    }>('/appointments/availability', { params: { date, duration, professionalId } }),
};

// ==================== PAYMENTS ====================

export const paymentApi = {
  list: (params?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<Payment>>('/payments', { params }),

  getById: (id: string) =>
    api.get<Payment>(`/payments/${id}`),

  create: (data: Partial<Payment>) =>
    api.post<{ message: string; payment: Payment }>('/payments', data),

  update: (id: string, data: Partial<Payment>) =>
    api.put<{ message: string; payment: Payment }>(`/payments/${id}`, data),

  delete: (id: string) =>
    api.delete(`/payments/${id}`),

  getSummary: () =>
    api.get<{
      today: number;
      month: number;
      year: number;
      total: number;
      pendingPayments: number;
      byMethod: Array<{ method: string; _sum: { amount: number }; _count: number }>;
    }>('/payments/summary'),

  getDebts: () =>
    api.get<{ debts: Debt[]; totalDebt: number; count: number }>('/payments/debts'),
};

// ==================== NOTIFICATIONS ====================

export const notificationApi = {
  list: (params?: { patientId?: string; status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  send: (data: {
    patientId: string;
    type: 'EMAIL' | 'SMS' | 'WHATSAPP';
    subject: string;
    message: string;
    appointmentId?: string;
  }) => api.post<{
    notification: Notification;
    whatsappUrl?: string;
    message: string;
  }>('/notifications', data),

  sendReminders: (days?: number) =>
    api.post<{
      message: string;
      reminders: Array<{
        appointment: Appointment;
        notification: Notification;
        whatsappUrl: string;
      }>;
    }>('/notifications/reminders', { days }),

  checkEmailConfig: () =>
    api.get<{
      configured: boolean;
      config: { publicKey: string; serviceId: string; templateId: string };
    }>('/notifications/config'),
};

// ==================== DEBTS ====================

export const debtApi = {
  list: (params?: { patientId?: string; status?: string }) =>
    api.get<{
      debts: Array<{
        id: string;
        patientId: string;
        patient?: {
          firstName: string;
          lastName: string;
        };
        amount: number;
        remainingAmount: number;
        paidAmount: number;
        reason: string;
        status: 'PENDING' | 'PARTIAL' | 'PAID';
        createdAt: string;
      }>;
      summary: {
        totalDebt: number;
        totalPaid: number;
        count: number;
        pendingCount: number;
      };
    }>('/debts', { params }),

  getByPatient: (patientId: string) =>
    api.get<{
      patient: {
        id: string;
        firstName: string;
        lastName: string;
      };
      debts: Array<{
        id: string;
        amount: number;
        remainingAmount: number;
        paidAmount: number;
        reason: string;
        status: 'PENDING' | 'PARTIAL' | 'PAID';
        createdAt: string;
      }>;
      totalDebt: number;
    }>(`/debts/patient/${patientId}`),

  create: (data: {
    patientId: string;
    amount: number;
    reason: string;
    appointmentId?: string;
    notes?: string;
  }) => api.post<{
    message: string;
    debt: {
      id: string;
      patientId: string;
      amount: number;
      remainingAmount: number;
      reason: string;
      status: string;
    };
  }>('/debts', data),

  addPayment: (debtId: string, data: {
    amount: number;
    method?: string;
    notes?: string;
  }) => api.post<{
    message: string;
    debt: {
      id: string;
      amount: number;
      remainingAmount: number;
      paidAmount: number;
      status: string;
    };
    payment: {
      id: string;
      amount: number;
      paidAt: string;
    };
  }>(`/debts/${debtId}/payment`, data),

  delete: (id: string) =>
    api.delete(`/debts/${id}`),
};

// ==================== PROFESSIONAL NOTES ====================

export const professionalNoteApi = {
  list: (params?: { patientId?: string; appointmentId?: string }) =>
    api.get<Array<{
      id: string;
      patientId: string;
      patient?: {
        firstName: string;
        lastName: string;
      };
      appointmentId?: string;
      professionalId: string;
      professional?: {
        firstName: string;
        lastName: string;
      };
      title: string;
      content: string;
      tags: string[];
      attachments: Array<{
        id: string;
        fileName: string;
        fileType: string;
        fileUrl: string;
        description: string;
      }>;
      createdAt: string;
    }>>('/professional-notes', { params }),

  getById: (id: string) =>
    api.get<{
      id: string;
      patientId: string;
      patient?: {
        firstName: string;
        lastName: string;
      };
      appointmentId?: string;
      professionalId: string;
      professional?: {
        firstName: string;
        lastName: string;
      };
      title: string;
      content: string;
      tags: string[];
      attachments: Array<{
        id: string;
        fileName: string;
        fileType: string;
        fileUrl: string;
        description: string;
      }>;
      createdAt: string;
    }>(`/professional-notes/${id}`),

  create: (data: {
    patientId: string;
    appointmentId?: string;
    professionalId?: string;
    title: string;
    content: string;
    tags?: string[];
  }) => api.post<{
    message: string;
    note: {
      id: string;
      patientId: string;
      title: string;
      content: string;
      createdAt: string;
    };
  }>('/professional-notes', data),

  update: (id: string, data: Partial<{
    title: string;
    content: string;
    tags: string[];
  }>) => api.put<{
    message: string;
    note: {
      id: string;
      title: string;
      content: string;
      updatedAt: string;
    };
  }>(`/professional-notes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/professional-notes/${id}`),

  addAttachment: (noteId: string, data: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    description?: string;
  }) => api.post<{
    message: string;
    attachment: {
      id: string;
      fileName: string;
      fileType: string;
      fileUrl: string;
    };
  }>(`/professional-notes/${noteId}/attachments`, data),

  deleteAttachment: (attachmentId: string) =>
    api.delete(`/attachments/${attachmentId}`),
};

// ==================== PROVIDERS ====================

export const providerApi = {
  list: (params?: { active?: boolean }) =>
    api.get<Array<{
      id: string;
      name: string;
      rut: string;
      address: string;
      phone: string;
      email: string;
      contactName: string;
      notes: string;
      isActive: boolean;
    }>>('/providers', { params }),

  getById: (id: string) =>
    api.get<{
      id: string;
      name: string;
      rut: string;
      address: string;
      phone: string;
      email: string;
      contactName: string;
      notes: string;
      isActive: boolean;
    }>(`/providers/${id}`),

  create: (data: {
    name: string;
    rut?: string;
    address?: string;
    phone?: string;
    email?: string;
    contactName?: string;
    notes?: string;
  }) => api.post<{ message: string; provider: {
      id: string;
      name: string;
      rut: string;
      address: string;
      phone: string;
      email: string;
      contactName: string;
      notes: string;
      isActive: boolean;
    } }>('/providers', data),

  update: (id: string, data: Partial<{
    name: string;
    rut: string;
    address: string;
    phone: string;
    email: string;
    contactName: string;
    notes: string;
    isActive: boolean;
  }>) => api.put<{ message: string; provider: {
      id: string;
      name: string;
      rut: string;
      address: string;
      phone: string;
      email: string;
      contactName: string;
      notes: string;
      isActive: boolean;
    } }>(`/providers/${id}`, data),

  delete: (id: string) =>
    api.delete(`/providers/${id}`),
};

// ==================== DASHBOARD ====================

export const dashboardApi = {
  getData: () =>
    api.get<DashboardData>('/dashboard'),

  getStats: (period?: 'week' | 'month' | 'year') =>
    api.get<{
      chartData: Array<{ date: string; appointments: number; revenue: number; completed: number }>;
      popularServices: Array<{ name: string; count: number }>;
    }>('/dashboard/stats', { params: { period } }),
};

export default api;
