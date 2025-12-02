$backupBase = "C:\Users\Utente\Documents\FutureMolding-Backups"
$backup = Get-ChildItem -Path $backupBase -Filter *.zip | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$project = "C:\Users\Utente\Documents\forma-facile-parametro-export"

if (-not $backup) {
    Write-Host "Nessun backup trovato."
    exit
}

Remove-Item -Recurse -Force $project
Expand-Archive -Path $backup.FullName -DestinationPath $project

Write-Host "Ripristino completato da $($backup.Name)"
