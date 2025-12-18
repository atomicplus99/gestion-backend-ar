$ErrorActionPreference = "Stop"

Write-Host "🔄 Actualizando Frontend Angular..." -ForegroundColor Cyan

# Verificar que existen los archivos
if (-not (Test-Path "frontend\admin\index.html")) {
    Write-Error "❌ No se encontró index.html en frontend\admin\"
    Write-Host "Por favor, copia primero los archivos compilados de Angular" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivos de frontend encontrados" -ForegroundColor Green

# Reiniciar aplicación
Write-Host "`n🔄 Reiniciando aplicación..." -ForegroundColor Yellow
docker compose restart app

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al reiniciar la aplicación"
    exit 1
}

Write-Host "`n✅ Frontend actualizado correctamente" -ForegroundColor Green
Write-Host "`n📊 Estado de los contenedores:" -ForegroundColor Cyan
docker compose ps

Write-Host "`nAccede a la aplicación en: https://192.168.1.103:443/" -ForegroundColor Yellow
