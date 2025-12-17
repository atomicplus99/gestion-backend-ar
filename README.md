# Guía de Despliegue - Sistema de Control de Asistencia

## PASO 1: Instalar Docker Desktop

```
https://www.docker.com/products/docker-desktop/
```

1. Descargar e instalar
2. Reiniciar sistema

Verificar:

```powershell
docker --version
```

## PASO 2: Instalar Git

```
https://git-scm.com/download/win
```

## PASO 3: Instalar OpenSSL

Instalar Chocolatey:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Cerrar y abrir PowerShell, luego:

```powershell
choco install openssl -y
```

Cerrar y abrir PowerShell nuevamente.

## PASO 4: Clonar Repositorio

```powershell
cd C:\Apps
git clone https://github.com/atomicplus99/gestion-backend-ar.git sistema-asistencia
cd sistema-asistencia
```

## PASO 5: Generar Certificados SSL

```powershell
.\generate-ssl.ps1
```

## PASO 6: Configurar Variables de Entorno

Crear `.env`:

```powershell
notepad .env
```

Contenido:

```env
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=adminarias
DB_PASSWORD=TU_PASSWORD_SEGURO
DB_NAME=gestion_academica_ar

JWT_SECRET=TU_JWT_SECRET_32_CHARS
JWT_EXPIRES_IN=24h
JWT_RESET_EXPIRES_IN=1h

BREVO_API_KEY=tu_api_key
BREVO_FROM_EMAIL=noreply@colegio.edu
BREVO_FROM_NAME=Sistema Asistencia

ADMIN_DEFAULT_PASSWORD=TU_PASSWORD_ADMIN
TELEGRAM_BOT_TOKEN=tu_token
ENCRYPTION_KEY=TU_KEY_32_CHARS

NODE_ENV=production
HTTPS_ENABLED=true
HOST=0.0.0.0
PORT=443
PROTOCOL=https
BASE_URL=https://tu-ip
```

## PASO 7: Desplegar

```powershell
.\deploy-windows.ps1
```

## PASO 8: Acceder

```
https://IP_SERVIDOR:443
https://IP_SERVIDOR:443/api
```

---

## Actualizar Aplicación

En el servidor:

```powershell
.\update-app.ps1
```

---

## Comandos Útiles

```powershell
docker compose ps              # Ver estado
docker compose logs -f         # Ver logs
docker compose restart app     # Reiniciar
.\backup.ps1                   # Backup manual
```

---

## Migraciones

```powershell
docker compose run --rm app npm run migration:generate
docker compose run --rm app npm run migration:run
docker compose run --rm app npm run migration:revert
```

---

## Firewall (Opcional)

```powershell
New-NetFirewallRule -DisplayName "Asistencia HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -RemoteAddress LocalSubnet
```

---

## Backup Automático

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Apps\sistema-asistencia\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "Backup Asistencia" -Action $action -Trigger $trigger -User "SYSTEM"
```

---

**Repositorio**: https://github.com/atomicplus99/gestion-backend-ar
