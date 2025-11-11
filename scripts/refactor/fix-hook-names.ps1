# Fix Hook Names - Remove Prefix Numbers
# Entfernt Präfixe von Hook-Dateien (01-core-, 02-admin-, etc.)

$rootPath = "c:\Users\hoffm\Programming\nextjs-nft-marketplace-w3i-2.0"
$hooksPath = "$rootPath\src\hooks"

Write-Host "Starte Hook-Namen-Fix..." -ForegroundColor Cyan

$renamedFiles = 0

# Pattern für Hook-Dateien mit Präfixen
$pattern = "^\d{2}-(core|admin|ui|utils|user|wallet|features)-(.+\.ts)$"

# Durchsuche alle Hook-Dateien
$files = Get-ChildItem -Path $hooksPath -Recurse -Filter "*.ts" -File

foreach ($file in $files) {
    # Überspringe index.ts Dateien
    if ($file.Name -eq "index.ts") {
        continue
    }
    
    # Prüfe ob Dateiname dem Pattern entspricht
    if ($file.Name -match $pattern) {
        $prefix = $matches[1]  # core, admin, ui, etc.
        $cleanName = $matches[2]  # useNFTFilters.ts, etc.
        
        $newName = $cleanName
        $newPath = Join-Path $file.Directory.FullName $newName
        
        # Prüfe ob Zieldatei bereits existiert
        if (Test-Path $newPath) {
            Write-Host "SKIP $($file.Name) -> $newName (bereits vorhanden)" -ForegroundColor Yellow
            continue
        }
        
        # Umbenennen
        Rename-Item -Path $file.FullName -NewName $newName
        Write-Host "OK $($file.Name) -> $newName" -ForegroundColor Green
        $renamedFiles++
    }
}

Write-Host ""
Write-Host "=== Fertig! ===" -ForegroundColor Green
Write-Host "Umbenannte Dateien: $renamedFiles" -ForegroundColor Yellow

if ($renamedFiles -eq 0) {
    Write-Host ""
    Write-Host "Keine Dateien mit Praefixen gefunden - alle Hook-Namen sind bereits clean!" -ForegroundColor Green
}
