# deploy-windows.ps1
# Script de despliegue para Windows Server
# Ejecutar como Administrador

Write-Host "=========================================="
Write-Host "DESPLIEGUE EN PRODUCCIÓN - WINDOWS SERVER" -ForegroundColor Cyan
Write-Host "=========================================="

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host "Por favor, crea el archivo .env primero con las variables de entorno" -ForegroundColor Yellow
    exit 1
}

# Verificar que Docker está corriendo
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Error: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Detener contenedores si existen
Write-Host "`n🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker compose down 2>$null

# Construir imagen
Write-Host "`n🔨 Construyendo imagen Docker..." -ForegroundColor Yellow
docker compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}

# Iniciar MySQL
Write-Host "`n🗄️ Iniciando MySQL..." -ForegroundColor Yellow
docker compose up -d mysql
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar MySQL" -ForegroundColor Red
    exit 1
}

# Esperar a que MySQL esté listo
Write-Host "`n⏳ Esperando a que MySQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

$maxRetries = 10
$retries = 0
$mysqlReady = $false

while ($retries -lt $maxRetries) {
    $result = docker compose exec mysql mysqladmin ping -h localhost --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL está listo" -ForegroundColor Green
        $mysqlReady = $true
        break
    }
    Write-Host "⏳ MySQL aún no está listo, esperando... (intento $($retries + 1)/$maxRetries)"
    Start-Sleep -Seconds 5
    $retries++
}

if (-not $mysqlReady) {
    Write-Host "❌ Error: MySQL no pudo iniciarse después de $maxRetries intentos" -ForegroundColor Red
    exit 1
}

# Ejecutar migraciones
Write-Host "`n🚀 Ejecutando migraciones..." -ForegroundColor Yellow
docker compose run --rm app npm run migration:run
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Advertencia: Hubo un problema con las migraciones" -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar de todos modos? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

# Ejecutar seeders
Write-Host "`n🌱 Ejecutando seeders..." -ForegroundColor Yellow
docker compose run --rm app npm run seed:run
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Advertencia: Hubo un problema con los seeders" -ForegroundColor Yellow
}

# Iniciar aplicación
Write-Host "`n🚀 Iniciando aplicación..." -ForegroundColor Yellow
docker compose up -d app
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar la aplicación" -ForegroundColor Red
    exit 1
}

# Esperar a que la app esté lista
Write-Host "`n⏳ Esperando a que la aplicación esté lista..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n=========================================="
Write-Host "✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "🌐 URL: https://localhost:443" -ForegroundColor Cyan
Write-Host "📊 API Docs: https://localhost:443/api" -ForegroundColor Cyan
Write-Host "🗄️ MySQL: localhost:3306" -ForegroundColor Cyan
Write-Host "=========================================="

# Mostrar estado
Write-Host "`n📋 Estado de contenedores:" -ForegroundColor Yellow
docker compose ps

Write-Host "`n💡 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   Ver logs:     docker compose logs -f"
Write-Host "   Reiniciar:    docker compose restart"
Write-Host "   Detener:      docker compose down"
Write-Host ""

$showLogs = Read-Host "¿Deseas ver los logs de la aplicación? (s/n)"
if ($showLogs -eq "s") {
    Write-Host "`n📋 Mostrando logs (Ctrl+C para salir):" -ForegroundColor Yellow
    docker compose logs -f
}
