// Hook para obtener el tipo de cliente según la configuración de la clínica
import { useAuth } from '@/contexts/AuthContext';

export type ClientType = 'patient' | 'client' | 'customer' | 'guest' | 'student' | 'member';

interface ClientTypeLabels {
  singular: string;
  plural: string;
  possessive: string; // su/sus
}

const defaultLabels: Record<ClientType, ClientTypeLabels> = {
  patient: {
    singular: 'Paciente',
    plural: 'Pacientes',
    possessive: 'su',
  },
  client: {
    singular: 'Cliente',
    plural: 'Clientes',
    possessive: 'su',
  },
  customer: {
    singular: 'Cliente',
    plural: 'Clientes',
    possessive: 'su',
  },
  guest: {
    singular: 'Huésped',
    plural: 'Huéspedes',
    possessive: 'su',
  },
  student: {
    singular: 'Estudiante',
    plural: 'Estudiantes',
    possessive: 'su',
  },
  member: {
    singular: 'Miembro',
    plural: 'Miembros',
    possessive: 'su',
  },
};

export function useClientType() {
  const { clinic } = useAuth();
  
  const clientType = clinic?.clientType || 'patient';
  const customLabel = clinic?.clientTypeLabel;
  
  const getLabels = (): ClientTypeLabels => {
    if (customLabel) {
      // Si hay etiqueta personalizada, usarla
      return {
        singular: customLabel,
        plural: customLabel + 's',
        possessive: 'su',
      };
    }
    return defaultLabels[clientType] || defaultLabels.patient;
  };
  
  const labels = getLabels();
  
  return {
    clientType,
    labels,
    // Helpers para textos comunes
    singular: labels.singular,
    plural: labels.plural,
    // Funciones para construir textos
    of: (text: string) => `${text} de ${labels.singular.toLowerCase()}`,
    for: (text: string) => `${text} para ${labels.singular.toLowerCase()}`,
  };
}

// Función standalone para usar fuera de componentes React
export function getClientTypeLabels(clinic?: { clientType?: ClientType; clientTypeLabel?: string } | null): ClientTypeLabels {
  if (!clinic) return defaultLabels.patient;
  
  if (clinic.clientTypeLabel) {
    return {
      singular: clinic.clientTypeLabel,
      plural: clinic.clientTypeLabel + 's',
      possessive: 'su',
    };
  }
  
  return defaultLabels[clinic.clientType || 'patient'] || defaultLabels.patient;
}
