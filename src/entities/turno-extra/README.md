# 🕐 API de Turnos Extra

## 📋 Descripción
Sistema para gestionar turnos extra de alumnos fuera de sus horarios regulares. Permite programar citas especiales, recuperaciones de clases, evaluaciones, etc.

## 🏗️ Estructura de la Entidad

### **TurnoExtra**
- **`id`** - UUID único del turno extra
- **`alumno`** - Relación con el alumno (ManyToOne)
- **`fecha_turno`** - Fecha del turno extra
- **`fecha_limite`** - Fecha límite de validez
- **`hora_entrada`** - Hora de entrada programada
- **`hora_salida`** - Hora de salida programada
- **`hora_limite`** - Hora límite para estar presente
- **`estado`** - Estado del turno (ACTIVO/EXPIRADO)
- **`observaciones`** - Motivo/observaciones del turno
- **`usuario`** - Usuario que programó el turno
- **`fecha_creacion`** - Timestamp de creación
- **`fecha_actualizacion`** - Timestamp de última actualización

## 🚀 Endpoints Disponibles

### **1. Crear Turno Extra**
```http
POST /turnos-extra
```

**Body:**
```json
{
  "alumno_id": "uuid-del-alumno",
  "fecha_turno": "2024-12-20",
  "fecha_limite": "2024-12-25",
  "hora_entrada": "14:00:00",
  "hora_salida": "16:00:00",
  "hora_limite": "14:15:00",
  "observaciones": "Turno extra para recuperar clases perdidas",
  "usuario_id": "uuid-del-usuario"
}
```

**Validaciones:**
- ✅ Alumno debe existir
- ✅ Usuario debe existir
- ✅ Observaciones son obligatorias
- ✅ Horarios no pueden chocar con turnos regulares del alumno

### **2. Obtener Todos los Turnos Extra**
```http
GET /turnos-extra
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Turnos extra obtenidos exitosamente",
  "data": [...],
  "timestamp": "2024-12-19T10:00:00.000Z"
}
```

### **3. Obtener Turnos Extra de un Alumno**
```http
GET /turnos-extra/alumno/{alumno_id}
```

### **4. Obtener Turno Extra por ID**
```http
GET /turnos-extra/{id}
```

### **5. Actualizar Turno Extra**
```http
PATCH /turnos-extra/{id}
```

**Body (campos opcionales):**
```json
{
  "fecha_turno": "2024-12-21",
  "hora_entrada": "15:00:00",
  "hora_salida": "17:00:00",
  "estado": "EXPIRADO"
}
```

**Validaciones:**
- ✅ Si se actualizan horas, no pueden chocar con turnos regulares
- ✅ Solo se pueden actualizar fecha, horas y estado

### **6. Eliminar Turno Extra**
```http
DELETE /turnos-extra/{id}
```

**Validaciones:**
- ✅ Solo se pueden eliminar turnos con estado EXPIRADO

## 🔒 Validaciones de Seguridad

### **Horarios No Chocantes**
- El sistema verifica que los horarios del turno extra no se solapen con el turno regular del alumno
- Se calcula automáticamente basándose en la relación `Alumno -> Turno`
- Si hay conflicto, se lanza error descriptivo

### **Estados Permitidos**
- **ACTIVO**: Turno extra vigente
- **EXPIRADO**: Turno extra que pasó su fecha límite

## ⏰ Scheduler Automático

### **Marcado de Turnos Expirados**
- **Frecuencia**: Diariamente a las 00:00
- **Función**: Marca automáticamente turnos extra como EXPIRADO cuando pasan su fecha límite
- **Logs**: Registra cuántos turnos fueron marcados como expirados

## 📊 Respuestas de Error

### **400 - Bad Request**
```json
{
  "statusCode": 400,
  "message": "El turno extra no puede chocar con el turno regular del alumno (MAÑANA). Horario del turno: 08:00 - 12:00. Horario del turno extra: 10:00 - 11:00",
  "error": "Bad Request"
}
```

### **404 - Not Found**
```json
{
  "statusCode": 404,
  "message": "Alumno con ID abc123 no encontrado",
  "error": "Not Found"
}
```

## 🌱 Seeder Automático

El sistema incluye un seeder que crea:
- 2 turnos extra de ejemplo
- Con fechas futuras para pruebas
- Datos realistas para desarrollo

## 🔧 Configuración

### **Módulo Principal**
```typescript
import { TurnoExtraModule } from './entities/turno-extra/turno-extra.module';

@Module({
  imports: [
    // ... otros módulos
    TurnoExtraModule
  ]
})
```

### **Dependencias**
- TypeORM para persistencia
- Schedule para tareas automáticas
- Swagger para documentación API

## 📝 Ejemplos de Uso

### **Crear Turno para Recuperación**
```typescript
const turnoExtra = await turnoExtraService.create({
  alumno_id: "uuid-alumno",
  fecha_turno: new Date('2024-12-20'),
  fecha_limite: new Date('2024-12-25'),
  hora_entrada: "14:00:00",
  hora_salida: "16:00:00",
  hora_limite: "14:15:00",
  observaciones: "Recuperar clases de matemáticas perdidas",
  usuario_id: "uuid-usuario"
});
```

### **Verificar Turnos de un Alumno**
```typescript
const turnosExtra = await turnoExtraService.findByAlumno("uuid-alumno");
console.log(`Alumno tiene ${turnosExtra.length} turnos extra activos`);
```

## 🚨 Consideraciones Importantes

1. **Horarios**: Los turnos extra deben ser fuera del horario regular del alumno
2. **Fechas**: La fecha límite determina cuándo se marca como expirado
3. **Eliminación**: Solo se pueden eliminar turnos expirados
4. **Validaciones**: Se ejecutan en creación y actualización
5. **Scheduler**: Se ejecuta automáticamente cada día

## 🔄 Flujo de Trabajo

1. **Creación**: Usuario programa turno extra con validaciones
2. **Vigencia**: Turno permanece activo hasta fecha límite
3. **Expiración**: Scheduler marca como expirado automáticamente
4. **Limpieza**: Usuario puede eliminar turnos expirados
5. **Auditoría**: Se mantiene registro de creación y modificaciones
