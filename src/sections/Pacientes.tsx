import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import type { Paciente } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PacientesProps {
  pacientes: Paciente[];
  onAdd: (paciente: Omit<Paciente, 'id' | 'fechaRegistro'>) => void;
  onUpdate: (id: string, paciente: Partial<Paciente>) => void;
  onDelete: (id: string) => void;
}

const initialFormData = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fechaNacimiento: '',
  direccion: '',
  historialMedico: '',
  alergias: '',
  notas: '',
};

export function Pacientes({
  pacientes,
  onAdd,
  onUpdate,
  onDelete,
}: PacientesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.telefono.includes(searchQuery)
  );

  const handleAdd = () => {
    onAdd(formData);
    setFormData(initialFormData);
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (selectedPaciente) {
      onUpdate(selectedPaciente.id, formData);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedPaciente) {
      onDelete(selectedPaciente.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setFormData({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      email: paciente.email,
      telefono: paciente.telefono,
      fechaNacimiento: paciente.fechaNacimiento,
      direccion: paciente.direccion || '',
      historialMedico: paciente.historialMedico || '',
      alergias: paciente.alergias || '',
      notas: paciente.notas || '',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsDeleteDialogOpen(true);
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = parseISO(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Nombre del paciente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                  placeholder="Apellido del paciente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaNacimiento: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  placeholder="Dirección del paciente"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="alergias">Alergias</Label>
                <Input
                  id="alergias"
                  value={formData.alergias}
                  onChange={(e) =>
                    setFormData({ ...formData, alergias: e.target.value })
                  }
                  placeholder="Alergias conocidas"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="historialMedico">Historial Médico</Label>
                <textarea
                  id="historialMedico"
                  value={formData.historialMedico}
                  onChange={(e) =>
                    setFormData({ ...formData, historialMedico: e.target.value })
                  }
                  placeholder="Historial médico relevante"
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notas">Notas Adicionales</Label>
                <textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  placeholder="Notas adicionales"
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleAdd}
                disabled={
                  !formData.nombre ||
                  !formData.apellido ||
                  !formData.email ||
                  !formData.telefono ||
                  !formData.fechaNacimiento
                }
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                Guardar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center text-slate-400">
                        <User className="h-12 w-12 mb-2" />
                        <p>No se encontraron pacientes</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPacientes.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {paciente.nombre[0]}
                              {paciente.apellido[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {paciente.nombre} {paciente.apellido}
                            </p>
                            {paciente.alergias && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-200 bg-amber-50 text-xs mt-1"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alergias
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {paciente.email}
                          </p>
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {paciente.telefono}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {calcularEdad(paciente.fechaNacimiento)} años
                      </TableCell>
                      <TableCell>
                        {format(
                          parseISO(paciente.fechaRegistro),
                          'dd MMM yyyy',
                          { locale: es }
                        )}
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
                              onClick={() => openViewDialog(paciente)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(paciente)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(paciente)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apellido">Apellido *</Label>
              <Input
                id="edit-apellido"
                value={formData.apellido}
                onChange={(e) =>
                  setFormData({ ...formData, apellido: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono *</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fechaNacimiento">Fecha de Nacimiento *</Label>
              <Input
                id="edit-fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fechaNacimiento: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input
                id="edit-direccion"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-alergias">Alergias</Label>
              <Input
                id="edit-alergias"
                value={formData.alergias}
                onChange={(e) =>
                  setFormData({ ...formData, alergias: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-historialMedico">Historial Médico</Label>
              <textarea
                id="edit-historialMedico"
                value={formData.historialMedico}
                onChange={(e) =>
                  setFormData({ ...formData, historialMedico: e.target.value })
                }
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-notas">Notas Adicionales</Label>
              <textarea
                id="edit-notas"
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Paciente</DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xl font-medium">
                    {selectedPaciente.nombre[0]}
                    {selectedPaciente.apellido[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedPaciente.nombre} {selectedPaciente.apellido}
                  </h3>
                  <p className="text-slate-500">
                    Paciente desde{' '}
                    {format(
                      parseISO(selectedPaciente.fechaRegistro),
                      'MMMM yyyy',
                      { locale: es }
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{selectedPaciente.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Teléfono</p>
                    <p className="font-medium">{selectedPaciente.telefono}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Fecha de Nacimiento</p>
                    <p className="font-medium">
                      {format(
                        parseISO(selectedPaciente.fechaNacimiento),
                        'dd MMMM yyyy',
                        { locale: es }
                      )}{' '}
                      ({calcularEdad(selectedPaciente.fechaNacimiento)} años)
                    </p>
                  </div>
                </div>
                {selectedPaciente.direccion && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Dirección</p>
                      <p className="font-medium">{selectedPaciente.direccion}</p>
                    </div>
                  </div>
                )}
                {selectedPaciente.alergias && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-amber-600">Alergias</p>
                      <p className="font-medium text-amber-800">
                        {selectedPaciente.alergias}
                      </p>
                    </div>
                  </div>
                )}
                {selectedPaciente.historialMedico && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Historial Médico</p>
                      <p className="font-medium">{selectedPaciente.historialMedico}</p>
                    </div>
                  </div>
                )}
                {selectedPaciente.notas && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Notas</p>
                      <p className="font-medium">{selectedPaciente.notas}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Paciente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-semibold">
                {selectedPaciente?.nombre} {selectedPaciente?.apellido}
              </span>
              ? Esta acción no se puede deshacer.
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
