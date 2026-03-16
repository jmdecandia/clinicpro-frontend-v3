import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Crown,
  TrendingUp,
  UserPlus,
  Shield,
  LogOut,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { clinicApi, userApi } from '@/services/api';
import type { Clinic, User } from '@/types/api';

export function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchClinic, setSearchClinic] = useState('');
  const [searchUser, setSearchUser] = useState('');
  
  // Formulario nueva clínica
  const [newClinic, setNewClinic] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    primaryColor: '#0ea5e9',
    secondaryColor: '#6366f1',
  });

  // Formulario nuevo usuario
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CLINIC_ADMIN' as 'CLINIC_ADMIN' | 'STAFF',
    clinicId: '',
    phone: '',
  });

  const [isClinicDialogOpen, setIsClinicDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clinicsRes, usersRes] = await Promise.all([
        clinicApi.list(),
        userApi.list(),
      ]);
      setClinics(clinicsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clinicApi.create(newClinic);
      toast.success('Clínica creada exitosamente');
      setIsClinicDialogOpen(false);
      setNewClinic({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        primaryColor: '#0ea5e9',
        secondaryColor: '#6366f1',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear clínica');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.create(newUser);
      toast.success('Usuario creado exitosamente');
      setIsUserDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'CLINIC_ADMIN',
        clinicId: '',
        phone: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear usuario');
    }
  };

  const handleToggleClinicStatus = async (clinic: Clinic) => {
    try {
      await clinicApi.update(clinic.id, { isActive: !clinic.isActive });
      toast.success(`Clínica ${clinic.isActive ? 'desactivada' : 'activada'}`);
      loadData();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await userApi.update(user.id, { isActive: !user.isActive });
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'}`);
      loadData();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta clínica? Esta acción no se puede deshacer.')) return;
    try {
      await clinicApi.delete(clinicId);
      toast.success('Clínica eliminada');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar clínica');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const filteredClinics = clinics.filter(c => 
    c.name.toLowerCase().includes(searchClinic.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchClinic.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const stats = {
    totalClinics: clinics.length,
    activeClinics: clinics.filter(c => c.isActive).length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'CLINIC_ADMIN').length,
    staffUsers: users.filter(u => u.role === 'STAFF').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ClinicPro Admin</h1>
                <p className="text-xs text-slate-500">Panel de Super Administrador</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              Cargando...
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-slate-500">Clínicas</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalClinics}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-500">Activas</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.activeClinics}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-slate-500">Usuarios</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-slate-500">Admins</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.adminUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-cyan-500" />
                <span className="text-sm text-slate-500">Staff</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.staffUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-500">Activos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.activeUsers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="clinics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="clinics" className="gap-2">
              <Building2 className="h-4 w-4" />
              Clínicas
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          {/* Clinics Tab */}
          <TabsContent value="clinics" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar clínicas..."
                  value={searchClinic}
                  onChange={(e) => setSearchClinic(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isClinicDialogOpen} onOpenChange={setIsClinicDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Clínica
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Clínica</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClinic} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={newClinic.name}
                        onChange={(e) => setNewClinic({ 
                          ...newClinic, 
                          name: e.target.value,
                          slug: generateSlug(e.target.value)
                        })}
                        placeholder="Nombre de la clínica"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL (slug) *</Label>
                      <Input
                        value={newClinic.slug}
                        onChange={(e) => setNewClinic({ ...newClinic, slug: e.target.value })}
                        placeholder="mi-clinica"
                        required
                      />
                      <p className="text-xs text-slate-500">clinicpro.com/{newClinic.slug || 'mi-clinica'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newClinic.email}
                        onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
                        placeholder="contacto@clinica.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono *</Label>
                      <Input
                        value={newClinic.phone}
                        onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                        placeholder="+34 600 000 000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input
                        value={newClinic.address}
                        onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                        placeholder="Calle Principal 123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input
                        value={newClinic.city}
                        onChange={(e) => setNewClinic({ ...newClinic, city: e.target.value })}
                        placeholder="Madrid"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Color Primario</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newClinic.primaryColor}
                            onChange={(e) => setNewClinic({ ...newClinic, primaryColor: e.target.value })}
                            className="h-10 w-10 rounded border"
                          />
                          <Input value={newClinic.primaryColor} readOnly className="flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Color Secundario</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newClinic.secondaryColor}
                            onChange={(e) => setNewClinic({ ...newClinic, secondaryColor: e.target.value })}
                            className="h-10 w-10 rounded border"
                          />
                          <Input value={newClinic.secondaryColor} readOnly className="flex-1" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsClinicDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Crear Clínica</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Clinics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClinics.map((clinic) => (
                <Card key={clinic.id} className={!clinic.isActive ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ background: `linear-gradient(135deg, ${clinic.primaryColor}, ${clinic.secondaryColor})` }}
                        >
                          {clinic.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{clinic.name}</CardTitle>
                          <CardDescription>/{clinic.slug}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={clinic.isActive ? 'default' : 'secondary'}>
                        {clinic.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" />
                        {clinic.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4" />
                        {clinic.phone}
                      </div>
                      {clinic.address && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4" />
                          {clinic.address}{clinic.city && `, ${clinic.city}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handleToggleClinicStatus(clinic)}
                      >
                        {clinic.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {clinic.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClinic(clinic.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre completo *</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Nombre del usuario"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="usuario@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña *</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        placeholder="+34 600 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rol *</Label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'CLINIC_ADMIN' | 'STAFF' })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="CLINIC_ADMIN">Administrador de Clínica</option>
                        <option value="STAFF">Personal (Staff)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Clínica asignada *</Label>
                      <select
                        value={newUser.clinicId}
                        onChange={(e) => setNewUser({ ...newUser, clinicId: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        required
                      >
                        <option value="">Seleccionar clínica...</option>
                        {clinics.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Crear Usuario</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Usuario</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Rol</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Clínica</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((u) => {
                      const userClinic = clinics.find(c => c.id === u.clinicId);
                      return (
                        <tr key={u.id} className={!u.isActive ? 'bg-slate-50' : ''}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">{u.name}</p>
                              <p className="text-sm text-slate-500">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role === 'CLINIC_ADMIN' ? 'default' : 'secondary'}>
                              {u.role === 'CLINIC_ADMIN' ? 'Admin' : 'Staff'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {userClinic ? (
                              <span className="text-sm text-slate-600">{userClinic.name}</span>
                            ) : (
                              <span className="text-sm text-slate-400">Sin clínica</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? 'bg-green-100 text-green-800' : ''}>
                              {u.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleUserStatus(u)}
                            >
                              {u.isActive ? 'Desactivar' : 'Activar'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
