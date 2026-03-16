import { useState, useEffect, useCallback } from 'react';
import type { Notificacion, Cita, Paciente } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import emailjs from '@emailjs/browser';
import { 
  EMAILJS_CONFIG, 
  WHATSAPP_CONFIG, 
  isEmailJSConfigured
} from '@/config/notifications';
import { toast } from 'sonner';

const STORAGE_KEY = 'dental_notificaciones';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailjsReady, setEmailjsReady] = useState(false);

  // Inicializar EmailJS
  useEffect(() => {
    if (isEmailJSConfigured()) {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      setEmailjsReady(true);
    }
  }, []);

  // Cargar notificaciones desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotificaciones(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing notificaciones:', e);
      }
    }
    setLoading(false);
  }, []);

  // Guardar en localStorage cuando cambien las notificaciones
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificaciones));
    }
  }, [notificaciones, loading]);

  const addNotificacion = useCallback((notificacion: Omit<Notificacion, 'id' | 'fechaEnvio' | 'estado'>) => {
    const newNotificacion: Notificacion = {
      ...notificacion,
      id: crypto.randomUUID(),
      fechaEnvio: new Date().toISOString(),
      estado: 'pendiente',
    };
    setNotificaciones(prev => [newNotificacion, ...prev]);
    return newNotificacion;
  }, []);

  const marcarComoEnviada = useCallback((id: string) => {
    setNotificaciones(prev =>
      prev.map(n => (n.id === id ? { ...n, estado: 'enviada' } : n))
    );
  }, []);

  const marcarComoError = useCallback((id: string, errorMsg?: string) => {
    setNotificaciones(prev =>
      prev.map(n => (n.id === id ? { ...n, estado: 'error', notas: errorMsg } : n))
    );
  }, []);

  const getNotificacionesByPaciente = useCallback((pacienteId: string) => {
    return notificaciones
      .filter(n => n.pacienteId === pacienteId)
      .sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
  }, [notificaciones]);

  const getNotificacionesPendientes = useCallback(() => {
    return notificaciones.filter(n => n.estado === 'pendiente');
  }, [notificaciones]);

  // Función para enviar email real usando EmailJS
  const enviarEmailReal = useCallback(async (
    paciente: Paciente, 
    asunto: string, 
    mensaje: string,
    datosCita?: { fecha: string; hora: string; tratamiento: string; precio: number }
  ): Promise<boolean> => {
    if (!isEmailJSConfigured()) {
      console.warn('EmailJS no está configurado. Email no enviado.');
      toast.error('EmailJS no configurado. Revisa la configuración en src/config/notifications.ts');
      return false;
    }

    try {
      const templateParams = {
        to_email: paciente.email,
        to_name: `${paciente.nombre} ${paciente.apellido}`,
        subject: asunto,
        message: mensaje,
        fecha: datosCita?.fecha || '',
        hora: datosCita?.hora || '',
        tratamiento: datosCita?.tratamiento || '',
        precio: datosCita?.precio?.toFixed(2) || '0.00',
        reply_to: 'clinica@dentalpro.com',
      };

      const result = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      if (result.status === 200) {
        console.log('✅ Email enviado exitosamente a', paciente.email);
        return true;
      } else {
        console.error('❌ Error enviando email:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error en EmailJS:', error);
      toast.error('Error al enviar email. Verifica tu configuración de EmailJS.');
      return false;
    }
  }, []);

  // Función para abrir WhatsApp Web con mensaje predefinido
  const abrirWhatsApp = useCallback((
    telefono: string, 
    mensaje: string
  ): boolean => {
    if (!WHATSAPP_CONFIG.ENABLED) {
      return false;
    }

    // Limpiar número de teléfono
    let numeroLimpio = telefono.replace(/\D/g, '');
    
    // Agregar código de país si no lo tiene
    if (WHATSAPP_CONFIG.DEFAULT_COUNTRY_CODE && !numeroLimpio.startsWith(WHATSAPP_CONFIG.DEFAULT_COUNTRY_CODE)) {
      numeroLimpio = WHATSAPP_CONFIG.DEFAULT_COUNTRY_CODE + numeroLimpio;
    }

    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Crear URL de WhatsApp Web
    const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    return true;
  }, []);

  // Función para crear notificación de confirmación de cita
  const crearNotificacionCita = useCallback((cita: Cita, paciente: Paciente, tipo: 'email' | 'sms' | 'whatsapp' = 'email') => {
    const fechaFormateada = format(new Date(cita.fecha), 'EEEE d MMMM yyyy', { locale: es });
    const asunto = `Confirmación de cita - ${cita.tratamientoNombre}`;
    const mensaje = `Hola ${paciente.nombre},

Tu cita ha sido agendada:

📅 Fecha: ${fechaFormateada}
🕐 Hora: ${cita.hora}
🦷 Tratamiento: ${cita.tratamientoNombre}
💰 Precio: $${cita.precio.toFixed(2)}

Te esperamos en nuestra clínica dental.

Saludos,
Clínica Dental`;

    return addNotificacion({
      pacienteId: paciente.id,
      tipo,
      asunto,
      mensaje,
      citaId: cita.id,
    });
  }, [addNotificacion]);

  // Función para crear notificación de recordatorio
  const crearRecordatorioCita = useCallback((cita: Cita, paciente: Paciente, tipo: 'email' | 'sms' | 'whatsapp' = 'email') => {
    const fechaFormateada = format(new Date(cita.fecha), 'EEEE d MMMM yyyy', { locale: es });
    const asunto = `Recordatorio de cita - Mañana`;
    const mensaje = `Hola ${paciente.nombre},

Te recordamos que tienes una cita programada para mañana:

📅 Fecha: ${fechaFormateada}
🕐 Hora: ${cita.hora}
🦷 Tratamiento: ${cita.tratamientoNombre}

Por favor confirma tu asistencia.

Saludos,
Clínica Dental`;

    return addNotificacion({
      pacienteId: paciente.id,
      tipo,
      asunto,
      mensaje,
      citaId: cita.id,
    });
  }, [addNotificacion]);

  // Función principal para enviar notificación
  const enviarNotificacion = useCallback(async (
    notificacion: Notificacion, 
    paciente: Paciente
  ): Promise<boolean> => {
    let exito = false;

    switch (notificacion.tipo) {
      case 'email':
        // Extraer datos de la cita del mensaje si es posible
        const datosCita = {
          fecha: '',
          hora: '',
          tratamiento: '',
          precio: 0,
        };
        
        // Intentar extraer datos del mensaje
        const fechaMatch = notificacion.mensaje.match(/📅 Fecha: (.+)/);
        const horaMatch = notificacion.mensaje.match(/🕐 Hora: (.+)/);
        const tratamientoMatch = notificacion.mensaje.match(/🦷 Tratamiento: (.+)/);
        const precioMatch = notificacion.mensaje.match(/💰 Precio: \$(.+)/);
        
        if (fechaMatch) datosCita.fecha = fechaMatch[1];
        if (horaMatch) datosCita.hora = horaMatch[1];
        if (tratamientoMatch) datosCita.tratamiento = tratamientoMatch[1];
        if (precioMatch) datosCita.precio = parseFloat(precioMatch[1]);

        exito = await enviarEmailReal(
          paciente, 
          notificacion.asunto, 
          notificacion.mensaje,
          datosCita
        );
        break;

      case 'whatsapp':
        exito = abrirWhatsApp(paciente.telefono, notificacion.mensaje);
        if (exito) {
          toast.success('WhatsApp Web abierto. Completa el envío del mensaje.');
        }
        break;

      case 'sms':
        // Para SMS, abrir enlace sms: (funciona en móviles)
        const smsUrl = `sms:${paciente.telefono}?body=${encodeURIComponent(notificacion.mensaje)}`;
        window.open(smsUrl, '_blank');
        exito = true;
        toast.success('App de SMS abierta. Completa el envío del mensaje.');
        break;

      default:
        console.warn('Tipo de notificación no soportado:', notificacion.tipo);
        return false;
    }

    if (exito) {
      marcarComoEnviada(notificacion.id);
    } else {
      marcarComoError(notificacion.id, 'Error al enviar la notificación');
    }

    return exito;
  }, [enviarEmailReal, abrirWhatsApp, marcarComoEnviada, marcarComoError]);

  // Función para enviar email directo (sin crear notificación)
  const enviarEmailDirecto = useCallback(async (
    paciente: Paciente,
    asunto: string,
    mensaje: string
  ): Promise<boolean> => {
    return await enviarEmailReal(paciente, asunto, mensaje);
  }, [enviarEmailReal]);

  return {
    notificaciones,
    loading,
    emailjsReady,
    addNotificacion,
    marcarComoEnviada,
    marcarComoError,
    getNotificacionesByPaciente,
    getNotificacionesPendientes,
    crearNotificacionCita,
    crearRecordatorioCita,
    enviarNotificacion,
    enviarEmailDirecto,
    abrirWhatsApp,
    isEmailJSConfigured: isEmailJSConfigured(),
  };
}
