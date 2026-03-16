import { useState, useEffect, useCallback } from 'react';
import type { Pago } from '@/types';

const STORAGE_KEY = 'dental_pagos';

export function usePagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPagos(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing pagos:', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pagos));
    }
  }, [pagos, loading]);

  const addPago = useCallback((pago: Omit<Pago, 'id'>) => {
    const newPago: Pago = {
      ...pago,
      id: crypto.randomUUID(),
    };
    setPagos(prev => [...prev, newPago]);
    return newPago;
  }, []);

  const updatePago = useCallback((id: string, updates: Partial<Pago>) => {
    setPagos(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePago = useCallback((id: string) => {
    setPagos(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPagoById = useCallback((id: string) => {
    return pagos.find(p => p.id === id);
  }, [pagos]);

  const getPagosByPaciente = useCallback((pacienteId: string) => {
    return pagos
      .filter(p => p.pacienteId === pacienteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [pagos]);

  const getPagosByFecha = useCallback((fechaInicio: string, fechaFin: string) => {
    return pagos.filter(p => p.fecha >= fechaInicio && p.fecha <= fechaFin);
  }, [pagos]);

  const getTotalPagosPorPaciente = useCallback((pacienteId: string) => {
    return pagos
      .filter(p => p.pacienteId === pacienteId)
      .reduce((total, p) => total + p.monto, 0);
  }, [pagos]);

  const getUltimoPago = useCallback((pacienteId: string) => {
    const pagosPaciente = pagos
      .filter(p => p.pacienteId === pacienteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return pagosPaciente[0] || null;
  }, [pagos]);

  return {
    pagos,
    loading,
    addPago,
    updatePago,
    deletePago,
    getPagoById,
    getPagosByPaciente,
    getPagosByFecha,
    getTotalPagosPorPaciente,
    getUltimoPago,
  };
}
