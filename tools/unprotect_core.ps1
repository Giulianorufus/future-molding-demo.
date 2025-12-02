# Rimozione protezione
$files = @(
    "src\cad\cadStore.ts",
    "src\cad\cadPipeline.ts",
    "src\engine\calcEngine.ts",
    "src\data\arburgPressCatalog.ts",
    "src\data\materialCatalog.ts"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        attrib -R $f
        Write-Host "Sbloccato: $f"
    }
}
