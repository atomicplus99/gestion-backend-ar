param(
    [string]$CertName = "Sistema Control de Asistencia -AR",
    [int]$ValidityYears = 5
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Ejecutar como Administrador"
    exit 1
}

New-Item -ItemType Directory -Path "ssl" -Force | Out-Null

$serverIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -match "^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" -and
    $_.InterfaceAlias -notmatch "WSL|Hyper-V|vEthernet|Loopback"
}).IPAddress | Select-Object -First 1

if (-not $serverIP) { $serverIP = "127.0.0.1" }

$dnsNames = @("localhost", $serverIP, $env:COMPUTERNAME, "asistencia.colegio.local") | Select-Object -Unique

$cert = New-SelfSignedCertificate `
    -DnsName $dnsNames `
    -CertStoreLocation "cert:\LocalMachine\My" `
    -FriendlyName $CertName `
    -NotAfter (Get-Date).AddYears($ValidityYears) `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -HashAlgorithm SHA256

$tempPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$pwd = ConvertTo-SecureString -String $tempPassword -Force -AsPlainText

Export-PfxCertificate -Cert $cert -FilePath "ssl\temp.pfx" -Password $pwd | Out-Null

& openssl pkcs12 -in ssl/temp.pfx -out ssl/certificate.pem -nodes -passin "pass:$tempPassword" 2>$null
& openssl pkcs12 -in ssl/temp.pfx -out ssl/private-key.pem -nocerts -nodes -passin "pass:$tempPassword" 2>$null

Remove-Item "ssl\temp.pfx" -Force

Export-Certificate -Cert $cert -FilePath "ssl\colegio-certificado.cer" | Out-Null

Write-Host "Certificados generados en: ssl/" -ForegroundColor Green
Write-Host "Servidor IP: $serverIP" -ForegroundColor Cyan
