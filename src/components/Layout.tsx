import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  CreditCard,
  Bell,
  Building2,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Menú para Admin de Clínica (puede ver todo)
const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'professionals', label: 'Profesionales', icon: User, path: '/professionals' },
  { id: 'patients', label: 'Pacientes', icon: Users, path: '/patients' },
  { id: 'services', label: 'Servicios', icon: Stethoscope, path: '/services' },
  { id: 'appointments', label: 'Agenda', icon: CalendarDays, path: '/appointments' },
  { id: 'payments', label: 'Pagos', icon: CreditCard, path: '/payments' },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, path: '/notifications' },
];

// Menú para Staff (NO ve Dashboard ni facturación total)
const staffMenuItems = [
  { id: 'appointments', label: 'Agenda', icon: CalendarDays, path: '/appointments' },
  { id: 'patients', label: 'Pacientes', icon: Users, path: '/patients' },
  { id: 'services', label: 'Servicios', icon: Stethoscope, path: '/services' },
  { id: 'payments', label: 'Pagos', icon: CreditCard, path: '/payments' },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, path: '/notifications' },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clinic, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'CLINIC_ADMIN':
        return 'Admin de Clínica';
      case 'STAFF':
        return 'Personal';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'CLINIC_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'STAFF':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Seleccionar menú según rol
  const menuItems = user?.role === 'STAFF' ? staffMenuItems : adminMenuItems;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-200">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ 
                background: clinic 
                  ? `linear-gradient(135deg, ${clinic.primaryColor}, ${clinic.secondaryColor})`
                  : 'linear-gradient(135deg, #06b6d4, #3b82f6)'
              }}
            >
              {clinic?.logoUrl ? (
                <img src={clinic.logoUrl} alt={clinic.name} className="h-6 w-6 object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg text-slate-900 truncate">
                {clinic?.name || 'ClinicPro'}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {getRoleLabel(user?.role || '')}
              </p>
            </div>
          </div>

          {/* Navegación */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`w-full justify-start gap-3 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer con Logout */}
          <div className="border-t border-slate-200 p-4 space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-4 w-4" />
              Cerrar Sesión
            </Button>
            <p className="text-xs text-slate-400 text-center">
              © 2024 ClinicPro
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span className="text-slate-900 font-medium">
                {menuItems.find(
                  n => location.pathname === n.path || location.pathname.startsWith(n.path + '/')
                )?.label || 'Dashboard'}
              </span>
            </nav>
          </div>

          {/* Usuario + Logout visible */}
          <div className="flex items-center gap-3">
            {/* Botón de logout visible */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOutIcon className="h-4 w-4" />
              Salir
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${getRoleColor(user?.role || '')}`}>
                    {getInitials(user?.name || 'U')}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-slate-500">{user?.email}</span>
                    <span className="text-xs text-slate-400 mt-1">{getRoleLabel(user?.role || '')}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
