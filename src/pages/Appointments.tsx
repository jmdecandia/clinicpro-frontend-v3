import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  CalendarDays,
  Clock,
  Stethoscope,
  DollarSign,
  MoreVertical,
  Trash2,
  CheckCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  FileText,
  Upload,
  Wallet,
  History,
} from 'lucide-react';
import { appointmentApi, patientApi, serviceApi, notificationApi, professionalApi, debtApi, professionalNoteApi } from '@/services/api';
import type { Appointment, Patient, Service, Professional } from '@/types/api';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
  { value: 'CONFIRMED', label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'COMPLETED', label: 'Completada', color: 'bg-blue-100 text-blue-800' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  { value: 'NO_SHOW', label: 'No asistió', color: 'bg-slate-100 text-slate-800' },
];

// Horarios predefinidos
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Formulario de cita
  const [formData, setFormData] = useState({
    patientId: '',
    serviceId: '',
    professionalId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    notes: '',
  });

  // Formulario de asistencia con notas
  const [attendanceData, setAttendanceData] = useState({
    attended: false,
    professionalNote: '',
    createDebt: false,
    debtAmount: 0,
    debtReason: 'Inasistencia a cita',
    attachments: [] as { name: string; type: string; url: string }[],
  });

  // Datos de deuda del paciente
  const [patientDebts, setPatientDebts] = useState<any[]>([]);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadServices();
    loadProfessionals();
  }, []);

  useEffect(() => {
    // Actualizar slots disponibles cuando cambia la fecha o el profesional
    updateAvailableSlots();
  }, [formData.date, formData.professionalId, appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.list({ limit: 100 });
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientApi.list({ limit: 100 });
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await serviceApi.list({ active: true });
      setServices(response.data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadProfessionals = async () => {
    try {
      const response = await professionalApi.list({ active: true });
      setProfessionals(response.data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const updateAvailableSlots = async () => {
    if (!formData.professionalId) {
      // Si no hay profesional seleccionado, mostrar todos los slots
      const dateStr = formData.date;
      const occupiedSlots = appointments
        .filter(a => a.date === dateStr && a.status !== 'CANCELLED')
        .map(a => a.time);
      const available = TIME_SLOTS.filter(slot => !occupiedSlots.includes(slot));
      setAvailableSlots(available);
      return;
    }
    
    try {
      const response = await appointmentApi.getAvailability(formData.date, 30, formData.professionalId);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error getting availability:', error);
      // Fallback
      const dateStr = formData.date;
      const occupiedSlots = appointments
        .filter(a => a.date === dateStr && a.status !== 'CANCELLED' && a.professionalId === formData.professionalId)
        .map(a => a.time);
      const available = TIME_SLOTS.filter(slot => !occupiedSlots.includes(slot));
      setAvailableSlots(available);
    }
  };

  const handleAdd = async () => {
    try {
      if (!formData.patientId || !formData.serviceId || !formData.professionalId || !formData.time) {
        toast.error('Completa todos los campos requeridos');
        return;
      }

      const service = services.find(s => s.id === formData.serviceId);
      if (!service) {
        toast.error('Servicio no encontrado');
        return;
      }

      await appointmentApi.create({
        ...formData,
        price: service.price,
        duration: service.duration,
      });

      toast.success('Cita creada exitosamente');
      setFormData({
        patientId: '',
        serviceId: '',
        professionalId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        notes: '',
      });
      setIsAddDialogOpen(false);
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear cita');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await appointmentApi.changeStatus(id, status);
      toast.success('Estado actualizado');
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    try {
      await appointmentApi.delete(selectedAppointment.id);
      toast.success('Cita eliminada exitosamente');
      setIsDeleteDialogOpen(false);
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar cita');
    }
  };

  const handleAttendanceSubmit = async () => {
    if (!selectedAppointment) return;
    
    try {
      const newStatus = attendanceData.attended ? 'COMPLETED' : 'NO_SHOW';
      await appointmentApi.changeStatus(selectedAppointment.id, newStatus);
      
      // Crear nota del profesional si hay contenido
      if (attendanceData.professionalNote.trim()) {
        await professionalNoteApi.create({
          patientId: selectedAppointment.patientId,
          appointmentId: selectedAppointment.id,
          title: `Atención - ${format(parseISO(selectedAppointment.date), 'dd/MM/yyyy')}`,
          content: attendanceData.professionalNote,
          tags: attendanceData.attended ? ['atencion-realizada'] : ['inasistencia'],
        });
      }
      
      // Subir archivos adjuntos si hay
      for (const attachment of attendanceData.attachments) {
        // En un caso real, aquí se subiría el archivo a un servidor
        // Por ahora simulamos que se guarda
        console.log('Adjunto:', attachment);
      }
      
      // Crear deuda si no asistió y se especificó monto
      if (!attendanceData.attended && attendanceData.createDebt && attendanceData.debtAmount > 0) {
        await debtApi.create({
          patientId: selectedAppointment.patientId,
          amount: attendanceData.debtAmount,
          reason: attendanceData.debtReason,
          appointmentId: selectedAppointment.id,
          notes: `Deuda generada por inasistencia a cita del ${selectedAppointment.date} a las ${selectedAppointment.time}`,
        });
        toast.warning(`Deuda de $${attendanceData.debtAmount.toFixed(2)} registrada por inasistencia`);
      } else if (!attendanceData.attended) {
        toast.warning('Se ha registrado la inasistencia');
      } else {
        toast.success('Asistencia confirmada y nota registrada');
      }
      
      // Resetear formulario
      setAttendanceData({
        attended: false,
        professionalNote: '',
        createDebt: false,
        debtAmount: 0,
        debtReason: 'Inasistencia a cita',
        attachments: [],
      });
      
      setIsAttendanceDialogOpen(false);
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar asistencia');
    }
  };

  const loadPatientDebts = async (patientId: string) => {
    try {
      const response = await debtApi.getByPatient(patientId);
      setPatientDebts(response.data.debts || []);
    } catch (error) {
      console.error('Error loading patient debts:', error);
    }
  };

  const loadPatientNotes = async (patientId: string) => {
    try {
      const response = await professionalNoteApi.list({ patientId });
      setPatientNotes(response.data || []);
    } catch (error) {
      console.error('Error loading patient notes:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Simular carga de archivos - en producción se subiría a un servidor
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment = {
          name: file.name,
          type: file.type,
          url: event.target?.result as string,
        };
        setAttendanceData(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttendanceData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar notificación');
    }
  };

  const checkPastAppointment = (appointment: Appointment) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    return appointmentDate < now && appointment.status === 'PENDING';
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return { style: option?.color || 'bg-slate-100', label: option?.label || status };
  };

  // Filtrar citas por profesional seleccionado
  const filteredAppointments = selectedProfessionalId === 'all'
    ? appointments
    : appointments.filter(a => a.professionalId === selectedProfessionalId);

  // Citas del día seleccionado
  const citasDelDia = filteredAppointments.filter(
    (a) => a.date === format(selectedDate, 'yyyy-MM-dd')
  ).sort((a, b) => a.time.localeCompare(b.time));

  // Generar días del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Días con citas (filtrado por profesional)
  const diasConCitas = filteredAppointments
    .filter(a => a.status !== 'CANCELLED')
    .map(a => parseISO(a.date));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Profesional */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500">Gestiona las citas de los profesionales</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Profesional:</span>
          <select
            value={selectedProfessionalId}
            onChange={(e) => setSelectedProfessionalId(e.target.value)}
            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            <option value="all">Todos los profesionales</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendario Mejorado */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base font-medium capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendario Custom */}
                <div className="w-full">
                  {/* Headers de días */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Espacios vacíos antes del primer día */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-10" />
                    ))}
                    
                    {daysInMonth.map((day) => {
                      const hasAppointment = diasConCitas.some(d => isSameDay(d, day));
                      const isSelected = isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            h-10 w-10 mx-auto rounded-lg flex items-center justify-center text-sm font-medium
                            transition-all duration-200
                            ${isSelected 
                              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg' 
                              : isToday
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                : 'hover:bg-slate-100 text-slate-700'
                            }
                          `}
                        >
                          <span className="relative">
                            {format(day, 'd')}
                            {hasAppointment && !isSelected && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Leyenda */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                    <span>Con cita</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-300 rounded-full border border-blue-500" />
                    <span>Hoy</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Citas del día */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                      <Plus className="h-4 w-4 mr-1" />
                      Nueva Cita
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Agendar Nueva Cita</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Paciente *</Label>
                        <Select 
                          value={formData.patientId} 
                          onValueChange={(v) => setFormData({ ...formData, patientId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar paciente" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.firstName} {p.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Profesional *</Label>
                        <Select 
                          value={formData.professionalId} 
                          onValueChange={(v) => {
                            setFormData({ ...formData, professionalId: v });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar profesional" />
                          </SelectTrigger>
                          <SelectContent>
                            {professionals.filter(p => p.isActive).map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: p.color }}
                                  />
                                  {p.firstName} {p.lastName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Servicio *</Label>
                        <Select 
                          value={formData.serviceId} 
                          onValueChange={(v) => {
                            setFormData({ ...formData, serviceId: v });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar servicio" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.filter(s => s.isActive).map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} - ${s.price.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha *</Label>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hora *</Label>
                          <Select 
                            value={formData.time} 
                            onValueChange={(v) => setFormData({ ...formData, time: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar hora" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots.length === 0 ? (
                                <SelectItem value="" disabled>No hay horarios disponibles</SelectItem>
                              ) : (
                                availableSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notas</Label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Notas adicionales sobre la cita"
                          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAdd}
                        disabled={!formData.patientId || !formData.professionalId || !formData.serviceId || !formData.time}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600"
                      >
                        Agendar Cita
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {citasDelDia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <CalendarDays className="h-12 w-12 mb-2" />
                      <p>No hay citas para este día</p>
                      <p className="text-sm">Haz clic en "Nueva Cita" para agendar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {citasDelDia.map((cita) => {
                        const status = getStatusBadge(cita.status);
                        const isPast = checkPastAppointment(cita);
                        
                        return (
                          <div key={cita.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                            isPast ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 hover:bg-slate-100'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{cita.time} - {cita.patient?.firstName} {cita.patient?.lastName}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                  <Stethoscope className="h-3 w-3" />
                                  {cita.service?.name}
                                </p>
                                {cita.professional && (
                                  <p className="text-sm text-slate-500 flex items-center gap-1">
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: cita.professional.color }}
                                    />
                                    {cita.professional.firstName} {cita.professional.lastName}
                                  </p>
                                )}
                                <p className="text-sm text-emerald-600 font-medium">
                                  <DollarSign className="h-3 w-3 inline" />
                                  {cita.price?.toFixed(2) || '0.00'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPast && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-amber-600 border-amber-300"
                                  onClick={() => { setSelectedAppointment(cita); setIsAttendanceDialogOpen(true); }}
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Registrar
                                </Button>
                              )}
                              <Badge variant="outline" className={status.style}>
                                {status.label}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {cita.status === 'PENDING' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(cita.id, 'CONFIRMED')}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Confirmar
                                    </DropdownMenuItem>
                                  )}
                                  {(cita.status === 'PENDING' || cita.status === 'CONFIRMED') && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(cita.id, 'COMPLETED')}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Completar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleSendNotification(cita)}>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Enviar WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => { 
                                      setSelectedAppointment(cita); 
                                      loadPatientDebts(cita.patientId);
                                      setIsDebtDialogOpen(true); 
                                    }}
                                  >
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Gestionar Deuda
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => { 
                                      setSelectedAppointment(cita); 
                                      loadPatientNotes(cita.patientId);
                                      setIsHistoryDialogOpen(true); 
                                    }}
                                  >
                                    <History className="h-4 w-4 mr-2" />
                                    Ver Historial
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedAppointment(cita); setIsDeleteDialogOpen(true); }} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center text-slate-400">
                            <CalendarDays className="h-12 w-12 mb-2" />
                            <p>No hay citas registradas</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      appointments.map((cita) => {
                        const status = getStatusBadge(cita.status);
                        return (
                          <TableRow key={cita.id}>
                            <TableCell>{format(parseISO(cita.date), 'dd MMM yyyy', { locale: es })}</TableCell>
                            <TableCell>{cita.time}</TableCell>
                            <TableCell>{cita.patient?.firstName} {cita.patient?.lastName}</TableCell>
                            <TableCell>
                              {cita.professional ? (
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: cita.professional.color }}
                                  />
                                  {cita.professional.firstName} {cita.professional.lastName}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{cita.service?.name}</TableCell>
                            <TableCell>
                              <span className="font-bold text-emerald-600">${cita.price?.toFixed(2) || '0.00'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={status.style}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleStatusChange(cita.id, 'COMPLETED')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Completar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(cita.id, 'CANCELLED')}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendNotification(cita)}>
                                    <Bell className="h-4 w-4 mr-2" />
                                    WhatsApp
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Asistencia Mejorado */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Atención</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Info del paciente */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Paciente</p>
              <p className="font-medium">
                {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName}
              </p>
              <p className="text-sm text-slate-500">
                {selectedAppointment?.date} a las {selectedAppointment?.time}
              </p>
            </div>

            {/* Asistencia */}
            <div className="space-y-2">
              <Label>¿El paciente asistió?</Label>
              <div className="flex gap-3">
                <Button 
                  type="button"
                  className={`flex-1 ${attendanceData.attended ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-200 hover:bg-slate-300'}`}
                  onClick={() => setAttendanceData({ ...attendanceData, attended: true })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sí, asistió
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className={`flex-1 ${!attendanceData.attended ? 'border-red-500 text-red-600 bg-red-50' : 'border-slate-300'}`}
                  onClick={() => setAttendanceData({ ...attendanceData, attended: false })}
                >
                  <X className="h-4 w-4 mr-2" />
                  No asistió
                </Button>
              </div>
            </div>

            {/* Notas del profesional */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notas de la atención (opcional)
              </Label>
              <textarea
                value={attendanceData.professionalNote}
                onChange={(e) => setAttendanceData({ ...attendanceData, professionalNote: e.target.value })}
                placeholder="Registra observaciones, tratamientos realizados, recomendaciones, etc."
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Adjuntos */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Adjuntos (opcional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="text-sm"
                />
              </div>
              {attendanceData.attachments.length > 0 && (
                <div className="space-y-1">
                  {attendanceData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                      <span className="truncate">{file.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deuda por inasistencia */}
            {!attendanceData.attended && (
              <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createDebt"
                    checked={attendanceData.createDebt}
                    onChange={(e) => setAttendanceData({ ...attendanceData, createDebt: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="createDebt" className="text-red-700 font-medium cursor-pointer">
                    Generar deuda por inasistencia
                  </Label>
                </div>
                
                {attendanceData.createDebt && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-red-700">Monto a cobrar *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={attendanceData.debtAmount || ''}
                        onChange={(e) => setAttendanceData({ ...attendanceData, debtAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="border-red-200"
                      />
                    </div>
                    <div>
                      <Label className="text-red-700">Motivo</Label>
                      <Input
                        value={attendanceData.debtReason}
                        onChange={(e) => setAttendanceData({ ...attendanceData, debtReason: e.target.value })}
                        placeholder="Ej: Inasistencia a cita programada"
                        className="border-red-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAttendanceSubmit}
              disabled={!attendanceData.attended && attendanceData.createDebt && attendanceData.debtAmount <= 0}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Guardar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            ¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestionar Deuda */}
      <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-red-500" />
              Gestionar Deuda
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Paciente</p>
              <p className="font-medium">
                {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName}
              </p>
            </div>

            {patientDebts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Wallet className="h-12 w-12 mx-auto mb-2" />
                <p>No hay deudas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-700">Deudas pendientes:</h4>
                {patientDebts
                  .filter((d) => d.status === 'PENDING' || d.status === 'PARTIAL')
                  .map((debt) => (
                    <div key={debt.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-700">{debt.reason}</p>
                          <p className="text-xs text-slate-500">
                            {format(parseISO(debt.createdAt), 'dd MMM yyyy', { locale: es })}
                          </p>
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
                    </div>
                  ))}
                
                {patientDebts.filter((d) => d.status === 'PENDING' || d.status === 'PARTIAL').length === 0 && (
                  <p className="text-center text-slate-500 py-4">No hay deudas pendientes</p>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <Button 
                onClick={() => {
                  setIsDebtDialogOpen(false);
                  navigate('/payments');
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Ver Historial */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-500" />
              Historial del Paciente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Paciente</p>
              <p className="font-medium">
                {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName}
              </p>
            </div>

            {patientNotes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>No hay notas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-700">Notas de atenciones previas:</h4>
                {patientNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{note.title}</p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(note.createdAt), 'dd MMM yyyy', { locale: es })}
                          {note.professional && ` - ${note.professional.firstName} ${note.professional.lastName}`}
                        </p>
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                    
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-slate-500 mb-2">Adjuntos:</p>
                        <div className="flex gap-2 flex-wrap">
                          {note.attachments.map((att: any) => (
                            <a
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {att.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
