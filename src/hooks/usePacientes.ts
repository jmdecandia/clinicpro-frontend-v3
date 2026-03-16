import { useState, useEffect, useCallback } from 'react';
import type { Paciente } from '@/types';

const STORAGE_KEY = 'dental_pacientes';

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar pacientes desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPacientes(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing pacientes:', e);
      }
    }
    setLoading(false);
  }, []);

  // Guardar en localStorage cuando cambien los pacientes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
    }
  }, [pacientes, loading]);

  const addPaciente = useCallback((paciente: Omit<Paciente, 'id' | 'fechaRegistro'>) => {
    const newPaciente: Paciente = {
      ...paciente,
      id: crypto.randomUUID(),
      fechaRegistro: new Date().toISOString().split('T')[0],
    };
    setPacientes(prev => [...prev, newPaciente]);
    return newPaciente;
  }, []);

  const updatePaciente = useCallback((id: string, updates: Partial<Paciente>) => {
    setPacientes(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePaciente = useCallback((id: string) => {
    setPacientes(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPacienteById = useCallback((id: string) => {
    return pacientes.find(p => p.id === id);
  }, [pacientes]);

  const searchPacientes = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return pacientes.filter(
      p =>
        p.nombre.toLowerCase().includes(lowerQuery) ||
        p.apellido.toLowerCase().includes(lowerQuery) ||
        p.email.toLowerCase().includes(lowerQuery) ||
        p.telefono.includes(query)
    );
  }, [pacientes]);

  return {
    pacientes,
    loading,
    addPaciente,
    updatePaciente,
    deletePaciente,
    getPacienteById,
    searchPacientes,
  };
}
