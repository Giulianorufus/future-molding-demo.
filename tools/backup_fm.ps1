$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$src = "C:\Users\Utente\Documents\forma-facile-parametro-export"
$dstBase = "C:\Users\Utente\Documents\FutureMolding-Backups"
$dst = "$dstBase\backup-$timestamp.zip"

if (!(Test-Path $dstBase)) {
    New-Item -ItemType Directory -Force -Path $dstBase | Out-Null
}

Compress-Archive -Path $src -DestinationPath $dst -Force
Write-Host "Backup creato in $dst"
