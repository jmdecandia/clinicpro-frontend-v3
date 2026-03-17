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
  DollarSign,
  User,
  TrendingUp,
  MoreVertical,
  Trash2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  AlertCircle,
} from 'lucide-react';
import { paymentApi, patientApi, providerApi, debtApi } from '@/services/api';
import type { Payment, Patient, Provider, Debt } from '@/types/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Otro' },
];

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [summary, setSummary] = useState<any>({
    today: 0,
    month: 0,
    year: 0,
    total: 0,
    pendingPayments: 0,
    byMethod: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchPatient, setSearchPatient] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageProvidersOpen, setIsManageProvidersOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isDebtPaymentDialogOpen, setIsDebtPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
  const [debtPaymentMethod, setDebtPaymentMethod] = useState('CASH');
  
  // Formulario de pago (ingreso)
  const [formData, setFormData] = useState({
    patientId: '',
    amount: 0,
    method: 'CASH' as const,
    concept: '',
    notes: '',
  });

  // Formulario de egreso
  const [expenseData, setExpenseData] = useState({
    providerId: '',
    amount: 0,
    method: 'CASH' as const,
    concept: '',
    invoiceNumber: '',
    notes: '',
  });

  // Formulario de proveedor
  const [providerData, setProviderData] = useState({
    name: '',
    rut: '',
    address: '',
    phone: '',
    email: '',
    contactName: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, patientsRes, summaryRes, providersRes, debtsRes] = await Promise.all([
        paymentApi.list({ limit: 100 }),
        patientApi.list({ limit: 100 }),
        paymentApi.getSummary(),
        providerApi.list({ active: true }),
        debtApi.list(),
      ]);
      setPayments(paymentsRes.data.data || []);
      setPatients(patientsRes.data.data || []);
      setProviders((providersRes.data || []) as any);
      setDebts((debtsRes.data.debts || []) as any);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading payments data:', error);
      toast.error('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleDebtPayment = async () => {
    if (!selectedDebt || !debtPaymentAmount) return;
    
    try {
      const amount = parseFloat(debtPaymentAmount);
      if (amount <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }
      
      await debtApi.addPayment(selectedDebt.id, {
        amount,
        method: debtPaymentMethod,
      });
      
      toast.success('Pago de deuda registrado exitosamente');
      setIsDebtPaymentDialogOpen(false);
      setDebtPaymentAmount('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar pago');
    }
  };

  const openDebtPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setDebtPaymentAmount(debt.remainingAmount?.toString() || '');
    setDebtPaymentMethod('CASH');
    setIsDebtPaymentDialogOpen(true);
  };

  const handleAddPayment = async () => {
    try {
      if (!formData.patientId || formData.amount <= 0) {
        toast.error('Completa todos los campos requeridos');
        return;
      }

      await paymentApi.create(formData);
      toast.success('Pago registrado exitosamente');
      setFormData({
        patientId: '',
        amount: 0,
        method: 'CASH',
        concept: '',
        notes: '',
      });
      setIsAddDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar pago');
    }
  };

  const handleAddExpense = async () => {
    try {
      if (!expenseData.providerId || expenseData.amount <= 0) {
        toast.error('Completa todos los campos requeridos');
        return;
      }

      const provider = providers.find(p => p.id === expenseData.providerId);
      const providerName = provider?.name || 'Proveedor desconocido';

      // Crear egreso como pago negativo
      await paymentApi.create({
        patientId: 'expense',
        amount: -expenseData.amount,
        method: expenseData.method,
        concept: `EGRESO - ${providerName}: ${expenseData.concept}`,
        notes: `Factura: ${expenseData.invoiceNumber || 'N/A'} - ${expenseData.notes}`,
      });

      toast.success('Egreso registrado exitosamente');
      setExpenseData({
        providerId: '',
        amount: 0,
        method: 'CASH',
        concept: '',
        invoiceNumber: '',
        notes: '',
      });
      setIsAddExpenseDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar egreso');
    }
  };

  const handleAddProvider = async () => {
    try {
      if (!providerData.name) {
        toast.error('El nombre del proveedor es requerido');
        return;
      }

      await providerApi.create(providerData);
      toast.success('Proveedor registrado exitosamente');
      setProviderData({
        name: '',
        rut: '',
        address: '',
        phone: '',
        email: '',
        contactName: '',
        notes: '',
      });
      setIsAddProviderOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar proveedor');
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      await providerApi.delete(providerId);
      toast.success('Proveedor eliminado');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar proveedor');
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    try {
      await paymentApi.delete(selectedPayment.id);
      toast.success('Transacción eliminada');
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const getMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find((m) => m.value === method)?.label || method;
  };

  const getPatientName = (patientId: string) => {
    if (patientId === 'expense') return 'Egreso/Proveedor';
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Desconocido';
  };

  // Filtrar pacientes para búsqueda (muestra todos si no hay búsqueda)
  const filteredPatients = searchPatient.trim() 
    ? patients.filter(p => {
        const searchLower = searchPatient.toLowerCase().trim();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          p.phone?.toLowerCase().includes(searchLower) ||
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower)
        );
      })
    : patients;

  // Calcular deudas por paciente
  const debtsByPatient = patients.map(patient => {
    const patientPayments = payments.filter(p => p.patientId === patient.id);
    const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
    // Asumimos que el total de deuda se calcula de otra forma
    // Por ahora mostramos solo los pagos realizados
    return {
      patient,
      totalPaid,
      lastPayment: patientPayments[0],
    };
  }).filter(d => d.totalPaid > 0);

  // Transacciones separadas por tipo
  const incomeTransactions = payments.filter(p => p.amount > 0);
  const expenseTransactions = payments.filter(p => p.amount < 0);

  if (loading) {
    return (
      <div className="space-y-6">
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
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ingresos Hoy</p>
                <p className="text-xl font-bold text-emerald-600">${summary.today.toFixed(2)}</p>
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
                <p className="text-sm text-slate-500">Ingresos Mes</p>
                <p className="text-xl font-bold text-blue-600">${summary.month.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Egresos</p>
                <p className="text-xl font-bold text-red-600">
                  ${Math.abs(expenseTransactions.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Balance</p>
                <p className="text-xl font-bold text-purple-600">
                  ${(summary.total + expenseTransactions.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="h-4 w-4 mr-1" />
              Registrar Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Buscar y Seleccionar Paciente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Escribe nombre, email o teléfono..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      {searchPatient ? `No se encontraron pacientes con "${searchPatient}"` : 'Escribe para buscar pacientes'}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredPatients.slice(0, 10).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, patientId: p.id })}
                          className={`w-full text-left p-2 rounded hover:bg-slate-100 transition-colors ${
                            formData.patientId === p.id ? 'bg-cyan-50 border border-cyan-200' : ''
                          }`}
                        >
                          <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-slate-500">{p.phone} • {p.email}</p>
                        </button>
                      ))}
                      {filteredPatients.length > 10 && (
                        <p className="text-xs text-slate-400 text-center py-1">
                          Y {filteredPatients.length - 10} más...
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {formData.patientId && (
                  <p className="text-sm text-cyan-600">
                    Paciente seleccionado: <strong>
                      {patients.find(p => p.id === formData.patientId)?.firstName} {' '}
                      {patients.find(p => p.id === formData.patientId)?.lastName}
                    </strong>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto ($) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método *</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(v) => setFormData({ ...formData, method: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Concepto *</Label>
                <Input
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  placeholder="Ej: Pago tratamiento"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales"
                  className="w-full min-h-[60px] px-3 py-2 rounded-md border border-slate-200 text-sm resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleAddPayment}
                disabled={!formData.patientId || formData.amount <= 0}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              <ArrowDownLeft className="h-4 w-4 mr-1" />
              Registrar Egreso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Egreso / Proveedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Proveedor *</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsManageProvidersOpen(true)}
                    className="text-cyan-600"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gestionar Proveedores
                  </Button>
                </div>
                <Select
                  value={expenseData.providerId}
                  onValueChange={(v) => setExpenseData({ ...expenseData, providerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.length === 0 ? (
                      <SelectItem value="" disabled>No hay proveedores registrados</SelectItem>
                    ) : (
                      providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} {provider.rut ? `(${provider.rut})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>N° de Factura</Label>
                <Input
                  value={expenseData.invoiceNumber}
                  onChange={(e) => setExpenseData({ ...expenseData, invoiceNumber: e.target.value })}
                  placeholder="Ej: A-001-00001234"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto ($) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseData.amount || ''}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método *</Label>
                  <Select
                    value={expenseData.method}
                    onValueChange={(v) => setExpenseData({ ...expenseData, method: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Concepto *</Label>
                <Input
                  value={expenseData.concept}
                  onChange={(e) => setExpenseData({ ...expenseData, concept: e.target.value })}
                  placeholder="Ej: Compra de insumos"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <textarea
                  value={expenseData.notes}
                  onChange={(e) => setExpenseData({ ...expenseData, notes: e.target.value })}
                  placeholder="Notas adicionales"
                  className="w-full min-h-[60px] px-3 py-2 rounded-md border border-slate-200 text-sm resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleAddExpense}
                disabled={!expenseData.providerId || expenseData.amount <= 0}
                variant="destructive"
              >
                Registrar Egreso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="ingresos" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-5">
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="egresos">Egresos</TabsTrigger>
          <TabsTrigger value="deudas">Deudas</TabsTrigger>
          <TabsTrigger value="pacientes">Por Paciente</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                Ingresos Registrados
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
                    {incomeTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          No hay ingresos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      incomeTransactions.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(parseISO(payment.paidAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                          <TableCell>{getPatientName(payment.patientId)}</TableCell>
                          <TableCell>{payment.concept || '-'}</TableCell>
                          <TableCell>{getMethodLabel(payment.method)}</TableCell>
                          <TableCell>
                            <span className="font-bold text-emerald-600">+${payment.amount.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setIsDeleteDialogOpen(true); }} className="text-red-600">
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

        <TabsContent value="egresos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5 text-red-500" />
                Egresos / Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          No hay egresos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenseTransactions.map((payment) => {
                        const concept = payment.concept?.replace('EGRESO - ', '') || '-';
                        const provider = concept.split(':')[0] || 'Proveedor';
                        const desc = concept.split(':')[1] || '-';
                        const invoiceMatch = payment.notes?.match(/Factura: ([^\s]+)/);
                        const invoice = invoiceMatch ? invoiceMatch[1] : '-';
                        
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>{format(parseISO(payment.paidAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                            <TableCell>{provider}</TableCell>
                            <TableCell>{invoice}</TableCell>
                            <TableCell>{desc}</TableCell>
                            <TableCell>
                              <span className="font-bold text-red-600">-${Math.abs(payment.amount).toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setIsDeleteDialogOpen(true); }} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
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

        <TabsContent value="deudas">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Deudas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {debts.filter(d => d.status === 'PENDING' || d.status === 'PARTIAL').length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Wallet className="h-12 w-12 mx-auto mb-2" />
                    <p>No hay deudas pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {debts
                      .filter(d => d.status === 'PENDING' || d.status === 'PARTIAL')
                      .map((debt) => (
                        <div key={debt.id} className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {debt.patient?.firstName?.[0]}{debt.patient?.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {debt.patient?.firstName} {debt.patient?.lastName}
                              </p>
                              <p className="text-sm text-slate-500">{debt.reason}</p>
                              <p className="text-xs text-slate-400">
                                {format(parseISO(debt.createdAt), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">
                              ${debt.remainingAmount?.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">
                              de ${debt.amount?.toFixed(2)}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => openDebtPaymentDialog(debt)}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Pagar
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

        <TabsContent value="pacientes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Pagos por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {debtsByPatient.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      No hay pagos registrados por paciente
                    </div>
                  ) : (
                    debtsByPatient.map(({ patient, totalPaid, lastPayment }) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {patient.firstName[0]}{patient.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{patient.firstName} {patient.lastName}</p>
                            <p className="text-sm text-slate-500">{patient.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">${totalPaid.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">
                            Último: {lastPayment ? format(parseISO(lastPayment.paidAt), 'dd MMM', { locale: es }) : '-'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-500" />
                Todas las Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          No hay transacciones registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...payments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(parseISO(payment.paidAt), 'dd MMM yyyy HH:mm', { locale: es })}</TableCell>
                          <TableCell>
                            <Badge variant={payment.amount > 0 ? 'default' : 'destructive'}>
                              {payment.amount > 0 ? 'Ingreso' : 'Egreso'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getPatientName(payment.patientId)}</TableCell>
                          <TableCell>{payment.concept || '-'}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${payment.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {payment.amount > 0 ? '+' : '-'}${Math.abs(payment.amount).toFixed(2)}
                            </span>
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

      {/* Dialog de Eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            ¿Estás seguro de eliminar esta transacción? Esta acción no se puede deshacer.
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

      {/* Dialog de Pago de Deuda */}
      <Dialog open={isDebtPaymentDialogOpen} onOpenChange={setIsDebtPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Registrar Pago de Deuda
            </DialogTitle>
          </DialogHeader>
          
          {selectedDebt && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Paciente</p>
                <p className="font-medium">
                  {selectedDebt.patient?.firstName} {selectedDebt.patient?.lastName}
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 mb-1">{selectedDebt.reason}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="font-medium">${selectedDebt.amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pagado</p>
                    <p className="font-medium text-emerald-600">${selectedDebt.paidAmount?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Pendiente</p>
                    <p className="text-lg font-bold text-red-600">${selectedDebt.remainingAmount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Monto a pagar *</Label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedDebt.remainingAmount}
                    step="0.01"
                    value={debtPaymentAmount}
                    onChange={(e) => setDebtPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label>Método de pago</Label>
                  <Select value={debtPaymentMethod} onValueChange={setDebtPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDebtPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDebtPayment}
              disabled={!debtPaymentAmount || parseFloat(debtPaymentAmount) <= 0}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestionar Proveedores */}
      <Dialog open={isManageProvidersOpen} onOpenChange={setIsManageProvidersOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Proveedores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">
                {providers.length} proveedor(es) registrado(s)
              </p>
              <Button 
                size="sm" 
                onClick={() => setIsAddProviderOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Proveedor
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                        No hay proveedores registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>{provider.rut || '-'}</TableCell>
                        <TableCell>{provider.phone || '-'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteProvider(provider.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageProvidersOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Agregar Proveedor */}
      <Dialog open={isAddProviderOpen} onOpenChange={setIsAddProviderOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={providerData.name}
                onChange={(e) => setProviderData({ ...providerData, name: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RUT</Label>
                <Input
                  value={providerData.rut}
                  onChange={(e) => setProviderData({ ...providerData, rut: e.target.value })}
                  placeholder="Ej: 12.345.678-9"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={providerData.phone}
                  onChange={(e) => setProviderData({ ...providerData, phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={providerData.address}
                onChange={(e) => setProviderData({ ...providerData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={providerData.email}
                  onChange={(e) => setProviderData({ ...providerData, email: e.target.value })}
                  placeholder="proveedor@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input
                  value={providerData.contactName}
                  onChange={(e) => setProviderData({ ...providerData, contactName: e.target.value })}
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <textarea
                value={providerData.notes}
                onChange={(e) => setProviderData({ ...providerData, notes: e.target.value })}
                placeholder="Notas adicionales"
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-slate-200 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleAddProvider}
              disabled={!providerData.name}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              Registrar Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
