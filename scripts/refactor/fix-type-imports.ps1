# Fix Type Imports - Update paths after structure cleanup
# Phase 7: TypeScript Strictness

Write-Host "=== Fixing Type Imports ===" -ForegroundColor Cyan
Write-Host ""

# Get all TS/TSX files in src
$files = Get-ChildItem -Path "$PSScriptRoot\..\..\src" -Recurse -Include "*.ts", "*.tsx" -Exclude "*.d.ts"

$updatedCount = 0
$totalReplacements = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace("$PSScriptRoot\..\..\", "")
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        
        # Replace old type import paths with new ones
        # @/types/01-core -> @/types/core
        $replacements = @{
            "@/types/01-core" = "@/types/core"
            "@/types/02-ui" = "@/types/ui"
            "@/types/03-api" = "@/types/api"
            "@/types/04-insights" = "@/types/insights"
            "@/types/05-features" = "@/types/features"
            "@/types/06-marketplace" = "@/types/marketplace"
        }
        
        $fileChanged = $false
        $fileReplacements = 0
        
        foreach ($oldPath in $replacements.Keys) {
            $newPath = $replacements[$oldPath]
            if ($content -match [regex]::Escape($oldPath)) {
                $content = $content -replace [regex]::Escape($oldPath), $newPath
                $fileChanged = $true
                
                # Count occurrences
                $occurrences = ([regex]::Matches($originalContent, [regex]::Escape($oldPath))).Count
                $fileReplacements += $occurrences
            }
        }
        
        # Also fix file-level imports (numeric prefixes in filenames)
        # @/types/core/01-core-nft -> @/types/core/core-nft
        if ($content -match "@/types/\w+/\d{2}-") {
            $content = $content -replace "@/types/(\w+)/\d{2}-", '@/types/$1/'
            $fileChanged = $true
        }
        
        if ($fileChanged) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $updatedCount++
            $totalReplacements += $fileReplacements
            Write-Host "[OK] $relativePath ($fileReplacements imports)" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "[ERROR] $relativePath - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files scanned: $($files.Count)"
Write-Host "Files updated: $updatedCount" -ForegroundColor Green
Write-Host "Total imports fixed: $totalReplacements" -ForegroundColor Green
Write-Host ""
Write-Host "Type imports updated successfully!" -ForegroundColor Green
