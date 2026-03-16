import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  User,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';
import { professionalApi, timeBlockApi } from '@/services/api';
import type { Professional, TimeBlock } from '@/types/api';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  
  // Formulario de profesional
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    color: '#3b82f6',
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: null,
      sunday: null,
    } as any,
  });

  // Formulario de bloqueo de tiempo
  const [blockFormData, setBlockFormData] = useState({
    professionalId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    reason: '',
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, blocksRes] = await Promise.all([
        professionalApi.list(),
        timeBlockApi.list(),
      ]);
      setProfessionals(profRes.data);
      setTimeBlocks(blocksRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await professionalApi.create(formData);
      toast.success('Profesional creado exitosamente');
      setIsAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear profesional');
    }
  };

  const handleUpdate = async () => {
    if (!selectedProfessional) return;
    try {
      await professionalApi.update(selectedProfessional.id, formData);
      toast.success('Profesional actualizado');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!selectedProfessional) return;
    try {
      await professionalApi.delete(selectedProfessional.id);
      toast.success('Profesional eliminado');
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleToggleStatus = async (professional: Professional) => {
    try {
      await professionalApi.update(professional.id, { isActive: !professional.isActive });
      toast.success(`Profesional ${professional.isActive ? 'desactivado' : 'activado'}`);
      loadData();
    } catch (error: any) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleAddBlock = async () => {
    try {
      await timeBlockApi.create(blockFormData);
      toast.success('Bloqueo de tiempo creado');
      setIsBlockDialogOpen(false);
      setBlockFormData({
        professionalId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        reason: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear bloqueo');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await timeBlockApi.delete(blockId);
      toast.success('Bloqueo eliminado');
      loadData();
    } catch (error: any) {
      toast.error('Error al eliminar bloqueo');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      color: '#3b82f6',
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: null,
        sunday: null,
      },
    });
  };

  const openEditDialog = (professional: Professional) => {
    setSelectedProfessional(professional);
    setFormData({
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.email,
      phone: professional.phone,
      specialty: professional.specialty || '',
      color: professional.color,
      workingHours: professional.workingHours || {},
    });
    setIsEditDialogOpen(true);
  };

  const updateWorkingHours = (day: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: prev.workingHours[day] ? { ...prev.workingHours[day], [field]: value } : { start: '09:00', end: '18:00', [field]: value },
      },
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: prev.workingHours[day] ? null : { start: '09:00', end: '18:00' },
      },
    }));
  };

  const getProfessionalBlocks = (professionalId: string) => {
    return timeBlocks.filter(b => b.professionalId === professionalId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profesionales</h1>
          <p className="text-slate-500">Gestiona los profesionales y sus agendas</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Ban className="h-4 w-4 mr-2" />
                Bloquear Tiempo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bloquear Tiempo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Profesional *</Label>
                  <Select
                    value={blockFormData.professionalId}
                    onValueChange={(v) => setBlockFormData({ ...blockFormData, professionalId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.filter(p => p.isActive).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={blockFormData.date}
                    onChange={(e) => setBlockFormData({ ...blockFormData, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora inicio *</Label>
                    <Input
                      type="time"
                      value={blockFormData.startTime}
                      onChange={(e) => setBlockFormData({ ...blockFormData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora fin *</Label>
                    <Input
                      type="time"
                      value={blockFormData.endTime}
                      onChange={(e) => setBlockFormData({ ...blockFormData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Input
                    value={blockFormData.reason}
                    onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                    placeholder="Ej: Licencia, Curso, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAddBlock} disabled={!blockFormData.professionalId}>
                  Bloquear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Profesional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Profesional</DialogTitle>
              </DialogHeader>
              <ProfessionalForm
                formData={formData}
                setFormData={setFormData}
                updateWorkingHours={updateWorkingHours}
                toggleWorkingDay={toggleWorkingDay}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAdd} disabled={!formData.firstName || !formData.lastName}>
                  Crear Profesional
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="profesionales" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profesionales">Profesionales</TabsTrigger>
          <TabsTrigger value="bloqueos">Bloqueos de Tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value="profesionales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((professional) => (
              <Card key={professional.id} className={!professional.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: professional.color }}
                      >
                        {professional.firstName[0]}{professional.lastName[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {professional.firstName} {professional.lastName}
                        </CardTitle>
                        <CardDescription>{professional.specialty || 'Sin especialidad'}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={professional.isActive ? 'default' : 'secondary'}>
                      {professional.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-4 w-4" />
                      {professional.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4" />
                      {professional.phone}
                    </div>
                  </div>
                  
                  {/* Horarios */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-slate-500 mb-2">Horario de trabajo</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {DAYS_OF_WEEK.map(({ key, label }) => {
                        const hours = (professional.workingHours as any)?.[key];
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-500">{label}:</span>
                            <span className={hours ? 'text-slate-700' : 'text-slate-400'}>
                              {hours ? `${hours.start}-${hours.end}` : 'Cerrado'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bloqueos próximos */}
                  {getProfessionalBlocks(professional.id).length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-slate-500 mb-2">Bloqueos próximos</p>
                      <div className="space-y-1">
                        {getProfessionalBlocks(professional.id).slice(0, 2).map((block) => (
                          <div key={block.id} className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded">
                            <span className="text-amber-800">
                              {format(parseISO(block.date), 'dd MMM')}: {block.startTime}-{block.endTime}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleDeleteBlock(block.id)}
                            >
                              <XCircle className="h-3 w-3 text-amber-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(professional)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleStatus(professional)}
                    >
                      {professional.isActive ? (
                        <><XCircle className="h-4 w-4 mr-1" /> Desactivar</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-1" /> Activar</>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { setSelectedProfessional(professional); setIsDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bloqueos">
          <Card>
            <CardHeader>
              <CardTitle>Bloqueos de Tiempo</CardTitle>
              <CardDescription>Tiempos bloqueados por profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeBlocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          No hay bloqueos de tiempo
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeBlocks.map((block) => {
                        const professional = professionals.find(p => p.id === block.professionalId);
                        return (
                          <TableRow key={block.id}>
                            <TableCell>
                              {professional ? (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-6 w-6 rounded-full"
                                    style={{ backgroundColor: professional.color }}
                                  />
                                  {professional.firstName} {professional.lastName}
                                </div>
                              ) : 'Desconocido'}
                            </TableCell>
                            <TableCell>{format(parseISO(block.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{block.startTime} - {block.endTime}</TableCell>
                            <TableCell>{block.reason || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBlock(block.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
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

      {/* Dialog de Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Profesional</DialogTitle>
          </DialogHeader>
          <ProfessionalForm
            formData={formData}
            setFormData={setFormData}
            updateWorkingHours={updateWorkingHours}
            toggleWorkingDay={toggleWorkingDay}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdate}>Guardar Cambios</Button>
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
            ¿Estás seguro de eliminar a {selectedProfessional?.firstName} {selectedProfessional?.lastName}?
            Esta acción no se puede deshacer.
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
    </div>
  );
}

// Componente de formulario de profesional
function ProfessionalForm({
  formData,
  setFormData,
  updateWorkingHours,
  toggleWorkingDay,
}: {
  formData: any;
  setFormData: (data: any) => void;
  updateWorkingHours: (day: string, field: 'start' | 'end', value: string) => void;
  toggleWorkingDay: (day: string) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Nombre"
          />
        </div>
        <div className="space-y-2">
          <Label>Apellido *</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Apellido"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@ejemplo.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Teléfono</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+34 600 000 000"
        />
      </div>
      <div className="space-y-2">
        <Label>Especialidad</Label>
        <Input
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          placeholder="Ej: Estilista, Colorista, etc."
        />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`h-8 w-8 rounded-full border-2 ${
                formData.color === color ? 'border-slate-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Horario de Trabajo</Label>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const isWorking = !!formData.workingHours?.[key];
            return (
              <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <input
                  type="checkbox"
                  checked={isWorking}
                  onChange={() => toggleWorkingDay(key)}
                  className="h-4 w-4"
                />
                <span className="w-24 text-sm font-medium">{label}</span>
                {isWorking ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formData.workingHours[key]?.start || '09:00'}
                      onChange={(e) => updateWorkingHours(key, 'start', e.target.value)}
                      className="w-24 h-8"
                    />
                    <span className="text-slate-400">-</span>
                    <Input
                      type="time"
                      value={formData.workingHours[key]?.end || '18:00'}
                      onChange={(e) => updateWorkingHours(key, 'end', e.target.value)}
                      className="w-24 h-8"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">No trabaja</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
