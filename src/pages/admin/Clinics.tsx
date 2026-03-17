import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Building2, Plus, Search, Edit2, Users, CheckCircle2, XCircle, Palette, User as UserIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clinicApi, userApi } from '@/services/api';
import type { Clinic, User as ClinicUser } from '@/types/api';

export function AdminClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [clinicUsers, setClinicUsers] = useState<ClinicUser[]>([]);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#0ea5e9',
    secondaryColor: '#6366f1',
    clientType: 'patient' as 'patient' | 'client' | 'customer' | 'guest' | 'student' | 'member',
    clientTypeLabel: '',
    countryCode: '+34',
  });

  const CLIENT_TYPES = [
    { value: 'patient', label: 'Paciente (Clínica médica/dental)' },
    { value: 'client', label: 'Cliente (Estética, peluquería)' },
    { value: 'customer', label: 'Cliente (Tienda, servicios)' },
    { value: 'guest', label: 'Huésped (Hotel, alojamiento)' },
    { value: 'student', label: 'Estudiante (Academia, curso)' },
    { value: 'member', label: 'Miembro (Gimnasio, club)' },
  ];

  const COUNTRY_CODES = [
    { value: '+34', label: '🇪🇸 España (+34)' },
    { value: '+598', label: '🇺🇾 Uruguay (+598)' },
    { value: '+54', label: '🇦🇷 Argentina (+54)' },
    { value: '+56', label: '🇨🇱 Chile (+56)' },
    { value: '+57', label: '🇨🇴 Colombia (+57)' },
    { value: '+52', label: '🇲🇽 México (+52)' },
    { value: '+51', label: '🇵🇪 Perú (+51)' },
    { value: '+1', label: '🇺🇸 USA/Canadá (+1)' },
    { value: '+55', label: '🇧🇷 Brasil (+55)' },
  ];

  const fetchClinics = async () => {
    try {
      setIsLoading(true);
      const response = await clinicApi.list();
      // Filter by search query if provided
      let clinicsData = response.data;
      if (searchQuery) {
        clinicsData = clinicsData.filter((c: Clinic) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setClinics(clinicsData);
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudieron cargar las clínicas.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await clinicApi.create(formData);
      toast.success('Clínica creada', {
        description: 'La clínica ha sido creada correctamente.',
      });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        primaryColor: '#0ea5e9',
        secondaryColor: '#6366f1',
        clientType: 'patient' as 'patient' | 'client' | 'customer' | 'guest' | 'student' | 'member',
        clientTypeLabel: '',
        countryCode: '+34',
      });
      fetchClinics();
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudo crear la clínica.',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;

    try {
      await clinicApi.update(selectedClinic.id, formData);
      toast.success('Clínica actualizada', {
        description: 'La clínica ha sido actualizada correctamente.',
      });
      setIsEditDialogOpen(false);
      setSelectedClinic(null);
      fetchClinics();
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudo actualizar la clínica.',
      });
    }
  };

  const handleToggleStatus = async (clinic: Clinic) => {
    try {
      await clinicApi.update(clinic.id, { isActive: !clinic.isActive });
      toast.success(clinic.isActive ? 'Clínica desactivada' : 'Clínica activada', {
        description: `La clínica "${clinic.name}" ha sido ${clinic.isActive ? 'desactivada' : 'activada'}.`,
      });
      fetchClinics();
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudo cambiar el estado de la clínica.',
      });
    }
  };

  const handleViewUsers = async (clinic: Clinic) => {
    try {
      const response = await userApi.list({ clinicId: clinic.id });
      setClinicUsers(response.data);
      setSelectedClinic(clinic);
      setIsUsersDialogOpen(true);
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudieron cargar los usuarios.',
      });
    }
  };

  const openEditDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setFormData({
      name: clinic.name,
      slug: clinic.slug,
      address: clinic.address || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      website: '',
      primaryColor: clinic.primaryColor,
      secondaryColor: clinic.secondaryColor,
      clientType: clinic.clientType || 'patient',
      clientTypeLabel: clinic.clientTypeLabel || '',
      countryCode: clinic.countryCode || '+34',
    });
    setIsEditDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clínicas</h1>
          <p className="text-muted-foreground">
            Administra todas las clínicas del sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Clínica</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    placeholder="Nombre de la clínica"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="mi-clinica"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@clinica.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.clinica.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#0ea5e9"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Color secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientType" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Tipo de cliente
                  </Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(v) => setFormData({ ...formData, clientType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientTypeLabel">Etiqueta personalizada (opcional)</Label>
                  <Input
                    id="clientTypeLabel"
                    value={formData.clientTypeLabel}
                    onChange={(e) => setFormData({ ...formData, clientTypeLabel: e.target.value })}
                    placeholder="Ej: Paciente, Cliente, Huésped..."
                  />
                  <p className="text-xs text-slate-500">
                    Si se deja vacío, se usará la etiqueta por defecto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryCode">País / Prefijo telefónico</Label>
                  <Select
                    value={formData.countryCode}
                    onValueChange={(v) => setFormData({ ...formData, countryCode: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Crear Clínica</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clínicas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinics.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clinics.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clinics.filter(c => !c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Logo</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clinics.filter(c => c.logoUrl).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clínicas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Clinics Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Colores</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : clinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron clínicas
                  </TableCell>
                </TableRow>
              ) : (
                clinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: clinic.primaryColor }}
                        >
                          {clinic.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{clinic.name}</p>
                          <p className="text-sm text-muted-foreground">{clinic.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {clinic.email && <p>{clinic.email}</p>}
                        {clinic.phone && <p className="text-muted-foreground">{clinic.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {clinic.clientTypeLabel || 
                            CLIENT_TYPES.find(t => t.value === clinic.clientType)?.label.split('(')[0].trim() || 
                            'Paciente'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{clinic.countryCode}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <div
                          className="h-5 w-5 rounded border"
                          style={{ backgroundColor: clinic.primaryColor }}
                          title="Primario"
                        />
                        <div
                          className="h-5 w-5 rounded border"
                          style={{ backgroundColor: clinic.secondaryColor }}
                          title="Secundario"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        clinic.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {clinic.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewUsers(clinic)}
                          title="Ver usuarios"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(clinic)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(clinic)}
                          title={clinic.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {clinic.isActive ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug (URL) *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-address">Dirección</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-website">Sitio web</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-primaryColor">Color primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-secondaryColor">Color secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-clientType">Tipo de cliente</Label>
                <Select
                  value={formData.clientType}
                  onValueChange={(v) => setFormData({ ...formData, clientType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-clientTypeLabel">Etiqueta personalizada</Label>
                <Input
                  id="edit-clientTypeLabel"
                  value={formData.clientTypeLabel}
                  onChange={(e) => setFormData({ ...formData, clientTypeLabel: e.target.value })}
                  placeholder="Ej: Paciente, Cliente..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-countryCode">País / Prefijo telefónico</Label>
                <Select
                  value={formData.countryCode}
                  onValueChange={(v) => setFormData({ ...formData, countryCode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usuarios de {selectedClinic?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {clinicUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay usuarios en esta clínica
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'CLINIC_ADMIN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'CLINIC_ADMIN' ? 'Admin' : 'Personal'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
