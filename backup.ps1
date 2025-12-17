$backupDir = ".\backups"
$date = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Creando backup..." -ForegroundColor Cyan

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$envContent = Get-Content .env
$dbPassword = ($envContent | Select-String "DB_PASSWORD=").ToString().Split('=')[1]
$dbName = ($envContent | Select-String "DB_NAME=").ToString().Split('=')[1]

docker compose exec -T mysql mysqldump -u root -p$dbPassword $dbName > "$backupDir\db-$date.sql"

if (Test-Path "public\profiles") {
    Compress-Archive -Path "public\profiles" -DestinationPath "$backupDir\profiles-$date.zip" -Force
}

Get-ChildItem $backupDir -File | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item

Write-Host "Backup completado: $date" -ForegroundColor Green
