import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Clinic, LoginCredentials } from '@/types/api';
import { authApi, clinicApi } from '@/services/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isSuperAdmin: boolean;
  isClinicAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    const token = localStorage.getItem('clinicpro_token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getProfile();
      setUser(response.data);
      
      // Cargar clínica del usuario
      if (response.data.clinicId) {
        const clinicResponse = await clinicApi.getById(response.data.clinicId);
        setClinic(clinicResponse.data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      const { token, user } = response.data;
      
      localStorage.setItem('clinicpro_token', token);
      localStorage.setItem('clinicpro_user', JSON.stringify(user));
      
      setUser(user);
      
      // Cargar clínica
      if (user.clinicId) {
        const clinicResponse = await clinicApi.getById(user.clinicId);
        setClinic(clinicResponse.data);
      }
      
      toast.success(`Bienvenido, ${user.name}!`);
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clinicpro_token');
    localStorage.removeItem('clinicpro_user');
    setUser(null);
    setClinic(null);
    toast.info('Sesión cerrada');
  };

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    clinic,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    loadUser,
    hasRole,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isClinicAdmin: user?.role === 'CLINIC_ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
