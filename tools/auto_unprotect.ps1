# Sblocca temporaneamente i file per modifiche manuali
$root = "C:\Users\Utente\Documents\forma-facile-parametro-export"
$protectedList = Get-Content "$root\tools\protected_files.txt"

foreach ($rel in $protectedList) {
    $full = Join-Path $root $rel
    if (Test-Path $full) {
        attrib -R $full
        Write-Host "Sbloccato: $rel"
    }
}
