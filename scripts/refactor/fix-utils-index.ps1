# Fix Utils Index Files - Update imports to match renamed files
# Aktualisiert index.ts Dateien um auf die umbenannten Utils zu verweisen

$rootPath = "c:\Users\hoffm\Programming\nextjs-nft-marketplace-w3i-2.0"
$utilsPath = "$rootPath\src\utils"

Write-Host "Starte Utils Index-Fix..." -ForegroundColor Cyan

$indexFiles = Get-ChildItem -Path $utilsPath -Recurse -Filter "index.ts" -File | Where-Object {
    $_.Directory.Name -ne "utils"  # Skip root index.ts
}

$modifiedFiles = 0

foreach ($indexFile in $indexFiles) {
    $content = Get-Content $indexFile.FullName
    $originalContent = $content -join "`n"
    $modified = $false
    
    $newContent = @()
    
    foreach ($line in $content) {
        $newLine = $line
        
        # Ersetze Präfixe in export statements
        $newLine = $newLine -replace "from './01-core-", "from './"
        $newLine = $newLine -replace "from './02-core-", "from './"
        $newLine = $newLine -replace "from './01-formatters-", "from './"
        $newLine = $newLine -replace "from './01-validation-", "from './"
        $newLine = $newLine -replace "from './01-blockchain-", "from './"
        $newLine = $newLine -replace "from './02-blockchain-", "from './"
        $newLine = $newLine -replace "from './03-blockchain-", "from './"
        $newLine = $newLine -replace "from './04-blockchain-", "from './"
        $newLine = $newLine -replace "from './05-blockchain-", "from './"
        $newLine = $newLine -replace "from './06-blockchain-", "from './"
        $newLine = $newLine -replace "from './01-performance-", "from './"
        $newLine = $newLine -replace "from './02-performance-", "from './"
        $newLine = $newLine -replace "from './03-performance-", "from './"
        $newLine = $newLine -replace "from './01-features-", "from './"
        $newLine = $newLine -replace "from './01-api-", "from './"
        $newLine = $newLine -replace "from './02-api-", "from './"
        
        if ($newLine -ne $line) {
            $modified = $true
        }
        
        $newContent += $newLine
    }
    
    if ($modified) {
        $newContent | Set-Content -Path $indexFile.FullName
        $relativePath = $indexFile.FullName.Substring($rootPath.Length + 1)
        Write-Host "OK $relativePath" -ForegroundColor Green
        $modifiedFiles++
    }
}

Write-Host ""
Write-Host "=== Fertig! ===" -ForegroundColor Green
Write-Host "Aktualisierte Index-Dateien: $modifiedFiles" -ForegroundColor Yellow
