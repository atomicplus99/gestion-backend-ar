$ErrorActionPreference = "Stop"

Write-Host "🔧 Corrigiendo estructura de carpetas del frontend..." -ForegroundColor Cyan

# Procesar carpeta admin
if (Test-Path "frontend\admin\browser") {
    Write-Host "📁 Moviendo archivos de admin\browser a admin..." -ForegroundColor Yellow
    
    # Mover todos los archivos y carpetas de browser/ a admin/
    Get-ChildItem -Path "frontend\admin\browser" -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Replace((Get-Item "frontend\admin\browser").FullName, "")
        $destination = Join-Path "frontend\admin" $relativePath
        
        if ($_.PSIsContainer) {
            if (!(Test-Path $destination)) {
                New-Item -ItemType Directory -Path $destination -Force | Out-Null
            }
        } else {
            Copy-Item $_.FullName -Destination $destination -Force
        }
    }
    
    # Eliminar carpeta browser
    Remove-Item -Path "frontend\admin\browser" -Recurse -Force
    Write-Host "✅ Admin: carpeta browser eliminada" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Admin: no existe carpeta browser (ya está correcto)" -ForegroundColor Gray
}

# Procesar carpeta scanner
if (Test-Path "frontend\scanner\browser") {
    Write-Host "📁 Moviendo archivos de scanner\browser a scanner..." -ForegroundColor Yellow
    
    # Mover todos los archivos y carpetas de browser/ a scanner/
    Get-ChildItem -Path "frontend\scanner\browser" -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Replace((Get-Item "frontend\scanner\browser").FullName, "")
        $destination = Join-Path "frontend\scanner" $relativePath
        
        if ($_.PSIsContainer) {
            if (!(Test-Path $destination)) {
                New-Item -ItemType Directory -Path $destination -Force | Out-Null
            }
        } else {
            Copy-Item $_.FullName -Destination $destination -Force
        }
    }
    
    # Eliminar carpeta browser
    Remove-Item -Path "frontend\scanner\browser" -Recurse -Force
    Write-Host "✅ Scanner: carpeta browser eliminada" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Scanner: no existe carpeta browser (ya está correcto)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Estructura corregida correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Verificando estructura final:" -ForegroundColor Cyan

if (Test-Path "frontend\admin\index.html") {
    Write-Host "  ✅ frontend\admin\index.html - Existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ frontend\admin\index.html - NO existe" -ForegroundColor Red
}

if (Test-Path "frontend\scanner\index.html") {
    Write-Host "  ✅ frontend\scanner\index.html - Existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ frontend\scanner\index.html - NO existe" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Ahora ejecuta: docker compose down && docker compose build && docker compose up -d" -ForegroundColor Yellow
