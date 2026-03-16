import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Settings,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Info,
  Copy,
} from 'lucide-react';
import type { Notificacion, Cita, Paciente } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { isEmailJSConfigured, getEmailJSInstructions } from '@/config/notifications';

interface NotificacionesProps {
  notificaciones: Notificacion[];
  citas: Cita[];
  pacientes: Paciente[];
  onEnviarNotificacion: (cita: Cita, tipo: 'email' | 'sms' | 'whatsapp') => void;
  onEnviarRecordatorios: () => void;
}

export function NotificacionesSection({
  notificaciones,
  citas,
  onEnviarNotificacion,
  onEnviarRecordatorios,
}: NotificacionesProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [config, setConfig] = useState({
    enviarEmail: true,
    enviarSMS: false,
    enviarWhatsApp: true,
    diasRecordatorio: 1,
    horaRecordatorio: '18:00',
  });

  const emailConfigured = isEmailJSConfigured();
  const notificacionesRecientes = [...notificaciones]
    .sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime())
    .slice(0, 50);

  const citasPendientesNotificacion = citas.filter(
    (c) =>
      (c.estado === 'pendiente' || c.estado === 'confirmada') &&
      !c.notificacionEnviada
  );

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'enviada':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'enviada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleEnviarNotificacion = (cita: Cita, tipo: 'email' | 'sms' | 'whatsapp') => {
    onEnviarNotificacion(cita, tipo);
  };

  const copyInstructions = () => {
    navigator.clipboard.writeText(getEmailJSInstructions());
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Centro de Notificaciones
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona las notificaciones y recordatorios para tus pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Configuración de Notificaciones</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-slate-900">
                    Canales de notificación
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <p className="text-xs text-slate-400">
                          {emailConfigured ? 'Configurado ✅' : 'No configurado'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email"
                      checked={config.enviarEmail}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enviarEmail: checked })
                      }
                      disabled={!emailConfigured}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-slate-500" />
                      <div>
                        <Label htmlFor="sms">SMS</Label>
                        <p className="text-xs text-slate-400">Próximamente</p>
                      </div>
                    </div>
                    <Switch
                      id="sms"
                      checked={config.enviarSMS}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enviarSMS: checked })
                      }
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <p className="text-xs text-slate-400">WhatsApp Web</p>
                      </div>
                    </div>
                    <Switch
                      id="whatsapp"
                      checked={config.enviarWhatsApp}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enviarWhatsApp: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-slate-900">
                    Recordatorios automáticos
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Días antes</Label>
                      <Select
                        value={config.diasRecordatorio.toString()}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            diasRecordatorio: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 día</SelectItem>
                          <SelectItem value="2">2 días</SelectItem>
                          <SelectItem value="3">3 días</SelectItem>
                          <SelectItem value="7">1 semana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora de envío</Label>
                      <Select
                        value={config.horaRecordatorio}
                        onValueChange={(hora) =>
                          setConfig({ ...config, horaRecordatorio: hora })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="20:00">8:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={() => setConfigOpen(false)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  Guardar Configuración
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={onEnviarRecordatorios}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
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
                <p className="font-medium text-amber-900">
                  Configuración de Email requerida
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Para enviar emails reales, necesitas configurar EmailJS. 
                  WhatsApp Web ya está disponible.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-white"
                  onClick={() => setInstructionsOpen(true)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver instrucciones de configuración
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de instrucciones */}
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar EmailJS para envío de emails</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>EmailJS</strong> es un servicio gratuito que permite enviar emails 
                directamente desde el navegador sin necesidad de servidor backend.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Pasos para configurar:</h4>
              
              <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                <li>
                  Ve a <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline">https://www.emailjs.com/</a> y crea una cuenta gratuita
                </li>
                <li>
                  Crea un <strong>Email Service</strong> (conecta Gmail, Outlook, etc.)
                </li>
                <li>
                  Crea un <strong>Email Template</strong> con estas variables:
                  <ul className="ml-6 mt-2 space-y-1 text-slate-500 list-disc">
                    <li><code>{'{{to_email}}'}</code> - Email del destinatario</li>
                    <li><code>{'{{to_name}}'}</code> - Nombre del paciente</li>
                    <li><code>{'{{subject}}'}</code> - Asunto del email</li>
                    <li><code>{'{{message}}'}</code> - Mensaje completo</li>
                    <li><code>{'{{fecha}}'}</code> - Fecha de la cita</li>
                    <li><code>{'{{hora}}'}</code> - Hora de la cita</li>
                    <li><code>{'{{tratamiento}}'}</code> - Nombre del tratamiento</li>
                    <li><code>{'{{precio}}'}</code> - Precio del tratamiento</li>
                  </ul>
                </li>
                <li>
                  Copia tu <strong>Public Key</strong>, <strong>Service ID</strong> y <strong>Template ID</strong>
                </li>
                <li>
                  Edita el archivo <code>src/config/notifications.ts</code> y reemplaza:
                  <div className="mt-2 p-3 bg-slate-900 rounded-lg text-xs font-mono text-green-400">
                    <div>PUBLIC_KEY: 'TU_PUBLIC_KEY',</div>
                    <div>SERVICE_ID: 'TU_SERVICE_ID',</div>
                    <div>TEMPLATE_ID: 'TU_TEMPLATE_ID',</div>
                    <div>ENABLED: true,</div>
                  </div>
                </li>
                <li>¡Listo! Los emails se enviarán realmente</li>
              </ol>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <strong>💡 WhatsApp ya funciona:</strong> Puedes enviar mensajes por WhatsApp 
                sin configuración adicional. Se abrirá WhatsApp Web con el mensaje predefinido.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={copyInstructions}
              className="mr-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar instrucciones
            </Button>
            <DialogClose asChild>
              <Button>Entendido</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <p className="text-xl font-bold">{notificaciones.length}</p>
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
                  {notificaciones.filter((n) => n.estado === 'enviada').length}
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
                  {notificaciones.filter((n) => n.estado === 'pendiente').length}
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
                  {notificaciones.filter((n) => n.estado === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="config">Estado</TabsTrigger>
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
                {citasPendientesNotificacion.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <CheckCircle className="h-12 w-12 mb-2" />
                    <p>Todas las citas tienen notificación enviada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {citasPendientesNotificacion.map((cita) => (
                      <div
                        key={cita.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {cita.pacienteNombre}
                            </p>
                            <p className="text-sm text-slate-500">
                              {cita.tratamientoNombre}
                            </p>
                            <p className="text-sm text-slate-500">
                              {format(parseISO(cita.fecha), 'dd MMM yyyy', {
                                locale: es,
                              })}{' '}
                              - {cita.hora}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {config.enviarEmail && emailConfigured && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleEnviarNotificacion(cita, 'email')
                              }
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                          )}
                          {config.enviarWhatsApp && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleEnviarNotificacion(cita, 'whatsapp')
                              }
                              className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
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
                {notificacionesRecientes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Bell className="h-12 w-12 mb-2" />
                    <p>No hay notificaciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notificacionesRecientes.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            {getTipoIcon(notif.tipo)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {notif.asunto}
                            </p>
                            <p className="text-sm text-slate-500">
                              {notif.mensaje.substring(0, 60)}...
                            </p>
                            <p className="text-xs text-slate-400">
                              {format(
                                parseISO(notif.fechaEnvio),
                                'dd MMM yyyy HH:mm',
                                { locale: es }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(notif.estado)}
                          <Badge
                            variant="outline"
                            className={getEstadoBadge(notif.estado)}
                          >
                            {notif.estado}
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

        <TabsContent value="config">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-slate-500" />
                  Estado de Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg border ${emailConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-3">
                    {emailConfigured ? (
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    )}
                    <div>
                      <p className={`font-medium ${emailConfigured ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {emailConfigured ? 'EmailJS Configurado' : 'EmailJS No Configurado'}
                      </p>
                      <p className={`text-sm ${emailConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {emailConfigured 
                          ? 'Los emails se enviarán realmente' 
                          : 'Los emails no se enviarán hasta configurar EmailJS'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!emailConfigured && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setInstructionsOpen(true)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver cómo configurar EmailJS
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Estado de WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-900">
                        WhatsApp Web Activado
                      </p>
                      <p className="text-sm text-emerald-700">
                        Se abrirá WhatsApp Web para completar el envío
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                  <p>
                    <strong>Nota:</strong> WhatsApp Web requiere que tengas 
                    sesión iniciada en web.whatsapp.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
