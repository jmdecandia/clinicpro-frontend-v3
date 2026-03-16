import { useState, useEffect, useCallback } from 'react';
import type { Cita } from '@/types';
import { format, addDays } from 'date-fns';

const STORAGE_KEY = 'dental_citas';

export function useCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCitas(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing citas:', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(citas));
    }
  }, [citas, loading]);

  const addCita = useCallback((cita: Omit<Cita, 'id' | 'notificacionEnviada' | 'recordatorioEnviado'>) => {
    const newCita: Cita = {
      ...cita,
      id: crypto.randomUUID(),
      notificacionEnviada: false,
      recordatorioEnviado: false,
    };
    setCitas(prev => [...prev, newCita]);
    return newCita;
  }, []);

  const updateCita = useCallback((id: string, updates: Partial<Cita>) => {
    setCitas(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteCita = useCallback((id: string) => {
    setCitas(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCitaById = useCallback((id: string) => {
    return citas.find(c => c.id === id);
  }, [citas]);

  const getCitasByFecha = useCallback((fecha: string) => {
    return citas.filter(c => c.fecha === fecha);
  }, [citas]);

  const getCitasByPaciente = useCallback((pacienteId: string) => {
    return citas.filter(c => c.pacienteId === pacienteId);
  }, [citas]);

  const getCitasByRango = useCallback((fechaInicio: string, fechaFin: string) => {
    return citas.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin);
  }, [citas]);

  const getCitasPendientes = useCallback(() => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    return citas.filter(c => c.fecha >= hoy && (c.estado === 'pendiente' || c.estado === 'confirmada'));
  }, [citas]);

  const getCitasParaRecordatorio = useCallback((diasAntes: number = 1) => {
    const fechaRecordatorio = format(addDays(new Date(), diasAntes), 'yyyy-MM-dd');
    return citas.filter(
      c => c.fecha === fechaRecordatorio && 
           (c.estado === 'pendiente' || c.estado === 'confirmada') &&
           !c.recordatorioEnviado
    );
  }, [citas]);

  const getProximasCitas = useCallback((cantidad: number = 5) => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    return citas
      .filter(c => c.fecha >= hoy && (c.estado === 'pendiente' || c.estado === 'confirmada'))
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora}`);
        const fechaB = new Date(`${b.fecha}T${b.hora}`);
        return fechaA.getTime() - fechaB.getTime();
      })
      .slice(0, cantidad);
  }, [citas]);

  const marcarNotificacionEnviada = useCallback((id: string) => {
    setCitas(prev =>
      prev.map(c => (c.id === id ? { ...c, notificacionEnviada: true } : c))
    );
  }, []);

  const marcarRecordatorioEnviado = useCallback((id: string) => {
    setCitas(prev =>
      prev.map(c => (c.id === id ? { ...c, recordatorioEnviado: true } : c))
    );
  }, []);

  return {
    citas,
    loading,
    addCita,
    updateCita,
    deleteCita,
    getCitaById,
    getCitasByFecha,
    getCitasByPaciente,
    getCitasByRango,
    getCitasPendientes,
    getCitasParaRecordatorio,
    getProximasCitas,
    marcarNotificacionEnviada,
    marcarRecordatorioEnviado,
  };
}
