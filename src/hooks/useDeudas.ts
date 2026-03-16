import { useState, useEffect, useCallback } from 'react';
import type { Deuda, Cita, Pago } from '@/types';

export function useDeudas(citas: Cita[], pagos: Pago[]) {
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  const calcularDeudas = useCallback(() => {
    // Agrupar citas completadas por paciente
    const citasPorPaciente = citas
      .filter(c => c.estado === 'completada')
      .reduce((acc, cita) => {
        if (!acc[cita.pacienteId]) {
          acc[cita.pacienteId] = {
            pacienteId: cita.pacienteId,
            pacienteNombre: cita.pacienteNombre,
            totalTratamientos: 0,
          };
        }
        acc[cita.pacienteId].totalTratamientos += cita.precio;
        return acc;
      }, {} as Record<string, { pacienteId: string; pacienteNombre: string; totalTratamientos: number }>);

    // Agrupar pagos por paciente
    const pagosPorPaciente = pagos.reduce((acc, pago) => {
      if (!acc[pago.pacienteId]) {
        acc[pago.pacienteId] = {
          totalPagado: 0,
          ultimoPago: pago.fecha,
        };
      }
      acc[pago.pacienteId].totalPagado += pago.monto;
      if (pago.fecha > acc[pago.pacienteId].ultimoPago) {
        acc[pago.pacienteId].ultimoPago = pago.fecha;
      }
      return acc;
    }, {} as Record<string, { totalPagado: number; ultimoPago: string }>);

    // Combinar datos
    const todasLasDeudas: Deuda[] = Object.values(citasPorPaciente).map(
      ({ pacienteId, pacienteNombre, totalTratamientos }) => {
        const pagoInfo = pagosPorPaciente[pacienteId] || { totalPagado: 0, ultimoPago: undefined };
        return {
          pacienteId,
          pacienteNombre,
          totalTratamientos,
          totalPagado: pagoInfo.totalPagado,
          deudaPendiente: Math.max(0, totalTratamientos - pagoInfo.totalPagado),
          ultimoPago: pagoInfo.ultimoPago,
        };
      }
    );

    // Filtrar solo los que tienen deuda pendiente y ordenar por monto
    const deudasPendientes = todasLasDeudas
      .filter(d => d.deudaPendiente > 0)
      .sort((a, b) => b.deudaPendiente - a.deudaPendiente);

    setDeudas(deudasPendientes);
    return deudasPendientes;
  }, [citas, pagos]);

  useEffect(() => {
    calcularDeudas();
  }, [calcularDeudas]);

  const getDeudaByPaciente = useCallback(
    (pacienteId: string) => {
      return deudas.find(d => d.pacienteId === pacienteId);
    },
    [deudas]
  );

  const getTotalDeudas = useCallback(() => {
    return deudas.reduce((total, d) => total + d.deudaPendiente, 0);
  }, [deudas]);

  const getTotalCobrado = useCallback(() => {
    return pagos.reduce((total, p) => total + p.monto, 0);
  }, [pagos]);

  const getTotalTratamientos = useCallback(() => {
    return citas
      .filter(c => c.estado === 'completada')
      .reduce((total, c) => total + c.precio, 0);
  }, [citas]);

  return {
    deudas,
    calcularDeudas,
    getDeudaByPaciente,
    getTotalDeudas,
    getTotalCobrado,
    getTotalTratamientos,
  };
}
