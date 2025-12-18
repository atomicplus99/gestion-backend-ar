# Guía Completa de Despliegue - Windows Server

Sistema de Control de Asistencia -AR

---

## Requisitos del Servidor

| Componente | Mínimo              | Recomendado         |
| ---------- | ------------------- | ------------------- |
| SO         | Windows Server 2019 | Windows Server 2022 |
| CPU        | 2 cores             | 4 cores             |
| RAM        | 4 GB                | 8 GB                |
| Disco      | 40 GB SSD           | 100 GB SSD          |
| Red        | 100 Mbps            | 1 Gbps              |

**Puertos Necesarios:**

- 443 (HTTPS) - Aplicación
- 3306 (MySQL) - Solo localhost

---

## PASO 1: Instalar Docker Desktop

### Descargar

```
https://www.docker.com/products/docker-desktop/
```

### Instalación

1. Descargar versión para Windows
2. Ejecutar instalador como Administrador
3. Seguir asistente de instalación
4. Reiniciar el sistema cuando se solicite

### Verificar Instalación

```powershell
docker --version
docker compose version
```

Salida esperada:

```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## PASO 2: Instalar Git para Windows

### Descargar

```
https://git-scm.com/download/win
```

### Verificar

```powershell
git --version
```

---

## PASO 3: Instalar OpenSSL

### 3.1 Instalar Chocolatey (Gestor de Paquetes)

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 3.2 Cerrar y Abrir PowerShell como Administrador

### 3.3 Verificar Chocolatey

```powershell
choco --version
```

### 3.4 Instalar OpenSSL

```powershell
choco install openssl -y
```

### 3.5 Cerrar y Abrir PowerShell Nuevamente

### 3.6 Verificar OpenSSL

```powershell
openssl version
```

---

## PASO 4: Configurar Firewall de Windows

```powershell
# Solo permitir acceso desde red local
New-NetFirewallRule -DisplayName "Sistema Asistencia HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -RemoteAddress LocalSubnet
```

---

## PASO 5: Clonar Repositorio

```powershell
# Crear directorio Apps
New-Item -ItemType Directory -Path "C:\Apps" -Force
cd C:\Apps

# Clonar repositorio
git clone https://github.com/atomicplus99/gestion-backend-ar.git sistema-asistencia

# Entrar al proyecto
cd sistema-asistencia
```

---

## PASO 6: Generar Certificados SSL

```powershell
# Ejecutar como Administrador
.\generate-ssl.ps1
```

**Archivos Generados:**

- `ssl/certificate.pem` - Certificado público
- `ssl/private-key.pem` - Clave privada (sin contraseña)
- `ssl/colegio-certificado.cer` - Para distribuir a PCs cliente

**Nota Importante:**

El script detecta automáticamente la IP de tu **red física** (Wi-Fi o Ethernet), excluyendo adaptadores virtuales como WSL o Hyper-V. Verifica que muestre tu IP correcta (ej: `192.168.1.103`), NO una IP de Docker/WSL (ej: `172.23.0.1`).

---

## PASO 7: Configurar Variables de Entorno

### 7.1 Crear Archivo .env

```powershell
notepad .env
```

### 7.2 Configuración Completa

```env
# ===================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===================================
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=adminarias
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_NAME=gestion_academica_ar

# ===================================
# CONFIGURACIÓN JWT (Autenticación)
# ===================================
JWT_SECRET=TU_JWT_SECRET_32_CARACTERES_AQUI
JWT_EXPIRES_IN=24h
JWT_RESET_EXPIRES_IN=1h

# ===================================
# CONFIGURACIÓN DE EMAIL (Brevo/Sendinblue)
# ===================================
BREVO_API_KEY=tu_api_key_de_brevo_aqui
BREVO_FROM_EMAIL=noreply@tucolegio.edu
BREVO_FROM_NAME=Sistema de Asistencia

# ===================================
# CONFIGURACIÓN DE ADMINISTRADOR
# ===================================
ADMIN_DEFAULT_PASSWORD=TU_PASSWORD_ADMIN_SEGURO

# ===================================
# TELEGRAM BOT (Opcional)
# ===================================
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui

# ===================================
# ENCRIPTACIÓN
# ===================================
ENCRYPTION_KEY=TU_ENCRYPTION_KEY_32_CARACTERES

# ===================================
# CONFIGURACIÓN DEL SERVIDOR
# ===================================
NODE_ENV=production
HTTPS_ENABLED=true
HOST=0.0.0.0
PORT=443
PROTOCOL=https
BASE_URL=https://tu-ip-o-dominio
```

### 7.3 Generar Claves Seguras

```powershell
# Generar JWT_SECRET (32 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generar ENCRYPTION_KEY (32 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generar DB_PASSWORD (16 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
```

### 7.4 Descripción de Variables

**Base de Datos:**

- `DB_HOST`: Host de MySQL (usar `mysql` para Docker)
- `DB_PORT`: Puerto de MySQL (3306 por defecto)
- `DB_USERNAME`: Usuario de la base de datos
- `DB_PASSWORD`: Contraseña segura (mínimo 16 caracteres)
- `DB_NAME`: Nombre de la base de datos

**JWT (JSON Web Tokens):**

- `JWT_SECRET`: Clave secreta para firmar tokens (32+ caracteres)
- `JWT_EXPIRES_IN`: Duración del token de sesión (24h recomendado)
- `JWT_RESET_EXPIRES_IN`: Duración del token de recuperación (1h recomendado)

**Email (Brevo):**

- `BREVO_API_KEY`: API Key de Brevo (obtener en https://app.brevo.com)
- `BREVO_FROM_EMAIL`: Email remitente
- `BREVO_FROM_NAME`: Nombre del remitente

**Administrador:**

- `ADMIN_DEFAULT_PASSWORD`: Contraseña inicial del admin (cambiar después)

**Telegram:**

- `TELEGRAM_BOT_TOKEN`: Token del bot de Telegram (opcional)

**Encriptación:**

- `ENCRYPTION_KEY`: Clave de 32 caracteres para encriptar datos

**Servidor:**

- `NODE_ENV`: `production` en producción, `development` en desarrollo
- `HTTPS_ENABLED`: `true` para activar HTTPS
- `HOST`: `0.0.0.0` para escuchar en todas las interfaces
- `PORT`: `443` para HTTPS
- `PROTOCOL`: `https`
- `BASE_URL`: URL completa de tu servidor (ej: `https://192.168.1.100`)

---

## PASO 8: Desplegar Aplicación

```powershell
# Ejecutar script de despliegue
.\deploy-windows.ps1
```

**El script automáticamente:**

1. Verifica que existe el archivo `.env`
2. Detiene contenedores existentes
3. Construye la imagen Docker
4. Inicia el servicio MySQL
5. Espera a que MySQL esté listo
6. Ejecuta las migraciones de base de datos
7. Ejecuta los seeders (datos iniciales)
8. Inicia la aplicación
9. Muestra el estado de los contenedores

### Salida Esperada

```
Iniciando despliegue...
Esperando MySQL...
Despliegue completado
NAME              IMAGE                STATUS         PORTS
sistema_mysql     mariadb:10.4.32     Up 2 minutes   0.0.0.0:3306->3306/tcp
sistema_app       sistema_app         Up 1 minute    0.0.0.0:443->443/tcp
```

---

## PASO 9: Verificar Despliegue

### 9.1 Ver Estado de Contenedores

```powershell
docker compose ps
```

### 9.2 Ver Logs de la Aplicación

```powershell
docker compose logs -f app
```

### 9.3 Acceder a la Aplicación

Desde cualquier navegador en la red local:

```
https://IP_DEL_SERVIDOR:443
https://IP_DEL_SERVIDOR:443/api
```

### 9.4 Probar Conexión

```powershell
# Desde otra PC en la red
curl https://IP_SERVIDOR:443/api -k
```

---

## PASO 10: Desplegar Frontend Angular

### 10.1 Compilar Aplicaciones Angular

En tu PC de desarrollo, compila las aplicaciones Angular para producción:

```powershell
# Panel Administrador
cd ruta-al-proyecto-admin
ng build --configuration production

# App Scanner (si ya está lista)
cd ruta-al-proyecto-scanner
ng build --configuration production
```

Esto genera carpetas `dist/` con los archivos compilados.

> [!IMPORTANT] > **IMPORTANTE:** Compila con `--base-href` correcto:
>
> - Panel Admin: `ng build --configuration production --base-href /panel/`
> - App Scanner: `ng build --configuration production --base-href /scanner/`
>
> Esto asegura que Angular cargue correctamente sus recursos (JS, CSS) desde la ruta correcta.

### 10.2 Crear Estructura de Carpetas en el Servidor

```powershell
# En el servidor
cd C:\Apps\gestion-backend-ar

# Crear carpetas para frontend
mkdir frontend
mkdir frontend\admin
mkdir frontend\scanner
```

### 10.3 Copiar Archivos Compilados

**Copiar desde tu PC al servidor (elegir un método):**

**Método A - Via RDP:**

1. Conectar al servidor via Remote Desktop
2. Copiar contenido de `dist/nombre-proyecto/browser/*` a `C:\Apps\gestion-backend-ar\frontend\admin\`

**Método B - Via USB:**

1. Copiar carpeta `dist/` a USB
2. Insertar USB en servidor
3. Copiar a `C:\Apps\gestion-backend-ar\frontend\admin\`

**Método C - Via Red Compartida:**

```powershell
# Compartir carpeta en servidor primero, luego desde tu PC:
xcopy /s /e "dist\proyecto\browser\*" "\\IP_SERVIDOR\compartido\frontend\admin\"
```

### 10.4 Verificar Estructura

Debe quedar:

```
C:\Apps\gestion-backend-ar\
├── frontend/
│   ├── admin/
│   │   ├── index.html          ← IMPORTANTE
│   │   ├── main-[hash].js
│   │   ├── styles-[hash].css
│   │   └── assets/
│   └── scanner/
│       ├── index.html
│       └── ...
```

### 10.5 Configurar Angular para Producción

En tu proyecto Angular, actualizar `environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api', // Ruta relativa (mismo servidor)
  wsUrl: 'wss://192.168.1.103:443', // Tu IP del servidor
};
```

**IMPORTANTE**: Si cambias `environment.prod.ts`, debes recompilar con `ng build --configuration production`.

### 10.6 Redesplegar Backend

```powershell
# En el servidor
cd C:\Apps\gestion-backend-ar

# Pull de cambios (si modificaste app.module.ts)
git pull origin master

# Redesplegar
docker compose down
docker compose build
docker compose up -d
```

### 10.7 Acceder a las Aplicaciones

**Panel Administrador:**

```
https://192.168.1.103/panel
```

**App Scanner:**

```
https://192.168.1.103/scanner
```

**API (Swagger):**

```
https://192.168.1.103/api
```

---

## Mantenimiento y Actualizaciones

### Actualizar Solo el Backend

Cuando cambias código del backend (NestJS, TypeScript, etc.):

#### En tu PC de Desarrollo

```powershell
cd C:\Users\abela\OneDrive\Escritorio\Proyecto-Colegio-Registro-Asistencia\gestion-backend-ar

# Hacer cambios en el código
# Probar localmente

# Commit y push
git add .
git commit -m "Descripción de los cambios"
git push origin master
```

#### En el Servidor

```powershell
cd C:\Apps\gestion-backend-ar

# Ejecutar script de actualización
.\update-app.ps1
```

**El script automáticamente:**

1. Crea un backup de la base de datos
2. Hace `git pull` de los cambios
3. Detiene la aplicación (mantiene MySQL)
4. Reconstruye la imagen Docker
5. Ejecuta nuevas migraciones
6. Reinicia la aplicación
7. Muestra los logs

### Actualizar Solo el Frontend

Cuando cambias código del frontend Angular (componentes, servicios, etc.):

#### En tu PC de Desarrollo

```powershell
# 1. Modificar código Angular
# 2. Probar localmente con ng serve
# 3. Compilar para producción
cd ruta-proyecto-angular
ng build --configuration production

# 4. Copiar archivos al servidor
# Via RDP, USB o red compartida:
# De: dist/proyecto/browser/*
# A: C:\Apps\gestion-backend-ar\frontend\admin\
```

#### En el Servidor

```powershell
# Reiniciar solo la aplicación (sin rebuild)
cd C:\Apps\gestion-backend-ar
docker compose restart app
```

**NOTA:** No necesitas hacer `git pull` ni rebuild si solo cambias frontend, a menos que también hayas modificado `app.module.ts`.

### Actualizar Backend Y Frontend

Cuando cambias ambos:

#### En tu PC de Desarrollo

```powershell
# 1. Cambios en Backend
cd C:\Users\abela\OneDrive\Escritorio\Proyecto-Colegio-Registro-Asistencia\gestion-backend-ar
git add .
git commit -m "Cambios backend"
git push origin master

# 2. Cambios en Frontend
cd ruta-proyecto-angular
ng build --configuration production
# Copiar archivos compilados al servidor
```

#### En el Servidor

```powershell
cd C:\Apps\gestion-backend-ar

# Actualizar backend
.\update-app.ps1

# Frontend ya está copiado, solo reiniciar
docker compose restart app
```

### Actualizar Solo Configuración (.env)

Si solo cambias variables de entorno:

```powershell
# En el servidor
cd C:\Apps\gestion-backend-ar
notepad .env

# Hacer cambios necesarios
# Guardar y cerrar

# Aplicar cambios (NO necesita rebuild)
docker compose down
docker compose up -d
```

### Script de Actualización Rápida

Crear script para actualizar frontend rápidamente:

```powershell
# update-frontend.ps1
$ErrorActionPreference = "Stop"

Write-Host "🔄 Actualizando Frontend..." -ForegroundColor Cyan

# Verificar que existen los archivos
if (-not (Test-Path "frontend\admin\index.html")) {
    Write-Error "❌ No se encontró index.html en frontend\admin\"
    exit 1
}

# Reiniciar aplicación
Write-Host "🔄 Reiniciando aplicación..." -ForegroundColor Yellow
docker compose restart app

Write-Host "✅ Frontend actualizado correctamente" -ForegroundColor Green
docker compose ps
```

**Uso:**

```powershell
# Después de copiar archivos nuevos de Angular
.\update-frontend.ps1
```

---

## Backups

Para eliminar advertencias de seguridad en navegadores:

### Método 1: Instalación Manual en Cada PC

```powershell
# En cada PC del colegio, ejecutar como Administrador

# 1. Copiar certificado desde el servidor
Copy-Item "\\SERVIDOR\compartido\ssl\colegio-certificado.cer" -Destination "C:\Temp\"

# 2. Instalar certificado
Import-Certificate -FilePath "C:\Temp\colegio-certificado.cer" -CertStoreLocation Cert:\LocalMachine\Root

# 3. Reiniciar navegador
```

### Método 2: Via Group Policy (Active Directory)

1. Abrir Group Policy Management
2. Crear nueva GPO: "Certificado Sistema Asistencia"
3. Editar → Computer Configuration → Policies → Windows Settings
4. Security Settings → Public Key Policies → Trusted Root Certification Authorities
5. Import → Seleccionar `colegio-certificado.cer`
6. Aplicar GPO al dominio

---

## Actualizar la Aplicación

Cuando hagas cambios en el código:

### En tu PC de Desarrollo

```bash
# Hacer cambios en el código
# Probar localmente

# Commit y push
git add .
git commit -m "Descripción de los cambios"
git push origin master
```

### En el Servidor

```powershell
# Ejecutar script de actualización
.\update-app.ps1
```

**El script automáticamente:**

1. Crea un backup de la base de datos
2. Hace `git pull` de los cambios
3. Detiene la aplicación (mantiene MySQL)
4. Reconstruye la imagen Docker
5. Ejecuta nuevas migraciones
6. Reinicia la aplicación
7. Muestra los logs

---

## Backups

### Backup Manual

```powershell
.\backup.ps1
```

**Genera:**

- `backups/db-YYYYMMDD-HHMMSS.sql` - Base de datos
- `backups/profiles-YYYYMMDD-HHMMSS.zip` - Fotos de usuarios

### Configurar Backups Automáticos

```powershell
# PowerShell como Administrador

# Backup diario a las 2 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Apps\sistema-asistencia\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "Backup Sistema Asistencia" -Action $action -Trigger $trigger -User "SYSTEM"
```

### Restaurar desde Backup

```powershell
# Restaurar base de datos
docker compose exec -T mysql mysql -u root -p$DB_PASSWORD gestion_academica_ar < backups\db-20250117-020000.sql

# Restaurar fotos
Expand-Archive -Path "backups\profiles-20250117-020000.zip" -DestinationPath "public\profiles" -Force
```

---

## Migraciones de Base de Datos

### Generar Nueva Migración

```powershell
docker compose run --rm app npm run migration:generate
```

### Ejecutar Migraciones

```powershell
docker compose run --rm app npm run migration:run
```

### Revertir Última Migración

```powershell
docker compose run --rm app npm run migration:revert
```

### Ver Estado de Migraciones

```powershell
docker compose run --rm app npm run migration:show
```

---

## Comandos Útiles

```powershell
# Ver estado de contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs solo de la app
docker compose logs -f app

# Ver logs de MySQL
docker compose logs -f mysql

# Reiniciar solo la aplicación
docker compose restart app

# Reiniciar todo
docker compose restart

# Detener todo
docker compose down

# Iniciar todo
docker compose up -d

# Conectar a MySQL
docker compose exec mysql mysql -u root -p

# Ver uso de recursos
docker stats

# Limpiar Docker (imágenes no usadas)
docker system prune -a
```

---

## Solución de Problemas

### Problema: Contenedor no inicia

```powershell
# Ver logs de error
docker compose logs app

# Verificar que el puerto no esté en uso
netstat -ano | findstr :443

# Si está en uso, terminar el proceso
Stop-Process -Id PROCESS_ID -Force

# Reiniciar contenedor
docker compose restart app
```

### Problema: Error de conexión a MySQL

```powershell
# Verificar que MySQL esté corriendo
docker compose ps mysql

# Probar conexión manual
docker compose exec mysql mysql -u root -p

# Ver logs de MySQL
docker compose logs mysql

# Reiniciar MySQL
docker compose restart mysql
```

### Problema: Errores de permisos en archivos

```powershell
# Dar permisos completos a directorios
icacls "public" /grant "Everyone:(OI)(CI)F" /T
icacls "uploads" /grant "Everyone:(OI)(CI)F" /T
icacls "logs" /grant "Everyone:(OI)(CI)F" /T
```

### Problema: Certificado SSL inválido

```powershell
# Verificar archivos SSL
Test-Path "ssl\certificate.pem"
Test-Path "ssl\private-key.pem"

# Regenerar certificados si es necesario
.\generate-ssl.ps1

# Reiniciar aplicación
docker compose restart app
```

### Problema: Aplicación lenta

```powershell
# Ver uso de recursos
docker stats

# Ver logs para errores
docker compose logs -f app

# Revisar conexiones a MySQL
docker compose exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"
```

### Limpiar Docker Completamente

```powershell
# ADVERTENCIA: Esto eliminará TODOS los contenedores y volúmenes

# Detener todos los contenedores
docker compose down -v

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpiar todo el sistema
docker system prune -a --volumes
```

---

## Estructura del Proyecto

```
C:\Apps\sistema-asistencia\
├── ssl/                           (Certificados SSL - NO en Git)
│   ├── certificate.pem
│   ├── private-key.pem
│   └── colegio-certificado.cer
├── public/                        (Archivos estáticos)
│   └── profiles/
│       └── usuarios/              (Fotos de usuarios - NO en Git)
├── logs/                          (Logs de la aplicación - NO en Git)
├── backups/                        (Backups automáticos)
├── src/                           (Código fuente)
│   ├── entities/
│   ├── config/
│   └── database/
│       └── migrations/
├── docs/                          (Documentación)
│   └── DESPLIEGUE.md
├── .env                           (Variables de entorno - NO en Git)
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── generate-ssl.ps1
├── deploy-windows.ps1
├── update-app.ps1
└── backup.ps1
```

---

## Archivos que NO van a Git

Por seguridad y funcionalidad, estos archivos NO se suben al repositorio:

- `.env` - Contraseñas y secretos
- `ssl/` - Certificados SSL
- `public/profiles/usuarios/*` - Fotos de usuarios
- `logs/` - Logs de la aplicación
- `node_modules/` - Dependencias de Node.js
- `dist/` - Código compilado

---

## Archivos Persistentes

Estos archivos NO se pierden al actualizar la aplicación:

- Certificados SSL (`ssl/`)
- Fotos de usuarios (`public/profiles/usuarios/`)
- Configuración (`.env`)
- Logs (`logs/`)
- Base de datos (volumen de Docker)

---

## Checklist de Producción

Antes de considerar el sistema en producción:

- [ ] Docker Desktop instalado y funcionando
- [ ] Git instalado
- [ ] OpenSSL instalado
- [ ] Firewall configurado (puerto 443)
- [ ] Repositorio clonado
- [ ] Certificados SSL generados
- [ ] Archivo `.env` configurado con valores reales
- [ ] Contraseñas seguras (mínimo 16 caracteres)
- [ ] Aplicación desplegada (`deploy-windows.ps1`)
- [ ] Contenedores corriendo (`docker compose ps`)
- [ ] Aplicación accesible via HTTPS
- [ ] API Docs funcionando (`/api`)
- [ ] Certificado SSL distribuido a PCs cliente
- [ ] Backups automáticos configurados
- [ ] Logs sin errores críticos
- [ ] Usuarios pueden autenticarse

---

## Monitoreo

### Ver Estado del Sistema

```powershell
# Estado de contenedores
docker compose ps

# Uso de recursos
docker stats

# Espacio en disco
docker system df

# Logs recientes
docker compose logs --tail=100
```

### Métricas Importantes

- **CPU**: No debe superar 80% sostenido
- **RAM**: Mantener al menos 1GB libre
- **Disco**: Mantener al menos 10GB libres
- **Logs**: Revisar diariamente

---

## Contacto y Soporte

**Repositorio**: https://github.com/atomicplus99/gestion-backend-ar

**Para problemas:**

1. Revisar logs: `docker compose logs -f`
2. Ver estado: `docker compose ps`
3. Consultar esta documentación
4. Verificar GitHub Issues

---

**Última Actualización**: 2025-12-18  
**Versión**: 3.1  
**Autor**: Sistema de Control de Asistencia -AR
