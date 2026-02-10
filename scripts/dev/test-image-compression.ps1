# Image Compression Test Script

Write-Host "Testing Image Compression & Cache Management" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get cache stats BEFORE
Write-Host "Step 1: Current cache statistics..." -ForegroundColor Yellow
try {
    $statsBefore = Invoke-WebRequest -Uri "http://localhost:3000/api/nft/image/stats" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    if ($statsBefore.success) {
        $data = $statsBefore.data
        Write-Host "  Total Files: $($data.totalFiles)" -ForegroundColor Green
        Write-Host "  Total Size: $($data.totalSizeMB) MB / $($data.maxSizeMB) MB" -ForegroundColor Green
        $usageStr = "$($data.usagePercent)%"
        Write-Host "  Usage: $usageStr" -ForegroundColor Green
        $compressionStr = "$($data.averageCompressionRatio)%"
        Write-Host "  Avg Compression: $compressionStr" -ForegroundColor Green
        Write-Host "  Last Cleanup: $($data.lastCleanup)" -ForegroundColor Green
    }
}
catch {
    Write-Host "  Stats endpoint not available (might be first run)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Load a test image (will trigger compression if not cached)
Write-Host "Step 2: Testing image load with compression..." -ForegroundColor Yellow
$testHashes = @(
    "QmPbxeGcXhYQQNgsC6a36dDyYUcHgMLnGKnF8pVFmGsvqi",
    "QmYQXVYTBvT5Yubmy6T5PY1dLaR9UZWSmqHyXYJ1xb5QnF",
    "QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq"
)

$testHash = $testHashes[0]
Write-Host "  Testing with: $testHash"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/nft/image/$testHash" -UseBasicParsing
    
    $cacheStatus = $response.Headers['X-Cache-Status']
    $cacheFormat = $response.Headers['X-Cache-Format']
    $compressionRatio = $response.Headers['X-Compression-Ratio']
    $originalSize = $response.Headers['X-Original-Size']
    $compressedSize = $response.Headers['X-Compressed-Size']
    $contentType = $response.Headers['Content-Type']
    
    Write-Host "  Cache Status: $cacheStatus" -ForegroundColor Green
    Write-Host "  Format: $cacheFormat" -ForegroundColor Green
    Write-Host "  Content-Type: $contentType" -ForegroundColor Green
    
    if ($compressionRatio) {
        Write-Host "  Compression Ratio: $compressionRatio saved" -ForegroundColor Green
        Write-Host "  Original Size: $([math]::Round($originalSize/1KB, 2)) KB" -ForegroundColor Green
        Write-Host "  Compressed Size: $([math]::Round($compressedSize/1KB, 2)) KB" -ForegroundColor Green
    }
    
    $actualSize = $response.Content.Length
    Write-Host "  Downloaded: $([math]::Round($actualSize/1KB, 2)) KB" -ForegroundColor Green
}
catch {
    Write-Host "  Failed to load image: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get cache stats AFTER
Write-Host "Step 3: Updated cache statistics..." -ForegroundColor Yellow
try {
    $statsAfter = Invoke-WebRequest -Uri "http://localhost:3000/api/nft/image/stats" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    if ($statsAfter.success) {
        $data = $statsAfter.data
        Write-Host "  Total Files: $($data.totalFiles)" -ForegroundColor Green
        Write-Host "  Total Size: $($data.totalSizeMB) MB / $($data.maxSizeMB) MB" -ForegroundColor Green
        $usageStr = "$($data.usagePercent)%"
        Write-Host "  Usage: $usageStr" -ForegroundColor Green
        $compressionStr = "$($data.averageCompressionRatio)%"
        Write-Host "  Avg Compression: $compressionStr" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "  Top 5 Most Accessed Images:" -ForegroundColor Cyan
        $data.topFiles | Select-Object -First 5 | ForEach-Object {
            $hashShort = $_.hash.Substring(0, 16)
            $comprStr = "$($_.compressionRatio)%"
            Write-Host "    $hashShort... | $($_.sizeKB) KB | $($_.accessCount) accesses | $comprStr saved" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "  Failed to get stats: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Performance comparison
if ($statsBefore -and $statsAfter) {
    Write-Host "Summary:" -ForegroundColor Yellow
    
    $sizeBefore = [math]::Round($statsBefore.data.totalSizeMB, 2)
    $sizeAfter = [math]::Round($statsAfter.data.totalSizeMB, 2)
    $filesBefore = $statsBefore.data.totalFiles
    $filesAfter = $statsAfter.data.totalFiles
    
    if ($filesAfter -gt $filesBefore) {
        $newFiles = $filesAfter - $filesBefore
        Write-Host "  Added $newFiles new compressed file(s)" -ForegroundColor Green
    }
    
    if ($sizeAfter -ne $sizeBefore) {
        $sizeDiff = $sizeAfter - $sizeBefore
        Write-Host "  Cache size changed by $([math]::Round($sizeDiff, 2)) MB" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "  Current Efficiency:" -ForegroundColor Cyan
    Write-Host "    $filesAfter files cached" -ForegroundColor White
    $usageStr = "$($statsAfter.data.usagePercent)%"
    Write-Host "    $sizeAfter MB used of $($statsAfter.data.maxSizeMB) MB ($usageStr)" -ForegroundColor White
    $avgComprStr = "$($statsAfter.data.averageCompressionRatio)%"
    Write-Host "    Average compression: $avgComprStr" -ForegroundColor White
    
    if ($statsAfter.data.averageCompressionRatio -gt 0) {
        $estimatedOriginal = $sizeAfter / (1 - $statsAfter.data.averageCompressionRatio / 100)
        $saved = $estimatedOriginal - $sizeAfter
        Write-Host "    Estimated space saved: $([math]::Round($saved, 2)) MB" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "  View stats: http://localhost:3000/api/nft/image/stats" -ForegroundColor White
Write-Host "  Clear cache: curl -X DELETE http://localhost:3000/api/nft/image/all" -ForegroundColor White
Write-Host "  Docs: docs/architecture/IMAGE_COMPRESSION.md" -ForegroundColor White
