# Fix Relative Imports - Convert to Absolute Imports
# Ersetzt alle relativen Imports (../, ../../) durch absolute (@/) Imports

$rootPath = "c:\Users\hoffm\Programming\nextjs-nft-marketplace-w3i-2.0"
$srcPath = "$rootPath\src"

Write-Host "Starte Relative-Import-Fix..." -ForegroundColor Cyan
$totalFiles = 0
$modifiedFiles = 0

# Funktion um relativen Pfad in absoluten umzuwandeln
function Convert-RelativeToAbsolute {
    param(
        [string]$FilePath,
        [string]$ImportPath
    )
    
    # Entferne Quotes
    $cleanImport = $ImportPath.Trim('"').Trim("'")
    
    # Wenn nicht relativ, return original
    if (-not $cleanImport.StartsWith('.')) {
        return $ImportPath
    }
    
    # Berechne absoluten Pfad
    $fileDir = Split-Path -Parent $FilePath
    $fullImportPath = Join-Path $fileDir $cleanImport
    $fullImportPath = [System.IO.Path]::GetFullPath($fullImportPath)
    
    # Konvertiere zu @/ Pfad
    if ($fullImportPath.StartsWith($srcPath)) {
        $relativePath = $fullImportPath.Substring($srcPath.Length).TrimStart('\')
        $absoluteImport = '@/' + $relativePath.Replace('\', '/')
        
        # Entferne .tsx/.ts/.jsx/.js Extensions
        $absoluteImport = $absoluteImport -replace '\.(tsx|ts|jsx|js)$', ''
        
        return "'$absoluteImport'"
    }
    
    return $ImportPath
}

# Alle TypeScript/JavaScript Dateien durchsuchen
$files = Get-ChildItem -Path $srcPath -Include *.ts,*.tsx,*.js,*.jsx -Recurse -File

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Encoding UTF8
    $originalContent = $content -join "`n"
    $modified = $false
    
    $newContent = @()
    
    foreach ($line in $content) {
        $newLine = $line
        
        # Matche import statements mit relativen Pfaden
        if ($line -match "^import\s+.*\s+from\s+['""](\.\./[^'""]+|\.\/[^'""]+)['""]") {
            $oldImport = $matches[1]
            $newImport = Convert-RelativeToAbsolute -FilePath $file.FullName -ImportPath $oldImport
            
            if ($newImport -ne "'$oldImport'" -and $newImport -ne """$oldImport""") {
                $newLine = $line -replace [regex]::Escape("'$oldImport'"), $newImport
                $newLine = $newLine -replace [regex]::Escape("""$oldImport"""), $newImport.Replace("'", '"')
                $modified = $true
            }
        }
        
        $newContent += $newLine
    }
    
    if ($modified) {
        $newContent | Set-Content -Path $file.FullName -Encoding UTF8
        $relativePath = $file.FullName.Substring($rootPath.Length + 1)
        Write-Host "OK $relativePath" -ForegroundColor Green
        $modifiedFiles++
    }
}

Write-Host ""
Write-Host "=== Fertig! ===" -ForegroundColor Green
Write-Host "Geprufte Dateien: $totalFiles" -ForegroundColor Cyan
Write-Host "Aktualisierte Dateien: $modifiedFiles" -ForegroundColor Yellow

if ($modifiedFiles -eq 0) {
    Write-Host ""
    Write-Host "Keine relativen Imports gefunden - alle Imports sind bereits absolut!" -ForegroundColor Green
}
