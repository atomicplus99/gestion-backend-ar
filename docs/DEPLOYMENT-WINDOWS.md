# 🚀 Guía de Despliegue a Producción - Windows Server

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación de Dependencias](#instalación-de-dependencias)
- [Configuración del Servidor](#configuración-del-servidor)
- [Despliegue de la Aplicación](#despliegue-de-la-aplicación)
- [Configuración SSL/HTTPS](#configuración-sslhttps)
- [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
- [Backups](#backups)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ Requisitos Previos

### Especificaciones Mínimas del Servidor

| Componente | Mínimo              | Recomendado         |
| ---------- | ------------------- | ------------------- |
| **SO**     | Windows Server 2019 | Windows Server 2022 |
| **CPU**    | 2 cores             | 4 cores             |
| **RAM**    | 4 GB                | 8 GB                |
| **Disco**  | 40 GB SSD           | 100 GB SSD          |
| **Red**    | 100 Mbps            | 1 Gbps              |

### Puertos Necesarios

```
443   - HTTPS (aplicación)
3306  - MySQL (solo local)
```

---

## 📦 Instalación de Dependencias

### 1. Instalar Docker Desktop para Windows

1. **Descargar Docker Desktop**:

   - Ir a: https://www.docker.com/products/docker-desktop/
   - Descargar versión para Windows

2. **Instalar Docker**:

   ```powershell
   # Ejecutar el instalador como Administrador
   # Seguir el asistente de instalación
   # Reiniciar el sistema cuando se solicite
   ```

3. **Verificar instalación**:

   ```powershell
   docker --version
   docker compose version
   ```

   **Salida esperada**:

   ```
   Docker version 24.x.x
   Docker Compose version v2.x.x
   ```

> [!IMPORTANT]
> Docker Desktop requiere **WSL 2** (Windows Subsystem for Linux). El instalador lo configurará automáticamente.

### 2. Instalar Git para Windows

1. **Descargar Git**:

   - Ir a: https://git-scm.com/download/win
   - Descargar e instalar

2. **Verificar instalación**:
   ```powershell
   git --version
   ```

### 3. Configurar Firewall de Windows

```powershell
# Ejecutar PowerShell como Administrador

# Permitir puerto 443 (HTTPS)
New-NetFirewallRule -DisplayName "Colegio App HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# Opcional: Permitir puerto 3306 solo para localhost (desarrollo)
New-NetFirewallRule -DisplayName "MySQL Local" -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow -RemoteAddress LocalSubnet
```

---

## ⚙️ Configuración del Servidor

### 1. Crear Usuario para la Aplicación (Opcional pero recomendado)

```powershell
# Crear usuario de servicio
New-LocalUser -Name "ColegioApp" -Description "Usuario para aplicación de asistencia" -NoPassword
```

### 2. Crear Directorio para la Aplicación

```powershell
# Crear directorio
New-Item -ItemType Directory -Path "C:\Apps\colegio-asistencia"

# Navegar al directorio
cd C:\Apps\colegio-asistencia
```

### 3. Clonar el Repositorio

```powershell
# Clonar desde tu repositorio Git
git clone https://github.com/TU_USUARIO/gestion-backend-ar.git
cd gestion-backend-ar

# O si usas SSH
git clone git@github.com:TU_USUARIO/gestion-backend-ar.git
cd gestion-backend-ar
```

> [!TIP]
> Si no tienes repositorio Git, puedes copiar los archivos manualmente usando WinSCP, FTP, o compartiendo carpetas de red.

---

## 🔧 Despliegue de la Aplicación

### PASO 1: Configurar Variables de Entorno

1. **Crear archivo `.env`**:

```powershell
# Crear archivo .env en el directorio raíz del proyecto
New-Item -ItemType File -Path ".env"
notepad .env
```

2. **Contenido del archivo `.env`**:

```env
# Base de Datos
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=adminarias
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_NAME=gestion_academica_ar

# JWT
JWT_SECRET=TU_JWT_SECRET_SUPER_SEGURO_AQUI
JWT_EXPIRES_IN=24h
JWT_RESET_EXPIRES_IN=1h

# Email (Brevo/Sendinblue)
BREVO_API_KEY=tu_api_key_aqui
BREVO_FROM_EMAIL=noreply@tucolegio.edu
BREVO_FROM_NAME=Sistema de Asistencia

# Admin
ADMIN_DEFAULT_PASSWORD=TU_PASSWORD_ADMIN_SEGURO

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui

# Encriptación
ENCRYPTION_KEY=TU_ENCRYPTION_KEY_32_CARACTERES

# Servidor
NODE_ENV=production
HTTPS_ENABLED=true
HOST=0.0.0.0
PORT=443
PROTOCOL=https
BASE_URL=https://tu-dominio.com
```

> [!CAUTION] > **IMPORTANTE**: Cambiar TODOS los valores de `TU_*` por valores seguros. Usar contraseñas fuertes (mínimo 16 caracteres).

3. **Generar claves seguras**:

```powershell
# Generar JWT_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generar ENCRYPTION_KEY (32 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### PASO 2: Configurar Certificados SSL para Red Local

> [!NOTE] > **Para Red Local del Colegio**: Usaremos certificado autofirmado. Es seguro, gratis y funcional para redes internas.

#### Generar Certificado Autofirmado

**1. Crear directorio SSL:**

```powershell
# Crear directorio SSL
New-Item -ItemType Directory -Path "ssl" -Force
```

**2. Obtener IP del servidor:**

```powershell
# Obtener IP de la red local
$serverIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"}).IPAddress
Write-Host "📍 IP del servidor: $serverIP"
```

**3. Generar certificado con la IP del servidor:**

```powershell
# Generar certificado autofirmado
$certParams = @{
    DnsName = @(
        "asistencia.colegio.local",
        "localhost",
        $serverIP  # IP del servidor
    )
    CertStoreLocation = "cert:\LocalMachine\My"
    FriendlyName = "Sistema Asistencia - Colegio"
    NotAfter = (Get-Date).AddYears(5)
    KeyExportPolicy = "Exportable"
    KeySpec = "KeyExchange"
}
$cert = New-SelfSignedCertificate @certParams

Write-Host "✅ Certificado generado exitosamente" -ForegroundColor Green
Write-Host "📍 Huella digital: $($cert.Thumbprint)"
```

**4. Exportar certificado en formato PFX:**

```powershell
# Exportar certificado
$certPassword = "ColegioSistema2025!"  # Cambiar por una contraseña segura
$pwd = ConvertTo-SecureString -String $certPassword -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "ssl\certificate.pfx" -Password $pwd

Write-Host "✅ Certificado exportado a ssl\certificate.pfx" -ForegroundColor Green
```

**5. Convertir a formato PEM (para NestJS):**

Tienes dos opciones:

**Opción A: Usar OpenSSL (Recomendado)**

```powershell
# Instalar OpenSSL con Chocolatey (si no lo tienes)
# Ejecutar PowerShell como Administrador:
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar OpenSSL
choco install openssl -y

# Convertir a PEM
openssl pkcs12 -in ssl/certificate.pfx -out ssl/certificate.pem -nodes -passin pass:ColegioSistema2025!
openssl pkcs12 -in ssl/certificate.pfx -out ssl/private-key.pem -nocerts -nodes -passin pass:ColegioSistema2025!

Write-Host "✅ Certificados PEM generados" -ForegroundColor Green
```

**Opción B: Usar PowerShell puro (Sin OpenSSL)**

```powershell
# Extraer certificado público
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`n"
$certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem += "`n-----END CERTIFICATE-----"
$certPem | Out-File -FilePath "ssl\certificate.pem" -Encoding ASCII

# Nota: La clave privada en formato PEM requiere OpenSSL o usar el .pfx directamente
Write-Host "⚠️ Para la clave privada, usa OpenSSL o configura NestJS para usar .pfx" -ForegroundColor Yellow
```

**6. Exportar certificado para distribuir a PCs cliente:**

```powershell
# Exportar solo el certificado público (sin clave privada)
$certPublic = "ssl\colegio-certificado.cer"
Export-Certificate -Cert $cert -FilePath $certPublic

Write-Host "✅ Certificado público exportado: $certPublic" -ForegroundColor Green
Write-Host "📋 Distribuye este archivo a todas las PCs del colegio" -ForegroundColor Cyan
```

---

#### Instalar Certificado en PCs Cliente (Eliminar Advertencias)

Para que los usuarios no vean advertencias de seguridad:

**Opción 1: Instalación Manual en cada PC**

```powershell
# En cada PC del colegio, ejecutar como Administrador:

# 1. Copiar el archivo desde el servidor
Copy-Item "\\SERVIDOR\compartido\ssl\colegio-certificado.cer" -Destination "C:\Temp\"

# 2. Instalar el certificado
Import-Certificate -FilePath "C:\Temp\colegio-certificado.cer" -CertStoreLocation Cert:\LocalMachine\Root

Write-Host "✅ Certificado instalado. Reinicia el navegador." -ForegroundColor Green
```

**Opción 2: Instalación por GPO (Group Policy) - Windows Server con Active Directory**

```powershell
# En el Servidor de Dominio:

# 1. Copiar el certificado a una ubicación accesible
$certShare = "\\SERVIDOR\NETLOGON\colegio-certificado.cer"
Copy-Item "ssl\colegio-certificado.cer" -Destination $certShare

# 2. Crear GPO para distribución automática
# - Abrir Group Policy Management
# - Crear nueva GPO: "Certificado Sistema Asistencia"
# - Editar → Computer Configuration → Policies → Windows Settings → Security Settings
# - Public Key Policies → Trusted Root Certification Authorities
# - Import → Seleccionar colegio-certificado.cer
```

**Opción 3: Script de distribución masiva**

Crear `instalar-certificado.ps1` y ejecutarlo en cada PC:

```powershell
# instalar-certificado.ps1
param(
    [string]$ServidorIP = "192.168.1.100"
)

Write-Host "🔒 Instalando certificado del Sistema de Asistencia..."

try {
    # Descargar certificado desde el servidor
    $certUrl = "https://$ServidorIP/ssl/colegio-certificado.cer"
    $certLocal = "$env:TEMP\colegio-certificado.cer"

    # Opción alternativa: usar carpeta compartida
    # Copy-Item "\\$ServidorIP\compartido\colegio-certificado.cer" -Destination $certLocal

    # Instalar en el almacén de certificados raíz confiables
    Import-Certificate -FilePath $certLocal -CertStoreLocation Cert:\LocalMachine\Root

    Write-Host "✅ Certificado instalado correctamente" -ForegroundColor Green
    Write-Host "🔄 Por favor, reinicia tu navegador" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error al instalar certificado: $_" -ForegroundColor Red
}
```

---

#### Verificar Instalación del Certificado

**En el servidor:**

```powershell
# Verificar que los archivos existen
Test-Path "ssl\certificate.pem"
Test-Path "ssl\private-key.pem"
# O si usas .pfx:
Test-Path "ssl\certificate.pfx"

# Ver contenido del certificado
openssl x509 -in ssl/certificate.pem -text -noout
```

**En las PCs cliente:**

```powershell
# Verificar que el certificado está instalado
Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*Colegio*"}

# Salida esperada:
#   Thumbprint                                Subject
#   ----------                                -------
#   ABC123...                                 CN=asistencia.colegio.local
```

**En el navegador (después de instalar):**

1. Ir a: `https://IP_DEL_SERVIDOR:443`
2. ✅ Debería cargar sin advertencias
3. Click en el candado 🔒 → Ver certificado
4. Debe mostrar "Sistema Asistencia - Colegio"

---

#### Alternativa: Let's Encrypt para Acceso Externo (Solo si es necesario)

```powershell
# Instalar Certbot para Windows
# Descargar desde: https://certbot.eff.org/instructions?ws=other&os=windows

# Ejecutar certbot
certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Copiar certificados
Copy-Item "C:\Certbot\live\tu-dominio.com\fullchain.pem" -Destination "ssl\certificate.pem"
Copy-Item "C:\Certbot\live\tu-dominio.com\privkey.pem" -Destination "ssl\private-key.pem"
```

> [!NOTE]
> Para Let's Encrypt, necesitas que tu dominio esté apuntando al servidor y que el puerto 80 esté abierto durante la verificación.

### PASO 3: Crear Directorios Necesarios

```powershell
# Crear directorios para datos persistentes
New-Item -ItemType Directory -Path "public\profiles\usuarios" -Force
New-Item -ItemType Directory -Path "uploads" -Force
New-Item -ItemType Directory -Path "logs" -Force
New-Item -ItemType Directory -Path "backups" -Force

# Dar permisos (si es necesario)
icacls "public" /grant "Everyone:(OI)(CI)F" /T
icacls "uploads" /grant "Everyone:(OI)(CI)F" /T
icacls "logs" /grant "Everyone:(OI)(CI)F" /T
```

### PASO 4: Construir y Ejecutar con Docker

#### Script Automático (Recomendado)

**Crear archivo `deploy-windows.ps1`**:

```powershell
# Contenido de deploy-windows.ps1
Write-Host "=========================================="
Write-Host "DESPLIEGUE EN PRODUCCIÓN - WINDOWS SERVER"
Write-Host "=========================================="

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

# Detener contenedores si existen
Write-Host "🛑 Deteniendo contenedores existentes..."
docker compose down

# Construir imagen
Write-Host "🔨 Construyendo imagen Docker..."
docker compose build --no-cache

# Iniciar MySQL
Write-Host "🗄️ Iniciando MySQL..."
docker compose up -d mysql

# Esperar a que MySQL esté listo
Write-Host "⏳ Esperando a que MySQL esté listo..."
Start-Sleep -Seconds 30

$maxRetries = 10
$retries = 0
while ($retries -lt $maxRetries) {
    $result = docker compose exec mysql mysqladmin ping -h localhost --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL está listo" -ForegroundColor Green
        break
    }
    Write-Host "⏳ MySQL aún no está listo, esperando..."
    Start-Sleep -Seconds 5
    $retries++
}

# Ejecutar migraciones
Write-Host "🚀 Ejecutando migraciones..."
docker compose run --rm app npm run migration:run

# Ejecutar seeders
Write-Host "🌱 Ejecutando seeders..."
docker compose run --rm app npm run seed:run

# Iniciar aplicación
Write-Host "🚀 Iniciando aplicación..."
docker compose up -d app

Write-Host "=========================================="
Write-Host "✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "🌐 URL: https://localhost:443"
Write-Host "📊 API Docs: https://localhost:443/api"
Write-Host "🗄️ MySQL: localhost:3306"
Write-Host "=========================================="

# Mostrar estado
docker compose ps

# Mostrar logs
Write-Host "`n📋 Logs de la aplicación:"
docker compose logs -f
```

**Ejecutar el script**:

```powershell
# Dar permisos de ejecución
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ejecutar
.\deploy-windows.ps1
```

#### Comandos Manuales (Alternativa)

```powershell
# 1. Detener contenedores existentes
docker compose down

# 2. Construir imagen
docker compose build --no-cache

# 3. Iniciar MySQL
docker compose up -d mysql

# 4. Esperar 30 segundos
Start-Sleep -Seconds 30

# 5. Ejecutar migraciones
docker compose run --rm app npm run migration:run

# 6. Ejecutar seeders
docker compose run --rm app npm run seed:run

# 7. Iniciar aplicación
docker compose up -d app

# 8. Ver logs
docker compose logs -f
```

### PASO 5: Verificar Despliegue

```powershell
# Ver estado de contenedores
docker compose ps

# Deberías ver algo como:
# NAME           IMAGE              STATUS         PORTS
# colegio_mysql  mariadb:10.4.32    Up 2 minutes   0.0.0.0:3306->3306/tcp
# colegio_app    colegio_app        Up 1 minute    0.0.0.0:443->443/tcp

# Ver logs
docker compose logs app

# Probar la aplicación
Start-Process "https://localhost:443/api"
```

---

## 🔒 Configuración SSL/HTTPS

### Verificar Certificados SSL

```powershell
# Verificar que existen los archivos
Test-Path "ssl\certificate.pem"
Test-Path "ssl\private-key.pem"

# Salida esperada: True True
```

### Renovar Certificados (Let's Encrypt)

```powershell
# Crear tarea programada para renovación automática
$action = New-ScheduledTaskAction -Execute "certbot" -Argument "renew --quiet"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -TaskName "Renovar SSL Colegio" -Action $action -Trigger $trigger -User "SYSTEM"
```

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs en Tiempo Real

```powershell
# Logs de la aplicación
docker compose logs -f app

# Logs de MySQL
docker compose logs -f mysql

# Logs de ambos
docker compose logs -f
```

### Ver Recursos del Sistema

```powershell
# Ver uso de CPU/RAM de contenedores
docker stats

# Ver espacio en disco
docker system df

# Ver imágenes
docker images
```

### Reiniciar Servicios

```powershell
# Reiniciar solo la aplicación
docker compose restart app

# Reiniciar todo
docker compose restart

# Detener todo
docker compose down

# Iniciar todo
docker compose up -d
```

### Actualizar la Aplicación

```powershell
# Script de actualización: update-app.ps1
Write-Host "🔄 Actualizando aplicación..."

# Pull cambios de Git
git pull origin main

# Detener aplicación (mantener BD)
docker compose stop app

# Rebuild imagen
docker compose build app --no-cache

# Ejecutar migraciones nuevas
docker compose run --rm app npm run migration:run

# Reiniciar aplicación
docker compose up -d app

Write-Host "✅ Actualización completada"
docker compose logs -f app
```

---

## 💾 Backups

### Script de Backup Automático

**Crear `backup.ps1`**:

```powershell
# backup.ps1
$backupDir = "C:\Apps\colegio-asistencia\backups"
$date = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "📦 Creando backup $date..."

# Backup de base de datos
Write-Host "🗄️ Backup de MySQL..."
docker compose exec -T mysql mysqldump -u root -p${env:DB_PASSWORD} gestion_academica_ar > "$backupDir\db-$date.sql"

# Backup de archivos
Write-Host "📁 Backup de archivos..."
Compress-Archive -Path "public\profiles" -DestinationPath "$backupDir\profiles-$date.zip"
Compress-Archive -Path "uploads" -DestinationPath "$backupDir\uploads-$date.zip"

# Limpiar backups antiguos (mantener últimos 7 días)
Get-ChildItem $backupDir -File | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item

Write-Host "✅ Backup completado: $date"
```

### Programar Backups Automáticos

```powershell
# Crear tarea programada para backup diario a las 2 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Apps\colegio-asistencia\gestion-backend-ar\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "Backup Colegio App" -Action $action -Trigger $trigger -User "SYSTEM"
```

### Restaurar desde Backup

```powershell
# Restaurar base de datos
docker compose exec -T mysql mysql -u root -p${env:DB_PASSWORD} gestion_academica_ar < backups\db-20250117-020000.sql

# Restaurar archivos
Expand-Archive -Path "backups\profiles-20250117-020000.zip" -DestinationPath "public\profiles" -Force
Expand-Archive -Path "backups\uploads-20250117-020000.zip" -DestinationPath "uploads" -Force
```

---

## 🔧 Troubleshooting

### Problema: Contenedor no inicia

```powershell
# Ver logs de error
docker compose logs app

# Verificar que el puerto no esté en uso
netstat -ano | findstr :443

# Si está en uso, terminar el proceso
Stop-Process -Id PROCESS_ID -Force
```

### Problema: Error de conexión a MySQL

```powershell
# Verificar que MySQL esté corriendo
docker compose ps mysql

# Probar conexión manual
docker compose exec mysql mysql -u root -p${env:DB_PASSWORD}

# Reiniciar MySQL
docker compose restart mysql
```

### Problema: Errores de permisos

```powershell
# Dar permisos completos a directorios
icacls "public" /grant "Everyone:(OI)(CI)F" /T
icacls "uploads" /grant "Everyone:(OI)(CI)F" /T
icacls "logs" /grant "Everyone:(OI)(CI)F" /T
```

### Problema: Certificado SSL inválido

```powershell
# Verificar archivos SSL
Get-Content ssl\certificate.pem | Select-String "BEGIN CERTIFICATE"
Get-Content ssl\private-key.pem | Select-String "BEGIN PRIVATE KEY"

# Regenerar certificados si es necesario
# (Ver sección Configuración SSL)
```

### Limpiar Docker completamente

```powershell
# ⚠️ ADVERTENCIA: Esto eliminará TODOS los contenedores, imágenes y volúmenes

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

## 🎯 Checklist de Producción

Antes de lanzar a producción, verifica:

- [ ] Variables de entorno configuradas en `.env`
- [ ] Contraseñas seguras (mínimo 16 caracteres)
- [ ] Certificados SSL instalados y válidos
- [ ] Firewall configurado (puerto 443 abierto)
- [ ] Backups automáticos programados
- [ ] Dominio apuntando al servidor
- [ ] Docker containers corriendo (`docker compose ps`)
- [ ] Logs sin errores (`docker compose logs`)
- [ ] Aplicación accesible vía HTTPS
- [ ] API Docs funcionando (`/api`)
- [ ] Base de datos con seeders ejecutados
- [ ] Monitoreo configurado

---

## 📞 Comandos Útiles de Referencia Rápida

```powershell
# Iniciar aplicación
docker compose up -d

# Detener aplicación
docker compose down

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Actualizar código
git pull && docker compose build && docker compose up -d

# Backup manual
.\backup.ps1

# Ver estado
docker compose ps

# Conectar a MySQL
docker compose exec mysql mysql -u root -p

# Ejecutar migraciones
docker compose run --rm app npm run migration:run

# Ver uso de recursos
docker stats
```

---

## 🌐 Configuración de Dominio

### Configurar DNS

En tu proveedor de DNS (ej: Cloudflare, GoDaddy):

```
Tipo: A
Nombre: @
Valor: IP_DEL_SERVIDOR
TTL: Automático

Tipo: A
Nombre: www
Valor: IP_DEL_SERVIDOR
TTL: Automático
```

### Configurar Reverse Proxy (Opcional)

Si quieres usar Nginx o IIS como reverse proxy:

```powershell
# Instalar IIS (si no está instalado)
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# Configurar como reverse proxy para Docker
# (Requiere Application Request Routing module)
```

---

## 📚 Referencias y Recursos

- [Docker Desktop para Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Certbot Windows](https://certbot.eff.org/instructions?ws=other&os=windows)
- [NestJS Documentation](https://docs.nestjs.com/)
- [MariaDB Documentation](https://mariadb.com/kb/en/)

---

## 💡 Recomendaciones Finales

1. **Backups**: Configurar backups automáticos diarios
2. **Monitoreo**: Instalar herramienta de monitoreo (ej: Uptime Kuma, Grafana)
3. **Logs**: Revisar logs periódicamente
4. **Actualizaciones**: Mantener Docker y dependencias actualizadas
5. **Seguridad**: Cambiar contraseñas periódicamente
6. **Documentación**: Mantener este documento actualizado con cambios específicos

---

**Última actualización**: 2025-12-17  
**Versión**: 1.0  
**Autor**: Sistema de Asistencia Colegio
