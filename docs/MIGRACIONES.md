# Configuración de Migraciones TypeORM

Este documento describe la configuración y uso del sistema de migraciones de TypeORM en el proyecto.

---

## 📋 Tabla de Contenidos

- [Configuración](#configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Mejores Prácticas](#mejores-prácticas)
- [Solución de Problemas](#solución-de-problemas)

---

## ⚙️ Configuración

### Archivo de Configuración

La configuración principal está en [`src/config/data-source.config.ts`](file:///c:/Users/abela/OneDrive/Escritorio/Proyecto-Colegio-Registro-Asistencia/gestion-backend-ar/src/config/data-source.config.ts):

```typescript
export class DatabaseConfigFactory {
  static createOptions(): DataSourceOptions {
    return {
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: false, // ⚠️ Siempre false en producción
      logging: !isProduction,
      entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
    };
  }
}
```

### Ubicación de Archivos

```
src/
├── config/
│   └── data-source.config.ts    # Configuración del DataSource
├── entities/                     # Todas las entidades aquí
│   ├── alumno/
│   ├── apoderado/
│   └── ...
└── database/
    └── migrations/               # Migraciones generadas automáticamente
        └── *.ts
```

---

## 🚀 Scripts Disponibles

Los siguientes scripts están configurados en [`package.json`](file:///c:/Users/abela/OneDrive/Escritorio/Proyecto-Colegio-Registro-Asistencia/gestion-backend-ar/package.json):

### Generar una Migración

```bash
npm run migration:generate
```

- Crea automáticamente una migración en `src/database/migrations/`
- Nombre predeterminado: `Migration` + timestamp
- Compara las entidades con el estado actual de la BD

**Para nombre personalizado**:

```bash
npm run migration:generate -- src/database/migrations/NombrePersonalizado
```

### Ejecutar Migraciones

```bash
npm run migration:run
```

- Ejecuta todas las migraciones pendientes
- Crea la tabla `migrations` si no existe
- Registra las migraciones ejecutadas

### Revertir Última Migración

```bash
npm run migration:revert
```

- Ejecuta el método `down()` de la última migración
- Elimina el registro de la tabla `migrations`
- Se puede ejecutar múltiples veces para revertir múltiples migraciones

### Ver Estado de Migraciones

```bash
npm run migration:show
```

- Muestra migraciones ejecutadas
- Muestra migraciones pendientes
- Útil para verificar el estado antes de ejecutar

---

## 🔄 Flujo de Trabajo

### 1. Crear/Modificar Entidades

```typescript
@Entity('NOMBRE_TABLA')
export class MiEntidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  // Usar decoradores correctos para timestamps
  @CreateDateColumn({ type: 'datetime' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'datetime' })
  fecha_actualizacion: Date;
}
```

### 2. Generar Migración

```bash
npm run migration:generate
```

**Verificar**: Revisar el archivo generado en `src/database/migrations/`

### 3. Ejecutar Migración

```bash
npm run migration:run
```

### 4. Verificar Resultado

```bash
npm run migration:show
```

O verificar directamente en la BD usando Adminer (`localhost:8080`)

---

## ✅ Mejores Prácticas

### 1. **Nunca usar `synchronize: true` en producción**

```typescript
synchronize: false; // ✅ Correcto
synchronize: true; // ❌ Peligroso en producción
```

### 2. **Siempre revisar las migraciones generadas**

TypeORM puede generar código incorrecto o innecesario. Revisar antes de ejecutar.

### 3. **No combinar `@CreateDateColumn/@UpdateDateColumn` con `default`**

```typescript
// ❌ Incorrecto - causa errores en MySQL 8.0
@CreateDateColumn({
  type: 'datetime',
  default: () => 'CURRENT_TIMESTAMP'  // No necesario
})

// ✅ Correcto
@CreateDateColumn({
  type: 'datetime'
})
```

### 4. **Mantener migraciones lineales**

- No modificar migraciones ya ejecutadas
- Crear nuevas migraciones para cambios adicionales
- Mantener el historial limpio

### 5. **Usar transacciones**

Las migraciones de TypeORM usan transacciones automáticamente. Si una falla, se revierte todo.

### 6. **Nombres descriptivos**

```bash
# Bueno
npm run migration:generate -- src/database/migrations/AddEmailToUsuario

# Regular
npm run migration:generate -- src/database/migrations/Update1
```

---

## 🔧 Solución de Problemas

### Error: "No changes in database schema were found"

**Causa**: La BD ya está sincronizada con las entidades.

**Solución**:

- Verificar que hayas hecho cambios en las entidades
- Revisar que las rutas en `data-source.config.ts` sean correctas

### Error: "Table already exists"

**Causa**: Tablas creadas parcialmente de un intento anterior.

**Solución**:

```bash
# Opción 1: Limpiar la BD
DROP DATABASE gestion_academica_ar;
CREATE DATABASE gestion_academica_ar;

# Opción 2: Revertir migraciones
npm run migration:revert
```

### Error: "CURRENT_TIMESTAMP syntax error"

**Causa**: Uso incorrecto de decoradores de timestamp.

**Solución**: Remover configuraciones redundantes de `default` en `@CreateDateColumn` y `@UpdateDateColumn`.

### Error: "Cannot find migrations"

**Causa**: Rutas incorrectas en `data-source.config.ts`.

**Solución**: Verificar que las rutas usen paths relativos correctos:

```typescript
migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')];
```

---

## 🗄️ Estructura de Base de Datos

### Tabla de Control: `migrations`

TypeORM crea esta tabla automáticamente:

| Campo     | Tipo    | Descripción                     |
| --------- | ------- | ------------------------------- |
| id        | int     | ID auto-incremental             |
| timestamp | bigint  | Timestamp de la migración       |
| name      | varchar | Nombre de la clase de migración |

---

## 📝 Ejemplo Completo

### Escenario: Agregar campo `telefono` a la tabla ALUMNO

1. **Modificar entidad**:

```typescript
@Entity('ALUMNO')
export class Alumno {
  // ... campos existentes

  @Column({ type: 'varchar', length: 15, nullable: true })
  telefono?: string;
}
```

2. **Generar migración**:

```bash
npm run migration:generate -- src/database/migrations/AddTelefonoToAlumno
```

3. **Revisar archivo generado**: `src/database/migrations/XXXXXXXXX-AddTelefonoToAlumno.ts`

4. **Ejecutar migración**:

```bash
npm run migration:run
```

5. **Verificar**:

```bash
npm run migration:show
```

---

## 📚 Referencias

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- Configuración del proyecto: [`data-source.config.ts`](file:///c:/Users/abela/OneDrive/Escritorio/Proyecto-Colegio-Registro-Asistencia/gestion-backend-ar/src/config/data-source.config.ts)

---

## ⚠️ Notas Importantes

```diff
! NUNCA ejecutar DROP DATABASE en producción sin backup
! SIEMPRE revisar las migraciones antes de ejecutarlas
! MANTENER sincronizada la BD de desarrollo con producción
```
