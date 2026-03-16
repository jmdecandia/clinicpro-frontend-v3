// Tipos para la aplicación de gestión dental

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion?: string;
  historialMedico?: string;
  alergias?: string;
  fechaRegistro: string;
  notas?: string;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  categoria: 'preventivo' | 'restaurativo' | 'estetico' | 'quirurgico' | 'ortodoncia' | 'otro';
  activo: boolean;
}

export interface Cita {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  tratamientoId: string;
  tratamientoNombre: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  precio: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no-asistio';
  notas?: string;
  notificacionEnviada: boolean;
  recordatorioEnviado: boolean;
}

export interface Pago {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  citaId?: string;
  monto: number;
  fecha: string;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque' | 'otro';
  concepto: string;
  notas?: string;
}

export interface Deuda {
  pacienteId: string;
  pacienteNombre: string;
  totalTratamientos: number;
  totalPagado: number;
  deudaPendiente: number;
  ultimoPago?: string;
}

export interface Notificacion {
  id: string;
  pacienteId: string;
  tipo: 'email' | 'sms' | 'whatsapp';
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
  estado: 'pendiente' | 'enviada' | 'error';
  citaId?: string;
}

export type Vista = 'dashboard' | 'pacientes' | 'tratamientos' | 'agenda' | 'pagos' | 'notificaciones';
