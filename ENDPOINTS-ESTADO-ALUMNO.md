# 📋 Endpoints - Estado de Alumnos

## Base URL: `/alumnos/estado`

### 1. **GET** `/alumnos/estado`
**Obtener lista completa de alumnos con su estado actual**

**Descripción:** Retorna todos los alumnos registrados con información detallada incluyendo su estado actual, turno y usuario asociado.

**Headers:**
```
Content-Type: application/json
```

**Respuesta exitosa (200):**
```json
[
  {
    "id_alumno": "uuid",
    "codigo": "12076598200730",
    "dni_alumno": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fecha_nacimiento": "2005-01-15",
    "direccion": "Jr. Lima 123",
    "nivel": "Secundaria",
    "grado": 2,
    "seccion": "A",
    "turno": {
      "id_turno": "uuid",
      "turno": "Mañana",
      "hora_inicio": "07:30:00",
      "hora_fin": "12:44:00"
    },
    "usuario": {
      "id_user": "uuid",
      "nombre_usuario": "JUAN.PEREZ",
      "rol_usuario": "ALUMNO",
      "activo": true
    },
    "estado_actual": {
      "estado": "activo",
      "observacion": "Alumno registrado exitosamente",
      "fecha_actualizacion": "2025-02-09T12:00:00.000Z"
    }
  }
]
```

**Respuesta de error (500):**
```json
{
  "statusCode": 500,
  "message": "Error interno del servidor"
}
```

---

### 2. **GET** `/alumnos/estado/:codigo`
**Obtener estado de un alumno específico**

**Descripción:** Retorna el estado actual de un alumno específico por su código de estudiante.

**Parámetros:**
- `codigo` (string): Código de 14 dígitos del estudiante

**Headers:**
```
Content-Type: application/json
```

**Ejemplo de petición:**
```
GET /alumnos/estado/12076598200730
```

**Respuesta exitosa (200):**
```json
{
  "id_alumno": "uuid",
  "codigo": "12076598200730",
  "dni_alumno": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "2005-01-15",
  "direccion": "Jr. Lima 123",
  "nivel": "Secundaria",
  "grado": 2,
  "seccion": "A",
  "turno": {
    "id_turno": "uuid",
    "turno": "Mañana",
    "hora_inicio": "07:30:00",
    "hora_fin": "12:44:00"
  },
  "usuario": {
    "id_user": "uuid",
    "nombre_usuario": "JUAN.PEREZ",
    "rol_usuario": "ALUMNO",
    "activo": true
  },
  "estado_actual": {
    "estado": "activo",
    "observacion": "Alumno registrado exitosamente",
    "fecha_actualizacion": "2025-02-09T12:00:00.000Z"
  }
}
```

**Respuesta de error (404):**
```json
{
  "statusCode": 404,
  "message": "Alumno con código '12076598200730' no encontrado"
}
```

**Respuesta de error (500):**
```json
{
  "statusCode": 500,
  "message": "Error interno del servidor"
}
```

---

### 3. **PUT** `/alumnos/estado/:codigo`
**Actualizar estado de un alumno**

**Descripción:** Actualiza el estado de un alumno específico por su código de estudiante.

**Parámetros:**
- `codigo` (string): Código de 14 dígitos del estudiante

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "estado": "activo",
  "observacion": "Alumno reincorporado después de suspensión"
}
```

**Ejemplo de petición:**
```
PUT /alumnos/estado/12076598200730
Content-Type: application/json

{
  "estado": "suspendido",
  "observacion": "Suspensión por 3 días por comportamiento inadecuado"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Estado actualizado correctamente",
  "estado": "suspendido",
  "timestamp": "2025-02-09T12:00:00.000Z"
}
```

**Respuesta de error (400):**
```json
{
  "statusCode": 400,
  "message": "Datos inválidos"
}
```

**Respuesta de error (404):**
```json
{
  "statusCode": 404,
  "message": "Alumno no encontrado"
}
```

---

## 📝 Notas importantes:

1. **Código de alumno:** Debe tener exactamente 14 dígitos
2. **Estados disponibles:** 
   - `activo` - Alumno en condiciones normales
   - `suspendido` - Alumno temporalmente suspendido
   - `inactivo` - Alumno inactivo
   - `retirado` - Alumno retirado del colegio
3. **Observación:** Campo obligatorio que describe el motivo del cambio de estado
4. **Historial:** Cada cambio de estado se registra con timestamp automático
5. **Relaciones:** Los endpoints incluyen información del turno y usuario asociado

## 🔧 Uso en Postman:

### Colección de ejemplo:
```json
{
  "info": {
    "name": "Estado Alumnos API",
    "description": "Endpoints para gestión de estados de alumnos"
  },
  "item": [
    {
      "name": "Obtener todos los estados",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/alumnos/estado"
      }
    },
    {
      "name": "Obtener estado por código",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/alumnos/estado/12076598200730"
      }
    },
    {
      "name": "Actualizar estado",
      "request": {
        "method": "PUT",
        "url": "{{baseUrl}}/alumnos/estado/12076598200730",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"estado\": \"activo\",\n  \"observacion\": \"Alumno reincorporado\"\n}"
        }
      }
    }
  ]
}
```
