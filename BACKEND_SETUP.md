# 🚀 Configuración del Backend - Sistema de Gestión Escolar

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior)
- **MySQL** (versión 8.0 o superior)
- **npm** o **yarn**

## 🔧 Configuración del Entorno

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password_aqui
DB_NAME=colegio_db

# Configuración de la Aplicación
NODE_ENV=development
PORT=3000

# Configuración de JWT
JWT_SECRET=tu_clave_secreta_jwt_aqui
JWT_EXPIRES_IN=24h

# Configuración de CORS
CORS_ORIGIN=http://localhost:4200,http://localhost:61909
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Configuración de la Base de Datos

1. **Crear la base de datos:**
```sql
CREATE DATABASE colegio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Ejecutar las migraciones:**
```bash
npm run migration:run
```

3. **Ejecutar los seeders (opcional):**
```bash
npm run seed:run
```

## 🚀 Ejecución del Proyecto

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

## 📡 Endpoints Principales

### 🔐 Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión

### 👥 Alumnos
- `GET /alumnos` - Obtener todos los alumnos
- `POST /alumnos/registrar` - Registrar nuevo alumno
- `GET /alumnos/codigo/:codigo` - Obtener alumno por código
- `PUT /alumnos/actualizar/:codigo` - Actualizar alumno
- `GET /alumnos/validate/:codigoQR` - Validar código QR

### ⏰ Turnos
- `GET /turno` - Obtener todos los turnos

### 📊 Asistencia
- `POST /asistencia` - Registrar asistencia
- `GET /asistencia` - Obtener registros de asistencia

## 🛠️ Estructura del Proyecto

```
src/
├── auth/                 # Autenticación y autorización
├── common/               # Utilidades comunes
├── config/               # Configuraciones
├── database/             # Base de datos y migraciones
├── entities/             # Entidades del dominio
│   ├── alumno/          # Gestión de alumnos
│   ├── asistencia/      # Control de asistencia
│   ├── turno/           # Gestión de turnos
│   └── usuario/         # Gestión de usuarios
└── main.ts              # Punto de entrada
```

## 🔍 Solución de Problemas Comunes

### Error de Conexión a Base de Datos
- Verificar que MySQL esté ejecutándose
- Verificar credenciales en `.env`
- Verificar que la base de datos exista

### Error de Validación
- Verificar que todos los campos requeridos estén presentes
- Verificar formatos de datos (DNI, código, fecha, etc.)
- Verificar que el turno_id sea un UUID válido

### Error de Autenticación
- Verificar que el token JWT esté presente en el header Authorization
- Verificar que el token no haya expirado
- Verificar que el usuario tenga permisos para la operación

## 📚 Documentación de la API

Una vez ejecutado el proyecto, la documentación Swagger estará disponible en:
```
http://localhost:3000/api
```

## 🧪 Testing

### Tests Unitarios
```bash
npm run test
```

### Tests E2E
```bash
npm run test:e2e
```

### Cobertura de Código
```bash
npm run test:cov
```

## 📝 Logs

Los logs se muestran en la consola y incluyen:
- Peticiones HTTP recibidas
- Errores y excepciones
- Operaciones de base de datos
- Validaciones de datos

## 🔒 Seguridad

- **JWT Authentication** para todas las rutas protegidas
- **Validación de datos** con class-validator
- **CORS configurado** para orígenes específicos
- **Sanitización de inputs** automática

## 📊 Monitoreo

El sistema incluye:
- Logging detallado de operaciones
- Manejo estructurado de errores
- Métricas de rendimiento básicas
- Validación de esquemas de datos
