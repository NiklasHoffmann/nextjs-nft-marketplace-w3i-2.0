# Fix Utils Names - Remove Prefix Numbers
# Entfernt Präfixe von Utils-Dateien (01-core-, 02-formatters-, etc.)

$rootPath = "c:\Users\hoffm\Programming\nextjs-nft-marketplace-w3i-2.0"
$utilsPath = "$rootPath\src\utils"

Write-Host "Starte Utils-Namen-Fix..." -ForegroundColor Cyan

$renamedFiles = 0

# Pattern für Utils-Dateien mit Präfixen
$pattern = "^\d{2}-(core|formatters|validation|blockchain|performance|features|api)-(.+\.ts)$"

# Durchsuche alle Utils-Dateien
$files = Get-ChildItem -Path $utilsPath -Recurse -Filter "*.ts" -File

foreach ($file in $files) {
    # Überspringe index.ts und devLog.ts
    if ($file.Name -eq "index.ts" -or $file.Name -eq "devLog.ts") {
        continue
    }
    
    # Prüfe ob Dateiname dem Pattern entspricht
    if ($file.Name -match $pattern) {
        $prefix = $matches[1]  # core, formatters, etc.
        $cleanName = $matches[2]  # bigint.ts, general.ts, etc.
        
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
    Write-Host "Keine Dateien mit Praefixen gefunden - alle Utils-Namen sind bereits clean!" -ForegroundColor Green
}
