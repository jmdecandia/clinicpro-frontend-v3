import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Patients } from '@/pages/Patients';
import { Services } from '@/pages/Services';
import { Appointments } from '@/pages/Appointments';
import { Payments } from '@/pages/Payments';
import { Notifications } from '@/pages/Notifications';
import { Profile } from '@/pages/Profile';
import { SuperAdminDashboard } from '@/pages/SuperAdminDashboard';
import { Professionals } from '@/pages/Professionals';
import { AdminClinics } from '@/pages/admin/Clinics';
import { AdminUsers } from '@/pages/admin/Users';
import { ClinicUsers } from '@/pages/ClinicUsers';

// Componente para redirigir según rol
function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }
  
  if (user?.role === 'STAFF') {
    return <Navigate to="/appointments" replace />;
  }
  
  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/:clinicSlug" element={<Login />} />
          
          {/* Ruta especial para Super Admin - Sin Layout normal */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Rutas protegidas con Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard - Solo Admin de Clínica */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Pacientes - Admin y Staff */}
            <Route path="/patients" element={<Patients />} />
            
            {/* Profesionales - Admin */}
            <Route path="/professionals" element={<Professionals />} />
            
            {/* Servicios - Admin y Staff */}
            <Route path="/services" element={<Services />} />
            
            {/* Citas - Admin y Staff */}
            <Route path="/appointments" element={<Appointments />} />
            
            {/* Pagos - Admin y Staff (ver pagos individuales) */}
            <Route path="/payments" element={<Payments />} />
            
            {/* Notificaciones - Admin y Staff */}
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Perfil - Todos */}
            <Route path="/profile" element={<Profile />} />
            
            {/* Gestión de usuarios - Admin de Clínica */}
            <Route path="/clinic/users" element={<ClinicUsers />} />
            
            {/* Admin - Solo Super Admin */}
            <Route path="/admin/clinics" element={<AdminClinics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
