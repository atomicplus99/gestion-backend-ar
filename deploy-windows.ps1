$ErrorActionPreference = "Stop"

Write-Host "Iniciando despliegue..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Error "Archivo .env no encontrado"
    exit 1
}

docker compose down
docker compose build
docker compose up -d mysql

Write-Host "Esperando MySQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

$retries = 0
while ($retries -lt 10) {
    $result = docker compose exec mysql mysqladmin ping -h localhost --silent 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 5
    $retries++
}

docker compose run --rm app npm run migration:run:prod
docker compose run --rm app npm run seed:run
docker compose up -d app

Write-Host "Despliegue completado" -ForegroundColor Green
docker compose ps
