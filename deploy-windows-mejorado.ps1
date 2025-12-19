$ErrorActionPreference = "Stop"

function Test-InternetConnection {
    try {
        $response = Test-Connection -ComputerName 8.8.8.8 -Count 1 -Quiet -ErrorAction Stop
        return $response
    }
    catch {
        return $false
    }
}

function Test-NpmRegistry {
    try {
        $response = Invoke-WebRequest -Uri "https://registry.npmjs.org/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  INICIANDO DESPLIEGUE SEGURO" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verificar archivo .env
if (-not (Test-Path ".env")) {
    Write-Error "❌ Archivo .env no encontrado"
    exit 1
}

# Verificar conectividad a Internet
Write-Host "🌐 Verificando conectividad a Internet..." -ForegroundColor Yellow
if (-not (Test-InternetConnection)) {
    Write-Error "❌ No hay conexión a Internet. El despliegue requiere conexión estable."
    exit 1
}

# Verificar acceso al registro de npm
Write-Host "📦 Verificando acceso al registro de npm..." -ForegroundColor Yellow
if (-not (Test-NpmRegistry)) {
    Write-Warning "⚠️  No se puede acceder al registro de npm. Esto puede causar problemas durante el build."
    $continuar = Read-Host "¿Desea continuar de todos modos? (s/N)"
    if ($continuar -ne "s" -and $continuar -ne "S") {
        Write-Host "❌ Despliegue cancelado por el usuario." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Conectividad verificada correctamente" -ForegroundColor Green
Write-Host ""

# Detener contenedores existentes
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker compose down

# Construir imagen
Write-Host "🔨 Construyendo imagen Docker..." -ForegroundColor Yellow
Write-Host "   (Esto puede tomar varios minutos...)" -ForegroundColor Gray

$buildStartTime = Get-Date

try {
    docker compose build 2>&1 | Tee-Object -Variable buildOutput
    
    if ($LASTEXITCODE -ne 0) {
        throw "El build de Docker falló"
    }
    
    $buildEndTime = Get-Date
    $buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds
    
    Write-Host ""
    Write-Host "✅ Build completado exitosamente en $([math]::Round($buildDuration, 1)) segundos" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Red
    Write-Host "  ❌ ERROR EN EL BUILD" -ForegroundColor Red
    Write-Host "=================================" -ForegroundColor Red
    Write-Host ""
    Write-Warning "El build de Docker falló. Posibles causas:"
    Write-Host "  • Se perdió la conexión a Internet durante la descarga" -ForegroundColor Yellow
    Write-Host "  • Archivos corruptos o incompletos en el cache de Docker" -ForegroundColor Yellow
    Write-Host "  • Problemas con el registro de npm" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SOLUCIÓN RECOMENDADA:" -ForegroundColor Cyan
    Write-Host "  1. Verificar que el Internet esté estable" -ForegroundColor White
    Write-Host "  2. Limpiar el cache de Docker:" -ForegroundColor White
    Write-Host "     docker system prune -a" -ForegroundColor Gray
    Write-Host "  3. Reintentar el despliegue:" -ForegroundColor White
    Write-Host "     .\deploy-windows.ps1" -ForegroundColor Gray
    Write-Host ""
    
    exit 1
}

# Iniciar MySQL
Write-Host ""
Write-Host "🐬 Iniciando servicio MySQL..." -ForegroundColor Yellow
docker compose up -d mysql

Write-Host "⏳ Esperando a que MySQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar que MySQL esté respondiendo
$retries = 0
$maxRetries = 10
while ($retries -lt $maxRetries) {
    $result = docker compose exec mysql mysqladmin ping -h localhost --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL está listo" -ForegroundColor Green
        break
    }
    Write-Host "   Intento $($retries + 1)/$maxRetries..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    $retries++
}

if ($retries -eq $maxRetries) {
    Write-Error "❌ MySQL no respondió después de $maxRetries intentos"
    exit 1
}

# Ejecutar migraciones
Write-Host ""
Write-Host "📊 Ejecutando migraciones de base de datos..." -ForegroundColor Yellow
docker compose run --rm app npm run migration:run:prod

if ($LASTEXITCODE -ne 0) {
    Write-Warning "⚠️  Las migraciones fallaron o no se completaron correctamente"
}

# Ejecutar seeders
Write-Host "🌱 Ejecutando seeders..." -ForegroundColor Yellow
docker compose run --rm app npm run seed:run

if ($LASTEXITCODE -ne 0) {
    Write-Warning "⚠️  Los seeders fallaron o no se completaron correctamente"
}

# Iniciar aplicación
Write-Host ""
Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Yellow
docker compose up -d app

# Esperar un poco para que la app inicie
Start-Sleep -Seconds 5

# Mostrar estado
Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "  ✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

docker compose ps

Write-Host ""
Write-Host "📝 Ver logs en tiempo real:" -ForegroundColor Cyan
Write-Host "   docker compose logs -f app" -ForegroundColor Gray
Write-Host ""
