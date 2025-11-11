# Fix remaining old type import paths
# Some files still reference old paths with numeric prefixes

Write-Host "=== Fixing Remaining Type Imports ===" -ForegroundColor Cyan
Write-Host ""

$files = Get-ChildItem -Path "$PSScriptRoot\..\..\src" -Recurse -Include "*.ts", "*.tsx"

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Fix specific patterns that weren't caught before
    # @/types/01-core/01-core-nft-modern -> @/types/core/core-nft-modern
    $content = $content -replace "@/types/01-core/01-core-", "@/types/core/core-"
    $content = $content -replace "@/types/01-core/02-core-", "@/types/core/core-"
    $content = $content -replace "@/types/02-ui/01-ui-", "@/types/ui/ui-"
    $content = $content -replace "@/types/03-api/01-api-", "@/types/api/api-"
    $content = $content -replace "@/types/04-insights/01-insights-", "@/types/insights/insights-"
    $content = $content -replace "@/types/04-insights/02-insights-", "@/types/insights/insights-"
    $content = $content -replace "@/types/05-features/01-nft-", "@/types/features/nft-"
    $content = $content -replace "@/types/05-features/02-user-", "@/types/features/user-"
    $content = $content -replace "@/types/05-features/03-nft-", "@/types/features/nft-"
    $content = $content -replace "@/types/06-marketplace/01-marketplace-", "@/types/marketplace/marketplace-"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedCount++
        $relativePath = $file.FullName.Replace("$PSScriptRoot\..\..\", "")
        Write-Host "[OK] $relativePath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files updated: $updatedCount" -ForegroundColor Green
