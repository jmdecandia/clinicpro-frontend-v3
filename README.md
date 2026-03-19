# ClinicPro Backend v2.0 - PostgreSQL Edition

Backend multi-tenant para gestión de clínicas con persistencia en PostgreSQL.

## Características

- ✅ Persistencia completa en PostgreSQL
- ✅ Arquitectura multi-tenant con aislamiento de datos por clínica
- ✅ Sistema de autenticación JWT
- ✅ Roles de usuario: SUPER_ADMIN, CLINIC_ADMIN, STAFF
- ✅ Gestión de pacientes, profesionales, servicios y citas
- ✅ Control de pagos y deudas
- ✅ Notificaciones por WhatsApp
- ✅ Historial de tratamientos con notas del profesional
- ✅ Analytics reales (ingresos por profesional, por servicio, % de ocupación)

## Despliegue en Render

### 1. Crear Base de Datos PostgreSQL

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Clic en "New" → "PostgreSQL"
3. Configura:
   - Name: `clinicpro-db`
   - Database: `clinicpro`
   - User: `clinicpro`
   - Region: Selecciona la más cercana
4. Clic en "Create Database"
5. Copia la "Internal Database URL" (la necesitarás en el paso 2)

### 2. Crear Web Service

1. En Render Dashboard, clic en "New" → "Web Service"
2. Conecta tu repositorio de GitHub o usa "Deploy from Git"
3. Configura:
   - Name: `clinicpro-api`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Agrega Environment Variables:
   - `DATABASE_URL`: (pega la URL de PostgreSQL del paso 1)
   - `JWT_SECRET`: (genera una clave segura, mínimo 32 caracteres)
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: (URL de tu frontend en Vercel)
5. Clic en "Create Web Service"

### 3. Ejecutar Migraciones y Seeds

Una vez desplegado, ejecuta los comandos en el shell de Render:

```bash
# Migrar base de datos
npm run migrate

# Cargar datos de prueba
npm run seed
```

O configura un "Deploy Hook" para ejecutar automáticamente.

## Estructura del Proyecto

```
src/
├── config/
│   └── database.js          # Configuración de PostgreSQL/Sequelize
├── models/
│   └── index.js             # Todos los modelos y relaciones
├── routes/
│   ├── auth.js              # Autenticación
│   ├── clinics.js           # Clínicas
│   ├── patients.js          # Pacientes
│   ├── services.js          # Servicios
│   ├── professionals.js     # Profesionales
│   ├── appointments.js      # Citas
│   ├── timeBlocks.js        # Bloqueos de tiempo
│   ├── payments.js          # Pagos
│   ├── providers.js         # Proveedores
│   ├── debts.js             # Deudas
│   ├── notifications.js     # Notificaciones
│   ├── professionalNotes.js # Notas del profesional
│   ├── users.js             # Usuarios
│   └── dashboard.js         # Dashboard y analytics
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── migrations/
│   └── migrate.js           # Script de migración
├── seeds/
│   └── seed.js              # Datos de prueba
└── server.js                # Punto de entrada
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña

### Clínicas
- `GET /api/clinics` - Listar clínicas
- `GET /api/clinics/:id` - Obtener clínica
- `GET /api/clinics/slug/:slug` - Obtener por slug
- `POST /api/clinics` - Crear clínica (Super Admin)
- `PUT /api/clinics/:id` - Actualizar clínica

### Pacientes
- `GET /api/patients` - Listar pacientes
- `GET /api/patients/:id` - Obtener paciente
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Desactivar paciente

### Profesionales
- `GET /api/professionals` - Listar profesionales
- `GET /api/professionals/:id` - Obtener profesional
- `POST /api/professionals` - Crear profesional
- `PUT /api/professionals/:id` - Actualizar profesional
- `DELETE /api/professionals/:id` - Desactivar profesional

### Citas
- `GET /api/appointments` - Listar citas
- `GET /api/appointments/today` - Citas de hoy
- `GET /api/appointments/availability` - Disponibilidad
- `GET /api/appointments/:id` - Obtener cita
- `POST /api/appointments` - Crear cita
- `PUT /api/appointments/:id` - Actualizar cita
- `PATCH /api/appointments/:id/status` - Cambiar estado
- `DELETE /api/appointments/:id` - Cancelar cita

### Pagos
- `GET /api/payments` - Listar pagos
- `GET /api/payments/summary` - Resumen
- `POST /api/payments` - Registrar pago
- `DELETE /api/payments/:id` - Eliminar pago

### Proveedores
- `GET /api/providers` - Listar proveedores
- `GET /api/providers/:id` - Obtener proveedor
- `POST /api/providers` - Crear proveedor
- `PUT /api/providers/:id` - Actualizar proveedor
- `DELETE /api/providers/:id` - Desactivar proveedor

### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `POST /api/notifications` - Enviar notificación
- `POST /api/notifications/send-whatsapp` - Enviar WhatsApp
- `POST /api/notifications/confirm-appointment` - Confirmar cita
- `POST /api/notifications/reminders` - Enviar recordatorios

### Dashboard
- `GET /api/dashboard` - Estadísticas y analytics

## Credenciales de Prueba

Después de ejecutar `npm run seed`:

- **Super Admin**: `admin@clinicpro.com` / `admin123`
- **Admin Clínica**: `clinica@demo.com` / `clinica123`
- **Staff**: `staff@demo.com` / `staff123`

## Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí |
| `JWT_SECRET` | Clave secreta para JWT | Sí |
| `PORT` | Puerto del servidor | No (default: 3001) |
| `NODE_ENV` | Entorno (development/production) | No |
| `FRONTEND_URL` | URL del frontend para CORS | No |

## Comandos

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start

# Ejecutar migraciones
npm run migrate

# Cargar datos de prueba
npm run seed

# Setup completo (migrar + seed)
npm run setup
```

## Licencia

MIT
