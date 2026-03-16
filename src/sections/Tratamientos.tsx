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
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Stethoscope,
  DollarSign,
  Clock,
  Tag,
} from 'lucide-react';
import type { Tratamiento } from '@/types';

interface TratamientosProps {
  tratamientos: Tratamiento[];
  onAdd: (tratamiento: Omit<Tratamiento, 'id'>) => void;
  onUpdate: (id: string, tratamiento: Partial<Tratamiento>) => void;
  onDelete: (id: string) => void;
}

const categorias = [
  { value: 'preventivo', label: 'Preventivo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'restaurativo', label: 'Restaurativo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'estetico', label: 'Estético', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'quirurgico', label: 'Quirúrgico', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'ortodoncia', label: 'Ortodoncia', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

const initialFormData = {
  nombre: '',
  descripcion: '',
  precio: 0,
  duracionMinutos: 30,
  categoria: 'preventivo' as Tratamiento['categoria'],
  activo: true,
};

export function TratamientosSection({
  tratamientos,
  onAdd,
  onUpdate,
  onDelete,
}: TratamientosProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState<Tratamiento | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const filteredTratamientos = tratamientos.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    onAdd(formData);
    setFormData(initialFormData);
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (selectedTratamiento) {
      onUpdate(selectedTratamiento.id, formData);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedTratamiento) {
      onDelete(selectedTratamiento.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (tratamiento: Tratamiento) => {
    setSelectedTratamiento(tratamiento);
    setFormData({
      nombre: tratamiento.nombre,
      descripcion: tratamiento.descripcion,
      precio: tratamiento.precio,
      duracionMinutos: tratamiento.duracionMinutos,
      categoria: tratamiento.categoria,
      activo: tratamiento.activo,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (tratamiento: Tratamiento) => {
    setSelectedTratamiento(tratamiento);
    setIsDeleteDialogOpen(true);
  };

  const getCategoriaLabel = (categoria: string) => {
    return categorias.find((c) => c.value === categoria)?.label || categoria;
  };

  const getCategoriaColor = (categoria: string) => {
    return categorias.find((c) => c.value === categoria)?.color || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar tratamientos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tratamiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Tratamiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Limpieza Dental"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Descripción del tratamiento"
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio ($) *</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) =>
                      setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (min) *</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duracionMinutos}
                    onChange={(e) =>
                      setFormData({ ...formData, duracionMinutos: parseInt(e.target.value) || 30 })
                    }
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value as Tratamiento['categoria'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activo">Tratamiento Activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, activo: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleAdd}
                disabled={!formData.nombre || !formData.descripcion || formData.precio <= 0}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                Guardar Tratamiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Tratamientos</p>
                <p className="text-xl font-bold">{tratamientos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Precio Promedio</p>
                <p className="text-xl font-bold">
                  ${
                    tratamientos.length > 0
                      ? (
                          tratamientos.reduce((sum, t) => sum + t.precio, 0) /
                          tratamientos.length
                        ).toFixed(2)
                      : '0.00'
                  }
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
                <p className="text-sm text-slate-500">Duración Promedio</p>
                <p className="text-xl font-bold">
                  {tratamientos.length > 0
                    ? Math.round(
                        tratamientos.reduce((sum, t) => sum + t.duracionMinutos, 0) /
                          tratamientos.length
                      )
                    : 0}{' '}
                  min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-420px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tratamiento</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTratamientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center text-slate-400">
                        <Stethoscope className="h-12 w-12 mb-2" />
                        <p>No se encontraron tratamientos</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTratamientos.map((tratamiento) => (
                    <TableRow key={tratamiento.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {tratamiento.nombre}
                          </p>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {tratamiento.descripcion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCategoriaColor(tratamiento.categoria)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {getCategoriaLabel(tratamiento.categoria)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-emerald-600">
                          ${tratamiento.precio.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{tratamiento.duracionMinutos} min</TableCell>
                      <TableCell>
                        <Badge
                          variant={tratamiento.activo ? 'default' : 'secondary'}
                          className={
                            tratamiento.activo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
                          }
                        >
                          {tratamiento.activo ? 'Activo' : 'Inactivo'}
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
                              onClick={() => openEditDialog(tratamiento)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onUpdate(tratamiento.id, { activo: !tratamiento.activo })
                              }
                            >
                              {tratamiento.activo ? (
                                <>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(tratamiento)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Tratamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="edit-descripcion">Descripción *</Label>
              <textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-precio">Precio ($) *</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duracion">Duración (min) *</Label>
                <Input
                  id="edit-duracion"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duracionMinutos}
                  onChange={(e) =>
                    setFormData({ ...formData, duracionMinutos: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoria: value as Tratamiento['categoria'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-activo">Tratamiento Activo</Label>
              <Switch
                id="edit-activo"
                checked={formData.activo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, activo: checked })
                }
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
            <DialogTitle className="text-red-600">Eliminar Tratamiento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              ¿Estás seguro de que deseas eliminar el tratamiento{' '}
              <span className="font-semibold">{selectedTratamiento?.nombre}</span>?
              Esta acción no se puede deshacer.
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
