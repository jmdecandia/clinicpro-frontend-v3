import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  DollarSign,
  User,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Trash2,
  CheckCircle,
  Wallet,
} from 'lucide-react';
import type { Pago, Paciente, Deuda, Cita } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PagosProps {
  pagos: Pago[];
  pacientes: Paciente[];
  deudas: Deuda[];
  citas: Cita[];
  onAddPago: (pago: Omit<Pago, 'id'>) => void;
  onDeletePago: (id: string) => void;
}

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'otro', label: 'Otro' },
];

const initialFormData = {
  pacienteId: '',
  pacienteNombre: '',
  monto: 0,
  fecha: format(new Date(), 'yyyy-MM-dd'),
  metodoPago: 'efectivo' as Pago['metodoPago'],
  concepto: '',
  notas: '',
};

export function PagosSection({
  pagos,
  pacientes,
  deudas,
  citas,
  onAddPago,
  onDeletePago,
}: PagosProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');

  const stats = useMemo(() => {
    const totalCobrado = pagos.reduce((sum, p) => sum + p.monto, 0);
    const totalDeuda = deudas.reduce((sum, d) => sum + d.deudaPendiente, 0);
    const totalTratamientos = citas
      .filter((c) => c.estado === 'completada')
      .reduce((sum, c) => sum + c.precio, 0);

    return {
      totalCobrado,
      totalDeuda,
      totalTratamientos,
      porcentajeCobrado: totalTratamientos > 0 ? (totalCobrado / totalTratamientos) * 100 : 0,
    };
  }, [pagos, deudas, citas]);

  const pagosRecientes = useMemo(() => {
    return [...pagos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);
  }, [pagos]);

  const pagosPorPaciente = useMemo(() => {
    if (!selectedPacienteId) return [];
    return pagos
      .filter((p) => p.pacienteId === selectedPacienteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [pagos, selectedPacienteId]);

  const deudaPacienteSeleccionado = useMemo(() => {
    if (!selectedPacienteId) return null;
    return deudas.find((d) => d.pacienteId === selectedPacienteId);
  }, [deudas, selectedPacienteId]);

  const handleAdd = () => {
    onAddPago(formData);
    setFormData(initialFormData);
    setIsAddDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedPago) {
      onDeletePago(selectedPago.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (pago: Pago) => {
    setSelectedPago(pago);
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
      setSelectedPacienteId(pacienteId);
    }
  };

  const getMetodoPagoLabel = (metodo: string) => {
    return metodosPago.find((m) => m.value === metodo)?.label || metodo;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Cobrado</p>
                <p className="text-xl font-bold text-emerald-600">
                  ${stats.totalCobrado.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Tratamientos</p>
                <p className="text-xl font-bold text-blue-600">
                  ${stats.totalTratamientos.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Deuda Total</p>
                <p className="text-xl font-bold text-amber-600">
                  ${stats.totalDeuda.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">% Cobrado</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.porcentajeCobrado.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deudas" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="deudas">Deudas</TabsTrigger>
          <TabsTrigger value="pagos">Pagos Recientes</TabsTrigger>
          <TabsTrigger value="paciente">Por Paciente</TabsTrigger>
        </TabsList>

        <TabsContent value="deudas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Deudas Pendientes
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Pago</DialogTitle>
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
                    {selectedPacienteId && deudaPacienteSeleccionado && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          Deuda pendiente:{' '}
                          <span className="font-bold">
                            ${deudaPacienteSeleccionado.deudaPendiente.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monto">Monto ($) *</Label>
                        <Input
                          id="monto"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.monto}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              monto: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metodo">Método de Pago *</Label>
                      <Select
                        value={formData.metodoPago}
                        onValueChange={(metodo) =>
                          setFormData({
                            ...formData,
                            metodoPago: metodo as Pago['metodoPago'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          {metodosPago.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concepto">Concepto *</Label>
                      <Input
                        id="concepto"
                        value={formData.concepto}
                        onChange={(e) =>
                          setFormData({ ...formData, concepto: e.target.value })
                        }
                        placeholder="Ej: Pago parcial tratamiento"
                      />
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
                      disabled={
                        !formData.pacienteId ||
                        formData.monto <= 0 ||
                        !formData.concepto
                      }
                      className="bg-gradient-to-r from-cyan-500 to-blue-600"
                    >
                      Registrar Pago
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {deudas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <CheckCircle className="h-12 w-12 mb-2" />
                    <p>No hay deudas pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deudas.map((deuda) => (
                      <div
                        key={deuda.pacienteId}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {deuda.pacienteNombre}
                            </p>
                            <p className="text-sm text-slate-500">
                              Total tratamientos: ${deuda.totalTratamientos.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-500">
                              Total pagado: ${deuda.totalPagado.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-600">
                            ${deuda.deudaPendiente.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-400">Pendiente</p>
                          {deuda.ultimoPago && (
                            <p className="text-xs text-slate-400">
                              Último pago:{' '}
                              {format(parseISO(deuda.ultimoPago), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </p>
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

        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                Pagos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosRecientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center text-slate-400">
                            <DollarSign className="h-12 w-12 mb-2" />
                            <p>No hay pagos registrados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagosRecientes.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell>
                            {format(parseISO(pago.fecha), 'dd MMM yyyy', {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>{pago.pacienteNombre}</TableCell>
                          <TableCell>{pago.concepto}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getMetodoPagoLabel(pago.metodoPago)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-emerald-600">
                              ${pago.monto.toFixed(2)}
                            </span>
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
                                  onClick={() => openDeleteDialog(pago)}
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

        <TabsContent value="paciente">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Historial de Pagos por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedPacienteId}
                onValueChange={setSelectedPacienteId}
              >
                <SelectTrigger className="w-full max-w-md">
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

              {selectedPacienteId && deudaPacienteSeleccionado && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Total Tratamientos</p>
                      <p className="text-xl font-bold text-blue-600">
                        ${deudaPacienteSeleccionado.totalTratamientos.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Total Pagado</p>
                      <p className="text-xl font-bold text-emerald-600">
                        ${deudaPacienteSeleccionado.totalPagado.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Deuda Pendiente</p>
                      <p className="text-xl font-bold text-amber-600">
                        ${deudaPacienteSeleccionado.deudaPendiente.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <ScrollArea className="h-[300px]">
                {selectedPacienteId ? (
                  pagosPorPaciente.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <DollarSign className="h-12 w-12 mb-2" />
                      <p>Este paciente no tiene pagos registrados</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagosPorPaciente.map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>
                              {format(parseISO(pago.fecha), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell>{pago.concepto}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getMetodoPagoLabel(pago.metodoPago)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-emerald-600">
                                ${pago.monto.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <User className="h-12 w-12 mb-2" />
                    <p>Selecciona un paciente para ver su historial</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Pago</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              ¿Estás seguro de que deseas eliminar el pago de{' '}
              <span className="font-semibold">${selectedPago?.monto.toFixed(2)}</span>{' '}
              de <span className="font-semibold">{selectedPago?.pacienteNombre}</span>?
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
