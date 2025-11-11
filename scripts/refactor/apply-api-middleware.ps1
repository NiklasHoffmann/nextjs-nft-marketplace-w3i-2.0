# Apply API Middleware Pattern to all Route Files
# Replaces NextResponse with apiSuccess/apiError
# Adds rate limiting and validation

Write-Host "=== Applying API Middleware Pattern ===" -ForegroundColor Cyan
Write-Host ""

# Get all route.ts files
$routeFiles = Get-ChildItem -Path "$PSScriptRoot\..\..\src\app\api" -Recurse -Filter "route.ts"

$updatedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($file in $routeFiles) {
    $relativePath = $file.FullName.Replace("$PSScriptRoot\..\..\", "")
    Write-Host "Processing: $relativePath" -ForegroundColor Yellow
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        
        # Skip if already updated (check for '@/lib/api' import)
        if ($content -match '@/lib/api') {
            Write-Host "  [SKIP] Already updated" -ForegroundColor Green
            $skippedCount++
            continue
        }
        
        # 1. Replace NextResponse import
        $importPattern = 'import \{ NextRequest, NextResponse \} from ''next/server'';'
        $newImport = "import { NextRequest } from 'next/server';`nimport { apiSuccess, apiBadRequest, apiUnauthorized, apiInternalError, rateLimit, RATE_LIMIT_CONFIG, parseJsonBody, getQueryParam, BadRequestError } from '@/lib/api';"
        $content = $content -replace [regex]::Escape($importPattern), $newImport
        
        # 2. Replace simple NextResponse.json patterns
        # Success responses: NextResponse.json({ success: true, data: X })
        $content = $content -replace 'NextResponse\.json\(\s*\{\s*success:\s*true,\s*data:\s*', 'apiSuccess('
        
        # Remove trailing }) for success
        $content = $content -replace '\}\s*\)\s*;(\s*//[^\n]*)?$', ');$1' -replace '\}\s*\)(\s*)$', ')$1'
        
        # Error responses: NextResponse.json({ success: false, error: ... }, { status: 400 })
        $content = $content -replace 'NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*400\s*\}\s*\)', 'apiBadRequest($1)'
        $content = $content -replace 'NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*401\s*\}\s*\)', 'apiUnauthorized($1)'
        $content = $content -replace 'NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*500\s*\}\s*\)', 'apiInternalError($1)'
        
        # Only write if content changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $updatedCount++
            Write-Host "  [OK] Applied middleware pattern" -ForegroundColor Green
        } else {
            Write-Host "  [SKIP] No changes needed" -ForegroundColor Gray
            $skippedCount++
        }
        
    } catch {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Total files: $($routeFiles.Count)"
Write-Host "Updated: $updatedCount" -ForegroundColor Green
Write-Host "Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  - Review changes and add rate limiting manually" -ForegroundColor Yellow
Write-Host "  - Add requireAdmin() to admin routes" -ForegroundColor Yellow
Write-Host "  - Add proper validation and error handling" -ForegroundColor Yellow
