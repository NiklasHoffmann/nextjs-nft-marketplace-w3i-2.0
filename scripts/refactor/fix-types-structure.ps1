# Fix Types Structure - Remove Prefixes
# Phase 7: TypeScript Strictness

Write-Host "=== Cleaning Types Structure ===" -ForegroundColor Cyan
Write-Host ""

$typesDir = "$PSScriptRoot\..\..\src\types"

# Define folder renaming map (old -> new)
$folderRenames = @{
    "01-core" = "core"
    "02-ui" = "ui"
    "03-api" = "api"
    "04-insights" = "insights"
    "05-features" = "features"
    "06-marketplace" = "marketplace"
}

Write-Host "Step 1: Renaming type folders..." -ForegroundColor Yellow

foreach ($oldName in $folderRenames.Keys) {
    $newName = $folderRenames[$oldName]
    $oldPath = Join-Path $typesDir $oldName
    $newPath = Join-Path $typesDir $newName
    
    if (Test-Path $oldPath) {
        Write-Host "  Renaming: $oldName -> $newName" -ForegroundColor Green
        Move-Item -Path $oldPath -Destination $newPath -Force
    }
}

Write-Host ""
Write-Host "Step 2: Renaming files inside type folders..." -ForegroundColor Yellow

# Get all .ts files in type folders
$typeFiles = Get-ChildItem -Path $typesDir -Recurse -Filter "*.ts"

foreach ($file in $typeFiles) {
    $fileName = $file.Name
    $filePath = $file.FullName
    
    # Skip index.ts files
    if ($fileName -eq "index.ts") {
        continue
    }
    
    # Remove numeric prefixes (01-, 02-, 03-, etc.)
    if ($fileName -match "^\d{2}-(.+)") {
        $newFileName = $matches[1]
        $newPath = Join-Path $file.DirectoryName $newFileName
        
        Write-Host "  Renaming: $fileName -> $newFileName" -ForegroundColor Green
        Move-Item -Path $filePath -Destination $newPath -Force
    }
}

Write-Host ""
Write-Host "Step 3: Updating imports in index.ts files..." -ForegroundColor Yellow

# Update all index.ts files to remove numeric prefixes from imports
$indexFiles = Get-ChildItem -Path $typesDir -Recurse -Filter "index.ts"

foreach ($indexFile in $indexFiles) {
    $content = Get-Content -Path $indexFile.FullName -Raw
    $originalContent = $content
    
    # Replace import paths with numeric prefixes
    # Example: './01-core-nft' -> './core-nft'
    $content = $content -replace "from\s+'\.\/\d{2}-", "from './"
    $content = $content -replace "export\s+\*\s+from\s+'\.\/\d{2}-", "export * from './"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $indexFile.FullName -Value $content -NoNewline
        Write-Host "  Updated: $($indexFile.Name) in $($indexFile.Directory.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 4: Updating main index.ts..." -ForegroundColor Yellow

$mainIndex = Join-Path $typesDir "index.ts"
if (Test-Path $mainIndex) {
    $content = Get-Content -Path $mainIndex -Raw
    
    # Replace folder paths with numeric prefixes
    # Example: './01-core' -> './core'
    $content = $content -replace "from\s+'\.\/\d{2}-", "from './"
    $content = $content -replace "export\s+\*\s+from\s+'\.\/\d{2}-", "export * from './"
    
    Set-Content -Path $mainIndex -Value $content -NoNewline
    Write-Host "  Updated main index.ts" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Folder renames: $($folderRenames.Count)" -ForegroundColor Green
Write-Host "Files renamed: $(($typeFiles | Where-Object { $_.Name -match '^\d{2}-' } | Measure-Object).Count)" -ForegroundColor Green
Write-Host "Index files updated: $($indexFiles.Count + 1)" -ForegroundColor Green
Write-Host ""
Write-Host "Types structure cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT: Run import update script to fix all type imports in codebase" -ForegroundColor Yellow
