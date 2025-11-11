# Fix All Imports After Hook/Utils Rename
# Aktualisiert alle Imports nach der Umbenennung von Hooks und Utils

$rootPath = "c:\Users\hoffm\Programming\nextjs-nft-marketplace-w3i-2.0"
$srcPath = "$rootPath\src"

Write-Host "Starte Import-Update nach Hook/Utils-Umbenennung..." -ForegroundColor Cyan

$totalFiles = 0
$modifiedFiles = 0

# Alle TypeScript/JavaScript Dateien durchsuchen
$files = Get-ChildItem -Path $srcPath -Include *.ts,*.tsx,*.js,*.jsx -Recurse -File

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName
    $originalContent = $content -join "`n"
    $modified = $false
    
    $newContent = @()
    
    foreach ($line in $content) {
        $newLine = $line
        
        # === HOOK IMPORTS ===
        # NFT Hooks
        $newLine = $newLine -replace "from '@/hooks/nfts/01-core-nft-hooks'", "from '@/hooks/nfts/nft-hooks'"
        $newLine = $newLine -replace "from '@/hooks/nfts/02-admin-useNFTInsights'", "from '@/hooks/nfts/useNFTInsights'"
        $newLine = $newLine -replace "from '@/hooks/nfts/03-ui-useNFTUserActions'", "from '@/hooks/nfts/useNFTUserActions'"
        $newLine = $newLine -replace "from '@/hooks/nfts/05-utils-useNFTPriceData'", "from '@/hooks/nfts/useNFTPriceData'"
        $newLine = $newLine -replace "from '@/hooks/nfts/06-utils-useNFTPrefetch'", "from '@/hooks/nfts/useNFTPrefetch'"
        $newLine = $newLine -replace "from '@/hooks/nfts/08-utils-useNFTFilters'", "from '@/hooks/nfts/useNFTFilters'"
        $newLine = $newLine -replace "from '@/hooks/nfts/09-wallet-useWalletNFTs'", "from '@/hooks/nfts/useWalletNFTs'"
        
        # Marketplace Hooks
        $newLine = $newLine -replace "from '@/hooks/marketplace/01-core-useMarketplaceData'", "from '@/hooks/marketplace/useMarketplaceData'"
        $newLine = $newLine -replace "from '@/hooks/marketplace/02-core-useMarketplaceListing'", "from '@/hooks/marketplace/useMarketplaceListing'"
        $newLine = $newLine -replace "from '@/hooks/marketplace/03-core-useMarketplacePurchase'", "from '@/hooks/marketplace/useMarketplacePurchase'"
        $newLine = $newLine -replace "from '@/hooks/marketplace/04-admin-useMarketplaceAdmin'", "from '@/hooks/marketplace/useMarketplaceAdmin'"
        $newLine = $newLine -replace "from '@/hooks/marketplace/05-user-useMarketplaceUser'", "from '@/hooks/marketplace/useMarketplaceUser'"
        
        # Interaction Hooks
        $newLine = $newLine -replace "from '@/hooks/interactions/01-core-useUserInteractions'", "from '@/hooks/interactions/useUserInteractions'"
        
        # === UTILS IMPORTS ===
        # Core Utils
        $newLine = $newLine -replace "from '@/utils/01-core/01-core-bigint'", "from '@/utils/01-core/bigint'"
        $newLine = $newLine -replace "from '@/utils/01-core/02-core-media'", "from '@/utils/01-core/media'"
        
        # Formatters
        $newLine = $newLine -replace "from '@/utils/02-formatters/01-formatters-general'", "from '@/utils/02-formatters/general'"
        
        # Validation
        $newLine = $newLine -replace "from '@/utils/03-validation/01-validation-general'", "from '@/utils/03-validation/general'"
        
        # Blockchain Utils
        $newLine = $newLine -replace "from '@/utils/04-blockchain/01-blockchain-contracts'", "from '@/utils/04-blockchain/contracts'"
        $newLine = $newLine -replace "from '@/utils/04-blockchain/02-blockchain-nft-helpers'", "from '@/utils/04-blockchain/nft-helpers'"
        $newLine = $newLine -replace "from '@/utils/04-blockchain/03-blockchain-contract-calls'", "from '@/utils/04-blockchain/contract-calls'"
        $newLine = $newLine -replace "from '@/utils/04-blockchain/04-blockchain-nft-fetcher'", "from '@/utils/04-blockchain/nft-fetcher'"
        $newLine = $newLine -replace "from '@/utils/04-blockchain/05-blockchain-rpc-config'", "from '@/utils/04-blockchain/rpc-config'"
        $newLine = $newLine -replace "from '@/utils/04-blockchain/06-blockchain-smart-cache'", "from '@/utils/04-blockchain/smart-cache'"
        
        # Performance Utils
        $newLine = $newLine -replace "from '@/utils/05-performance/01-performance-monitoring'", "from '@/utils/05-performance/monitoring'"
        $newLine = $newLine -replace "from '@/utils/05-performance/02-performance-cache'", "from '@/utils/05-performance/cache'"
        $newLine = $newLine -replace "from '@/utils/05-performance/03-performance-context'", "from '@/utils/05-performance/context'"
        
        # Features Utils
        $newLine = $newLine -replace "from '@/utils/06-features/01-features-admin-access'", "from '@/utils/06-features/admin-access'"
        
        # API Utils
        $newLine = $newLine -replace "from '@/utils/07-api/01-api-nft'", "from '@/utils/07-api/nft'"
        $newLine = $newLine -replace "from '@/utils/07-api/02-api-nft-aggregation'", "from '@/utils/07-api/nft-aggregation'"
        
        if ($newLine -ne $line) {
            $modified = $true
        }
        
        $newContent += $newLine
    }
    
    if ($modified) {
        $newContent | Set-Content -Path $file.FullName
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
    Write-Host "Keine veralteten Imports gefunden - alle Imports sind bereits aktuell!" -ForegroundColor Green
}
