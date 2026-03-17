import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clinicApi } from '@/services/api';

export function Login() {
  const navigate = useNavigate();
  const { clinicSlug } = useParams<{ clinicSlug?: string }>();
  const { login } = useAuth();
  
  const [step, setStep] = useState<'clinic' | 'credentials'>(clinicSlug ? 'credentials' : 'clinic');
  const [clinic, setClinic] = useState<{ name: string; slug: string; logoUrl?: string; primaryColor: string } | null>(null);
  const [clinicInput, setClinicInput] = useState(clinicSlug || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar clínica o acceso admin
  const verifyClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const input = clinicInput.toLowerCase().trim();
    
    // Si escribe "administrador", ir directo a login de super admin
    if (input === 'administrador' || input === 'admin') {
      setClinic(null);
      setStep('credentials');
      setIsLoading(false);
      return;
    }

    try {
      const slug = input.replace(/\s+/g, '-');
      const response = await clinicApi.getBySlug(slug);
      setClinic(response.data);
      setStep('credentials');
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('⚠️ Backend no conectado. Para usar la app: 1) Ejecuta ./start-local.sh o 2) Despliega en Render y actualiza VITE_API_URL en app/.env');
      } else if (error.response?.status === 404) {
        setError('Clínica no encontrada. Usa "clinica-demo" para probar o "administrador" para acceso admin.');
      } else {
        setError('Error al verificar la clínica. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('⚠️ Backend no conectado. Para usar la app: 1) Ejecuta ./start-local.sh o 2) Despliega en Render y actualiza VITE_API_URL en app/.env');
      } else {
        setError(error.response?.data?.error || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login como Super Admin (sin clínica)
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ClinicPro</h1>
          <p className="text-slate-500">Sistema de Gestión para Clínicas</p>
        </div>

        <Card>
          {step === 'clinic' ? (
            <>
              <CardHeader>
                <CardTitle>Selecciona tu Clínica</CardTitle>
                <CardDescription>
                  Ingresa el nombre de tu clínica o escribe "administrador" para acceso de super admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={verifyClinic} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic">Nombre de la Clínica</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="clinic"
                        placeholder="Ej: Mi Clínica o 'administrador'"
                        value={clinicInput}
                        onChange={(e) => setClinicInput(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {clinicInput.toLowerCase().trim() === 'administrador' 
                        ? 'Acceso de Super Administrador' 
                        : `clinicpro.com/${clinicInput.toLowerCase().trim().replace(/\s+/g, '-') || 'tu-clinica'}`}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    disabled={isLoading || !clinicInput.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setStep('clinic');
                      setClinic(null);
                      setError('');
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle>{clinic ? clinic.name : 'Iniciar Sesión'}</CardTitle>
                <CardDescription>
                  {clinic 
                    ? 'Ingresa tus credenciales para acceder' 
                    : 'Acceso de Super Administrador'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={clinic ? handleLogin : handleSuperAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>


              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          © 2024 ClinicPro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
