# Auto-protezione: viene lanciato dopo ogni salvataggio SVCode
$root = "C:\Users\Utente\Documents\forma-facile-parametro-export"
$protectedList = Get-Content "$root\tools\protected_files.txt"

foreach ($rel in $protectedList) {
    $full = Join-Path $root $rel
    if (Test-Path $full) {
        attrib +R $full
        Write-Host "Protetto automaticamente: $rel"
    }
}
