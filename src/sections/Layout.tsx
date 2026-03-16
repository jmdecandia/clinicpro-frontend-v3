import type { ReactNode } from 'react';
import type { Vista } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  CreditCard,
  Bell,
  Heart,
  Menu,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  vistaActual: Vista;
  onCambiarVista: (vista: Vista) => void;
  sidebarAbierto: boolean;
  onToggleSidebar: () => void;
}

const menuItems: { id: Vista; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pacientes', label: 'Pacientes', icon: Users },
  { id: 'tratamientos', label: 'Tratamientos', icon: Stethoscope },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'pagos', label: 'Pagos y Deudas', icon: CreditCard },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
];

export function Layout({
  children,
  vistaActual,
  onCambiarVista,
  sidebarAbierto,
  onToggleSidebar,
}: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">DentalPro</h1>
              <p className="text-xs text-slate-500">Gestión Dental</p>
            </div>
          </div>

          {/* Navegación */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = vistaActual === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    onClick={() => onCambiarVista(item.id)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <p className="text-xs text-slate-400 text-center">
              © 2024 DentalPro
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
          >
            {sidebarAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {menuItems.find((m) => m.id === vistaActual)?.label || 'Dashboard'}
          </h2>
          <div className="w-10" /> {/* Spacer para centrar el título */}
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
