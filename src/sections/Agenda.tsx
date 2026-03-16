import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
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
  Edit,
  Trash2,
  CheckCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Cita, Paciente, Tratamiento } from '@/types';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgendaProps {
  citas: Cita[];
  pacientes: Paciente[];
  tratamientos: Tratamiento[];
  onAdd: (cita: Omit<Cita, 'id' | 'notificacionEnviada' | 'recordatorioEnviado'>) => void;
  onUpdate: (id: string, cita: Partial<Cita>) => void;
  onDelete: (id: string) => void;
  onEnviarNotificacion: (cita: Cita) => void;
}

const estados = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'completada', label: 'Completada', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'no-asistio', label: 'No asistió', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

const horas = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
];

const initialFormData = {
  pacienteId: '',
  pacienteNombre: '',
  tratamientoId: '',
  tratamientoNombre: '',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  hora: '09:00',
  duracionMinutos: 30,
  precio: 0,
  estado: 'pendiente' as Cita['estado'],
  notas: '',
};

export function Agenda({
  citas,
  pacientes,
  tratamientos,
  onAdd,
  onUpdate,
  onDelete,
  onEnviarNotificacion,
}: AgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const citasDelDia = useMemo(() => {
    const fechaStr = format(selectedDate, 'yyyy-MM-dd');
    return citas
      .filter((c) => c.fecha === fechaStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [citas, selectedDate]);

  const citasDelMes = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return citas.filter(
      (c) => c.fecha >= format(start, 'yyyy-MM-dd') && c.fecha <= format(end, 'yyyy-MM-dd')
    );
  }, [citas, currentDate]);

  const handleAdd = () => {
    onAdd(formData);
    setFormData(initialFormData);
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (selectedCita) {
      onUpdate(selectedCita.id, formData);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedCita) {
      onDelete(selectedCita.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (cita: Cita) => {
    setSelectedCita(cita);
    setFormData({
      pacienteId: cita.pacienteId,
      pacienteNombre: cita.pacienteNombre,
      tratamientoId: cita.tratamientoId,
      tratamientoNombre: cita.tratamientoNombre,
      fecha: cita.fecha,
      hora: cita.hora,
      duracionMinutos: cita.duracionMinutos,
      precio: cita.precio,
      estado: cita.estado,
      notas: cita.notas || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cita: Cita) => {
    setSelectedCita(cita);
    setIsDeleteDialogOpen(true);
  };

  const handlePacienteChange = (pacienteId: string) => {
    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (paciente) {
      setFormData({
        ...formData,
        pacienteId,
        pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
      });
    }
  };

  const handleTratamientoChange = (tratamientoId: string) => {
    const tratamiento = tratamientos.find((t) => t.id === tratamientoId);
    if (tratamiento) {
      setFormData({
        ...formData,
        tratamientoId,
        tratamientoNombre: tratamiento.nombre,
        precio: tratamiento.precio,
        duracionMinutos: tratamiento.duracionMinutos,
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const style = estados.find((e) => e.value === estado);
    return style?.color || 'bg-slate-100 text-slate-800';
  };

  const getEstadoLabel = (estado: string) => {
    return estados.find((e) => e.value === estado)?.label || estado;
  };

  // Días con citas para el calendario
  const diasConCitas = useMemo(() => {
    return citasDelMes.map((c) => parseISO(c.fecha));
  }, [citasDelMes]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendario */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-sm font-medium">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  className="rounded-md"
                  modifiers={{
                    conCita: diasConCitas,
                  }}
                  modifiersStyles={{
                    conCita: {
                      backgroundColor: '#06b6d4',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Citas del día */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  Citas del{' '}
                  {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nueva Cita
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Agendar Nueva Cita</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="paciente">Paciente *</Label>
                        <Select
                          value={formData.pacienteId}
                          onValueChange={handlePacienteChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar paciente" />
                          </SelectTrigger>
                          <SelectContent>
                            {pacientes.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nombre} {p.apellido}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tratamiento">Tratamiento *</Label>
                        <Select
                          value={formData.tratamientoId}
                          onValueChange={handleTratamientoChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tratamiento" />
                          </SelectTrigger>
                          <SelectContent>
                            {tratamientos
                              .filter((t) => t.activo)
                              .map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.nombre} - ${t.precio.toFixed(2)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fecha">Fecha *</Label>
                          <Input
                            id="fecha"
                            type="date"
                            value={formData.fecha}
                            onChange={(e) =>
                              setFormData({ ...formData, fecha: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hora">Hora *</Label>
                          <Select
                            value={formData.hora}
                            onValueChange={(hora) =>
                              setFormData({ ...formData, hora })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar hora" />
                            </SelectTrigger>
                            <SelectContent>
                              {horas.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="precio">Precio ($)</Label>
                          <Input
                            id="precio"
                            type="number"
                            value={formData.precio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                precio: parseFloat(e.target.value) || 0,
                              })
                            }
                            readOnly={!!formData.tratamientoId}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duracion">Duración (min)</Label>
                          <Input
                            id="duracion"
                            type="number"
                            value={formData.duracionMinutos}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                duracionMinutos: parseInt(e.target.value) || 30,
                              })
                            }
                            readOnly={!!formData.tratamientoId}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notas">Notas</Label>
                        <textarea
                          id="notas"
                          value={formData.notas}
                          onChange={(e) =>
                            setFormData({ ...formData, notas: e.target.value })
                          }
                          placeholder="Notas adicionales"
                          className="w-full min-h-[60px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAdd}
                        disabled={!formData.pacienteId || !formData.tratamientoId}
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
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {citasDelDia.map((cita) => (
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
                                {cita.hora} - {cita.pacienteNombre}
                              </p>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                {cita.tratamientoNombre}
                              </p>
                              <p className="text-sm text-emerald-600 font-medium">
                                <DollarSign className="h-3 w-3 inline" />
                                {cita.precio.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getEstadoBadge(cita.estado)}
                            >
                              {getEstadoLabel(cita.estado)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(cita)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {cita.estado === 'pendiente' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdate(cita.id, { estado: 'confirmada' })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </DropdownMenuItem>
                                )}
                                {(cita.estado === 'pendiente' ||
                                  cita.estado === 'confirmada') && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdate(cita.id, { estado: 'completada' })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Completar
                                  </DropdownMenuItem>
                                )}
                                {!cita.notificacionEnviada && (
                                  <DropdownMenuItem
                                    onClick={() => onEnviarNotificacion(cita)}
                                  >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Enviar Confirmación
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(cita)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
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
                      <TableHead>Tratamiento</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center text-slate-400">
                            <CalendarDays className="h-12 w-12 mb-2" />
                            <p>No hay citas registradas</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      citas
                        .sort((a, b) => {
                          const fechaA = new Date(`${a.fecha}T${a.hora}`);
                          const fechaB = new Date(`${b.fecha}T${b.hora}`);
                          return fechaB.getTime() - fechaA.getTime();
                        })
                        .map((cita) => (
                          <TableRow key={cita.id}>
                            <TableCell>
                              {format(parseISO(cita.fecha), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell>{cita.hora}</TableCell>
                            <TableCell>{cita.pacienteNombre}</TableCell>
                            <TableCell>{cita.tratamientoNombre}</TableCell>
                            <TableCell>
                              <span className="text-emerald-600 font-medium">
                                ${cita.precio.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getEstadoBadge(cita.estado)}
                              >
                                {getEstadoLabel(cita.estado)}
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
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(cita)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(cita)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(estado) =>
                  setFormData({ ...formData, estado: estado as Cita['estado'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Select
                  value={formData.hora}
                  onValueChange={(hora) => setFormData({ ...formData, hora })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {horas.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <textarea
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Cita</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              ¿Estás seguro de que deseas eliminar la cita de{' '}
              <span className="font-semibold">{selectedCita?.pacienteNombre}</span>{' '}
              del{' '}
              {selectedCita && format(parseISO(selectedCita.fecha), 'dd MMM yyyy', { locale: es })}?
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleDelete} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
