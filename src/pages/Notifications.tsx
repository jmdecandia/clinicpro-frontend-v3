import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Smartphone,
  Info,
} from 'lucide-react';
import { notificationApi, appointmentApi } from '@/services/api';
import type { Notification, Appointment } from '@/types/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config] = useState({
    enviarEmail: false,
    enviarWhatsApp: true,
    diasRecordatorio: 1,
    horaRecordatorio: '18:00',
  });

  useEffect(() => {
    loadData();
    checkEmailConfig();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifRes, appointRes] = await Promise.all([
        notificationApi.list(),
        appointmentApi.list({ status: 'PENDING' }),
      ]);
      setNotifications(notifRes.data.data);
      setAppointments(appointRes.data.data.filter((a: Appointment) => !a.notificationSent));
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailConfig = async () => {
    try {
      const response = await notificationApi.checkEmailConfig();
      setEmailConfigured(response.data.configured);
    } catch (error) {
      console.error('Error checking email config:', error);
    }
  };

  const handleSendNotification = async (appointment: Appointment) => {
    try {
      const message = `Hola ${appointment.patient.firstName},

Tu cita ha sido agendada:

📅 Fecha: ${format(parseISO(appointment.date), 'EEEE d MMMM yyyy', { locale: es })}
🕐 Hora: ${appointment.time}
🦷 Servicio: ${appointment.service.name}
💰 Precio: $${appointment.price.toFixed(2)}

Te esperamos en nuestra clínica.

Saludos,
Clínica`;

      const response = await notificationApi.send({
        patientId: appointment.patientId,
        type: 'WHATSAPP',
        subject: 'Confirmación de cita',
        message,
        appointmentId: appointment.id,
      });

      if (response.data.whatsappUrl) {
        window.open(response.data.whatsappUrl, '_blank');
      }

      toast.success('WhatsApp Web abierto');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar notificación');
    }
  };

  const handleSendReminders = async () => {
    try {
      const response = await notificationApi.sendReminders(config.diasRecordatorio);
      toast.success(`${response.data.reminders.length} recordatorios preparados`);
      if (response.data.reminders.length > 0 && response.data.reminders[0].whatsappUrl) {
        window.open(response.data.reminders[0].whatsappUrl, '_blank');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar recordatorios');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <Smartphone className="h-4 w-4" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Centro de Notificaciones</h2>
          <p className="text-sm text-slate-500">
            Gestiona las notificaciones y recordatorios para tus pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSendReminders} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Send className="h-4 w-4 mr-2" />
            Enviar Recordatorios
          </Button>
        </div>
      </div>

      {/* Alerta de configuración EmailJS */}
      {!emailConfigured && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Configuración de Email requerida</p>
                <p className="text-sm text-amber-700 mt-1">
                  Para enviar emails reales, necesitas configurar EmailJS. WhatsApp Web ya está disponible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Notificaciones</p>
                <p className="text-xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Enviadas</p>
                <p className="text-xl font-bold">
                  {notifications.filter((n) => n.status === 'SENT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-xl font-bold">
                  {notifications.filter((n) => n.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Con Error</p>
                <p className="text-xl font-bold">
                  {notifications.filter((n) => n.status === 'FAILED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Citas sin Notificación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <CheckCircle className="h-12 w-12 mb-2" />
                    <p>Todas las citas tienen notificación enviada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((cita) => (
                      <div
                        key={cita.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {cita.patient.firstName} {cita.patient.lastName}
                            </p>
                            <p className="text-sm text-slate-500">{cita.service.name}</p>
                            <p className="text-sm text-slate-500">
                              {format(parseISO(cita.date), 'dd MMM yyyy', { locale: es })} - {cita.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendNotification(cita)}
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                Historial de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Bell className="h-12 w-12 mb-2" />
                    <p>No hay notificaciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            {getTipoIcon(notif.type)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{notif.subject}</p>
                            <p className="text-sm text-slate-500">{notif.message.substring(0, 60)}...</p>
                            <p className="text-xs text-slate-400">
                              {format(parseISO(notif.sentAt), 'dd MMM yyyy HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notif.status)}
                          <Badge variant="outline" className={getStatusBadge(notif.status)}>
                            {notif.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
