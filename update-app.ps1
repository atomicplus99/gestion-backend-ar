# update-app.ps1
# Script para actualizar la aplicación desde Git
# Ejecutar como Administrador

Write-Host "=========================================="
Write-Host "ACTUALIZACIÓN DE APLICACIÓN" -ForegroundColor Cyan
Write-Host "=========================================="

# Verificar que estamos en un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: No estamos en un repositorio Git" -ForegroundColor Red
    exit 1
}

# Mostrar estado actual
Write-Host "`n📊 Estado actual:" -ForegroundColor Yellow
git status --short
Write-Host "`n📌 Versión actual:" -ForegroundColor Yellow
git log -1 --oneline

# Confirmar actualización
$confirm = Read-Host "`n¿Deseas continuar con la actualización? (s/n)"
if ($confirm -ne "s") {
    Write-Host "❌ Actualización cancelada" -ForegroundColor Yellow
    exit 0
}

# Crear backup antes de actualizar
Write-Host "`n💾 Creando backup de seguridad..." -ForegroundColor Yellow
.\backup.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Advertencia: El backup falló" -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar de todos modos? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

# Pull cambios de Git
Write-Host "`n📥 Descargando cambios desde Git..." -ForegroundColor Yellow
git fetch origin
$changes = git log HEAD..origin/main --oneline

if ([string]::IsNullOrEmpty($changes)) {
    Write-Host "✅ No hay cambios nuevos" -ForegroundColor Green
    exit 0
}

Write-Host "`n📝 Cambios a aplicar:" -ForegroundColor Yellow
Write-Host $changes

$confirmPull = Read-Host "`n¿Aplicar estos cambios? (s/n)"
if ($confirmPull -ne "s") {
    Write-Host "❌ Actualización cancelada" -ForegroundColor Yellow
    exit 0
}

git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer pull de Git" -ForegroundColor Red
    exit 1
}

# Detener solo la aplicación (mantener BD)
Write-Host "`n🛑 Deteniendo aplicación..." -ForegroundColor Yellow
docker compose stop app

# Rebuild imagen
Write-Host "`n🔨 Reconstruyendo imagen..." -ForegroundColor Yellow
docker compose build app
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir imagen" -ForegroundColor Red
    Write-Host "🔄 Restaurando versión anterior..." -ForegroundColor Yellow
    git reset --hard HEAD~1
    docker compose up -d app
    exit 1
}

# Ejecutar migraciones nuevas
Write-Host "`n🚀 Ejecutando migraciones..." -ForegroundColor Yellow
docker compose run --rm app npm run migration:run:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Advertencia: Problema con migraciones" -ForegroundColor Yellow
}

# Reiniciar aplicación
Write-Host "`n🚀 Reiniciando aplicación..." -ForegroundColor Yellow
docker compose up -d app
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar aplicación" -ForegroundColor Red
    exit 1
}

# Esperar a que la app esté lista
Write-Host "`n⏳ Esperando a que la aplicación esté lista..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n=========================================="
Write-Host "✅ ACTUALIZACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "📌 Nueva versión:" -ForegroundColor Cyan
git log -1 --oneline

Write-Host "`n📋 Estado de contenedores:" -ForegroundColor Yellow
docker compose ps

$showLogs = Read-Host "`n¿Deseas ver los logs de la aplicación? (s/n)"
if ($showLogs -eq "s") {
    Write-Host "`n📋 Mostrando logs (Ctrl+C para salir):" -ForegroundColor Yellow
    docker compose logs -f app
}
