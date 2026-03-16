import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  CalendarDays,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  User,
  Stethoscope,
} from 'lucide-react';
import type { Cita, Paciente, Pago, Deuda } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  pacientes: Paciente[];
  citas: Cita[];
  pagos: Pago[];
  deudas: Deuda[];
  onCambiarVista: (vista: 'pacientes' | 'agenda' | 'pagos') => void;
}

export function Dashboard({
  pacientes,
  citas,
  pagos,
  deudas,
  onCambiarVista,
}: DashboardProps) {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    citasHoy: 0,
    ingresosMes: 0,
    deudaTotal: 0,
  });

  const [proximasCitas, setProximasCitas] = useState<Cita[]>([]);
  const [deudasRecientes, setDeudasRecientes] = useState<Deuda[]>([]);

  useEffect(() => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const inicioMes = format(new Date(), 'yyyy-MM-01');

    setStats({
      totalPacientes: pacientes.length,
      citasHoy: citas.filter((c) => c.fecha === hoy).length,
      ingresosMes: pagos
        .filter((p) => p.fecha >= inicioMes)
        .reduce((sum, p) => sum + p.monto, 0),
      deudaTotal: deudas.reduce((sum, d) => sum + d.deudaPendiente, 0),
    });

    // Próximas 5 citas
    const proximas = citas
      .filter(
        (c) =>
          c.fecha >= hoy &&
          (c.estado === 'pendiente' || c.estado === 'confirmada')
      )
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora}`);
        const fechaB = new Date(`${b.fecha}T${b.hora}`);
        return fechaA.getTime() - fechaB.getTime();
      })
      .slice(0, 5);
    setProximasCitas(proximas);

    // Top 5 deudas
    setDeudasRecientes(deudas.slice(0, 5));
  }, [pacientes, citas, pagos, deudas]);

  const statCards = [
    {
      title: 'Total Pacientes',
      value: stats.totalPacientes,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      onClick: () => onCambiarVista('pacientes'),
    },
    {
      title: 'Citas Hoy',
      value: stats.citasHoy,
      icon: CalendarDays,
      color: 'from-cyan-500 to-cyan-600',
      onClick: () => onCambiarVista('agenda'),
    },
    {
      title: 'Ingresos del Mes',
      value: `$${stats.ingresosMes.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => onCambiarVista('pagos'),
    },
    {
      title: 'Deuda Total',
      value: `$${stats.deudaTotal.toFixed(2)}`,
      icon: AlertCircle,
      color: 'from-amber-500 to-amber-600',
      onClick: () => onCambiarVista('pagos'),
    },
  ];

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completada: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelada: 'bg-red-100 text-red-800 border-red-200',
      'no-asistio': 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return styles[estado] || styles.pendiente;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={stat.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Citas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              Próximas Citas
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-600"
              onClick={() => onCambiarVista('agenda')}
            >
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {proximasCitas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <CalendarDays className="h-12 w-12 mb-2" />
                  <p>No hay citas programadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proximasCitas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {cita.pacienteNombre}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {cita.tratamientoNombre}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          {format(parseISO(cita.fecha), 'EEE d MMM', {
                            locale: es,
                          })}
                        </p>
                        <p className="text-sm text-slate-500">{cita.hora}</p>
                        <Badge variant="outline" className={getEstadoBadge(cita.estado)}>
                          {cita.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Deudas Pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Deudas Pendientes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-600"
              onClick={() => onCambiarVista('pagos')}
            >
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {deudasRecientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <TrendingUp className="h-12 w-12 mb-2" />
                  <p>No hay deudas pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deudasRecientes.map((deuda) => (
                    <div
                      key={deuda.pacienteId}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {deuda.pacienteNombre}
                          </p>
                          <p className="text-sm text-slate-500">
                            Total tratamientos: ${deuda.totalTratamientos.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">
                          ${deuda.deudaPendiente.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400">Pendiente</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
