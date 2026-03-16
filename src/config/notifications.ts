// Configuración para servicios de notificación
// Para usar EmailJS, necesitas crear una cuenta gratuita en https://www.emailjs.com/

export const EMAILJS_CONFIG = {
  // Reemplaza estos valores con tus credenciales de EmailJS
  PUBLIC_KEY: 'TU_PUBLIC_KEY', // Obtén esto de tu dashboard de EmailJS
  SERVICE_ID: 'TU_SERVICE_ID', // Crea un servicio de email en EmailJS
  TEMPLATE_ID: 'TU_TEMPLATE_ID', // Crea una plantilla en EmailJS
  
  // Habilitar/deshabilitar envío real de emails
  // Cambia a true cuando configures tus credenciales
  ENABLED: false,
};

// Configuración de WhatsApp
export const WHATSAPP_CONFIG = {
  // Usar WhatsApp Web API (wa.me)
  ENABLED: true,
  // Prefijo para números de teléfono (código de país sin +)
  // Ejemplo: '54' para Argentina, '52' para México, '34' para España
  DEFAULT_COUNTRY_CODE: '',
};

// Configuración de SMS (Twilio)
export const TWILIO_CONFIG = {
  // Para SMS real, necesitas cuenta de Twilio
  // Esto es solo para desarrollo futuro
  ENABLED: false,
  ACCOUNT_SID: '',
  AUTH_TOKEN: '',
  FROM_NUMBER: '',
};

// Plantilla de email por defecto (usada si EmailJS no está configurado)
export const DEFAULT_EMAIL_TEMPLATE = {
  subject: 'Confirmación de cita - Clínica Dental',
  body: (data: {
    pacienteNombre: string;
    fecha: string;
    hora: string;
    tratamiento: string;
    precio: string;
  }) => `
Hola ${data.pacienteNombre},

Tu cita ha sido agendada exitosamente:

📅 Fecha: ${data.fecha}
🕐 Hora: ${data.hora}
🦷 Tratamiento: ${data.tratamiento}
💰 Precio: $${data.precio}

Te esperamos en nuestra clínica dental.

Si necesitas cancelar o reprogramar, por favor contáctanos con anticipación.

Saludos,
Clínica Dental
  `,
};

// Función para validar configuración de EmailJS
export function isEmailJSConfigured(): boolean {
  return (
    EMAILJS_CONFIG.ENABLED &&
    EMAILJS_CONFIG.PUBLIC_KEY !== 'TU_PUBLIC_KEY' &&
    EMAILJS_CONFIG.SERVICE_ID !== 'TU_SERVICE_ID' &&
    EMAILJS_CONFIG.TEMPLATE_ID !== 'TU_TEMPLATE_ID'
  );
}

// Función para obtener instrucciones de configuración
export function getEmailJSInstructions(): string {
  return `
Para habilitar el envío real de emails:

1. Ve a https://www.emailjs.com/ y crea una cuenta gratuita
2. Crea un "Email Service" (Gmail, Outlook, etc.)
3. Crea un "Email Template" con las variables:
   - {{to_email}}
   - {{to_name}}
   - {{subject}}
   - {{message}}
   - {{fecha}}
   - {{hora}}
   - {{tratamiento}}
   - {{precio}}
4. Copia tu Public Key, Service ID y Template ID
5. Actualiza el archivo src/config/notifications.ts
6. Cambia ENABLED a true

¡Listo! Los emails se enviarán realmente.
  `;
}
