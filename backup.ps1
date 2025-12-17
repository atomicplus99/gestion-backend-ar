# backup.ps1
# Script de backup automático para Windows
# Ejecutar como Administrador

param(
    [string]$backupDir = ".\backups"
)

$date = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = "logs\backup-$date.log"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "=========================================="
Write-Log "INICIANDO BACKUP - $date"
Write-Log "=========================================="

# Verificar que el directorio de backup existe
if (-not (Test-Path $backupDir)) {
    Write-Log "📁 Creando directorio de backups..."
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# Verificar que Docker está corriendo
try {
    docker ps | Out-Null
} catch {
    Write-Log "❌ Error: Docker no está corriendo"
    exit 1
}

# Leer contraseña de .env
$envContent = Get-Content .env
$dbPassword = ($envContent | Select-String "DB_PASSWORD=").ToString().Split('=')[1]
$dbName = ($envContent | Select-String "DB_NAME=").ToString().Split('=')[1]

if ([string]::IsNullOrEmpty($dbPassword)) {
    Write-Log "❌ Error: No se pudo leer DB_PASSWORD del archivo .env"
    exit 1
}

# Backup de base de datos
Write-Log "🗄️ Creando backup de MySQL..."
try {
    $dbBackupFile = "$backupDir\db-$date.sql"
    docker compose exec -T mysql mysqldump -u root -p$dbPassword $dbName > $dbBackupFile
    
    if ($LASTEXITCODE -eq 0) {
        $dbSize = (Get-Item $dbBackupFile).Length / 1MB
        Write-Log "✅ Backup de base de datos completado ($([math]::Round($dbSize, 2)) MB)"
    } else {
        Write-Log "❌ Error al crear backup de base de datos"
    }
} catch {
    Write-Log "❌ Error: $_"
}

# Backup de fotos de usuarios
Write-Log "📸 Creando backup de fotos de usuarios..."
try {
    if (Test-Path "public\profiles") {
        $profilesBackupFile = "$backupDir\profiles-$date.zip"
        Compress-Archive -Path "public\profiles" -DestinationPath $profilesBackupFile -Force
        
        $profilesSize = (Get-Item $profilesBackupFile).Length / 1MB
        Write-Log "✅ Backup de fotos completado ($([math]::Round($profilesSize, 2)) MB)"
    } else {
        Write-Log "⚠️ Directorio public\profiles no existe"
    }
} catch {
    Write-Log "❌ Error al crear backup de fotos: $_"
}

# Backup de uploads
Write-Log "📁 Creando backup de uploads..."
try {
    if (Test-Path "uploads") {
        $uploadsBackupFile = "$backupDir\uploads-$date.zip"
        Compress-Archive -Path "uploads" -DestinationPath $uploadsBackupFile -Force
        
        $uploadsSize = (Get-Item $uploadsBackupFile).Length / 1MB
        Write-Log "✅ Backup de uploads completado ($([math]::Round($uploadsSize, 2)) MB)"
    } else {
        Write-Log "⚠️ Directorio uploads no existe"
    }
} catch {
    Write-Log "❌ Error al crear backup de uploads: $_"
}

# Backup del archivo .env (sin contraseñas visibles)
Write-Log "⚙️ Creando backup de configuración..."
try {
    $envBackup = Get-Content .env | ForEach-Object {
        if ($_ -match "PASSWORD|SECRET|KEY|TOKEN") {
            $parts = $_ -split '=', 2
            "$($parts[0])=***REDACTED***"
        } else {
            $_
        }
    }
    $envBackup | Out-File "$backupDir\env-$date.txt"
    Write-Log "✅ Backup de configuración completado"
} catch {
    Write-Log "❌ Error al crear backup de configuración: $_"
}

# Limpiar backups antiguos (mantener últimos 7 días)
Write-Log "🧹 Limpiando backups antiguos (> 7 días)..."
try {
    $oldBackups = Get-ChildItem $backupDir -File | Where-Object {
        $_.LastWriteTime -lt (Get-Date).AddDays(-7)
    }
    
    $deletedCount = 0
    $freedSpace = 0
    
    foreach ($file in $oldBackups) {
        $freedSpace += $file.Length
        Remove-Item $file.FullName -Force
        $deletedCount++
    }
    
    if ($deletedCount -gt 0) {
        $freedSpaceMB = $freedSpace / 1MB
        Write-Log "✅ Eliminados $deletedCount archivos antiguos (liberados $([math]::Round($freedSpaceMB, 2)) MB)"
    } else {
        Write-Log "✅ No hay backups antiguos para eliminar"
    }
} catch {
    Write-Log "❌ Error al limpiar backups: $_"
}

# Resumen
Write-Log "=========================================="
Write-Log "BACKUP COMPLETADO - $date"
Write-Log "=========================================="

# Listar backups actuales
$totalSize = 0
$backupFiles = Get-ChildItem $backupDir -File
Write-Log "`n📊 Backups disponibles:"
foreach ($file in $backupFiles) {
    $size = $file.Length / 1MB
    $totalSize += $size
    Write-Log "   $($file.Name) - $([math]::Round($size, 2)) MB"
}
Write-Log "`n💾 Espacio total usado: $([math]::Round($totalSize, 2)) MB"
Write-Log "📄 Log guardado en: $logFile"
Write-Log "=========================================="

exit 0
