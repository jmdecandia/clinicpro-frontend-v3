import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Users,
  CalendarDays,
  DollarSign,
  AlertCircle,
  Clock,
  ChevronRight,
  User,
  Stethoscope,
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { dashboardApi, appointmentApi, paymentApi, debtApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DashboardData, Appointment } from '@/types/api';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type DashboardDebt = {
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
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, clinic, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);
  const [debts, setDebts] = useState<{ debts: DashboardDebt[]; summary: any } | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadTodayAppointments();
    loadPaymentSummary();
    loadDebts();
    generateWeeklyRevenue();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getData();
      setData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAppointments = async () => {
    try {
      const response = await appointmentApi.getToday();
      setTodayAppointments(response.data);
    } catch (error) {
      console.error('Error loading today appointments:', error);
    }
  };

  const loadPaymentSummary = async () => {
    try {
      const response = await paymentApi.getSummary();
      setPaymentSummary(response.data);
    } catch (error) {
      console.error('Error loading payment summary:', error);
    }
  };

  const loadDebts = async () => {
    try {
      const response = await debtApi.list();
      setDebts(response.data);
    } catch (error) {
      console.error('Error loading debts:', error);
    }
  };

  const generateWeeklyRevenue = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const data = days.map(day => ({
      day: format(day, 'EEE', { locale: es }),
      fullDate: day,
      revenue: Math.floor(Math.random() * 500) + 100, // Datos de ejemplo
    }));
    
    setWeeklyRevenue(data);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      NO_SHOW: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No asistió',
    };
    return { style: styles[status] || styles.PENDING, label: labels[status] || status };
  };

  const statCards = [
    {
      title: 'Total Pacientes',
      value: data?.stats.totalPatients || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/patients'),
    },
    {
      title: 'Citas Hoy',
      value: data?.stats.todayAppointments || 0,
      icon: CalendarDays,
      color: 'from-cyan-500 to-cyan-600',
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'Ingresos del Mes',
      value: `$${(paymentSummary?.month || data?.stats.monthRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => navigate('/payments'),
    },
    {
      title: 'Ingresos Hoy',
      value: `$${(paymentSummary?.today || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      onClick: () => navigate('/payments'),
    },
  ];

  const revenueCards = [
    {
      title: 'Ingresos del Año',
      value: `$${(paymentSummary?.year || 0).toFixed(2)}`,
      icon: Calendar,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Total Facturado',
      value: `$${(paymentSummary?.total || 0).toFixed(2)}`,
      icon: CreditCard,
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Deuda Total',
      value: `$${(data?.stats.totalDebt || 0).toFixed(2)}`,
      icon: AlertCircle,
      trend: '-5%',
      trendUp: false,
    },
    {
      title: 'Promedio Diario',
      value: `$${((paymentSummary?.month || 0) / 30).toFixed(2)}`,
      icon: TrendingUp,
      trend: '+3%',
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            ¡Hola, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-500">
            {clinic ? clinic.name : 'Panel de Super Administrador'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => navigate('/admin/clinics')} variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Gestionar Clínicas
          </Button>
        )}
      </div>

      {/* Stats Cards Principales */}
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

      {/* Resumen de ingresos y métricas financieras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Resumen de ingresos y métricas financieras
          </CardTitle>
          <CardDescription>
            Visualización de rendimiento financiero de la clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {revenueCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-500">{card.title}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-xl font-bold text-slate-900">{card.value}</p>
                    <span className={`text-xs font-medium flex items-center gap-1 ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {card.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráfico de Ingresos Semanales */}
          <div className="h-[250px]">
            <p className="text-sm font-medium text-slate-700 mb-4">Ingresos de la Semana</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value}`, 'Ingresos']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#colorRevenue)" 
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Citas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              Citas de Hoy
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-600"
              onClick={() => navigate('/appointments')}
            >
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {todayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <CalendarDays className="h-12 w-12 mb-2" />
                  <p>No hay citas programadas para hoy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => {
                    const status = getStatusBadge(appointment.status);
                    return (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Stethoscope className="h-3 w-3" />
                              {appointment.service.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">{appointment.time}</p>
                          <Badge variant="outline" className={status.style}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Próximas Citas (Próximos días - solo futuras) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              Próximas Citas
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-600"
              onClick={() => navigate('/appointments')}
            >
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const upcomingAppointments = data?.recent.appointments.filter(
                  (a) => a.date > today && (a.status === 'PENDING' || a.status === 'CONFIRMED')
                ) || [];
                
                if (upcomingAppointments.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <CalendarDays className="h-12 w-12 mb-2" />
                      <p>No hay citas próximas</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 5).map((appointment) => {
                      const status = getStatusBadge(appointment.status);
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </p>
                              <p className="text-sm text-slate-500">
                                {appointment.service.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900">
                              {format(parseISO(appointment.date), 'EEE d MMM', { locale: es })}
                            </p>
                            <p className="text-sm text-slate-500">{appointment.time}</p>
                            <Badge variant="outline" className={status.style}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Pacientes Recientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Pacientes Recientes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-cyan-600"
            onClick={() => navigate('/patients')}
          >
            Ver todos
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data?.recent.patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/patients?id=${patient.id}`)}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-slate-900 truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {patient.createdAt ? format(parseISO(patient.createdAt), 'dd MMM yyyy', { locale: es }) : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sección de Deudores */}
      {debts && debts.summary.pendingCount > 0 && (
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Deudores
              <Badge variant="destructive" className="ml-2">
                {debts.summary.pendingCount}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => navigate('/patients?view=debts')}
            >
              Gestionar deudas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {debts.debts
                .filter((d) => d.status === 'PENDING' || d.status === 'PARTIAL')
                .slice(0, 6)
                .map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/patients?id=${debt.patientId}&view=debt`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {debt.patient?.firstName?.[0]}{debt.patient?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {debt.patient?.firstName} {debt.patient?.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{debt.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        ${debt.remainingAmount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        de ${debt.amount?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            {debts.summary.pendingCount > 6 && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Y {debts.summary.pendingCount - 6} deudor(es) más...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
