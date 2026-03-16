import { useState, useEffect, useCallback } from 'react';
import type { Tratamiento } from '@/types';

const STORAGE_KEY = 'dental_tratamientos';

export function useTratamientos() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTratamientos(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing tratamientos:', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tratamientos));
    }
  }, [tratamientos, loading]);

  const addTratamiento = useCallback((tratamiento: Omit<Tratamiento, 'id'>) => {
    const newTratamiento: Tratamiento = {
      ...tratamiento,
      id: crypto.randomUUID(),
    };
    setTratamientos(prev => [...prev, newTratamiento]);
    return newTratamiento;
  }, []);

  const updateTratamiento = useCallback((id: string, updates: Partial<Tratamiento>) => {
    setTratamientos(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTratamiento = useCallback((id: string) => {
    setTratamientos(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTratamientoById = useCallback((id: string) => {
    return tratamientos.find(t => t.id === id);
  }, [tratamientos]);

  const getTratamientosActivos = useCallback(() => {
    return tratamientos.filter(t => t.activo);
  }, [tratamientos]);

  return {
    tratamientos,
    loading,
    addTratamiento,
    updateTratamiento,
    deleteTratamiento,
    getTratamientoById,
    getTratamientosActivos,
  };
}
