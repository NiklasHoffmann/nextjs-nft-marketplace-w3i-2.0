# NFT Metadata Migration Guide

## Overview
This migration populates the new `nft_metadata` collection from existing `marketplace_items` data.

## What it does
1. Creates indexes on `nft_metadata` collection
2. Reads all `marketplace_items` 
3. Extracts and migrates metadata + contract info
4. Sets `currentOwner` from active listings
5. Tracks ownership history

## Before running
- ✅ Backup your database
- ✅ Ensure `marketplace_items` has data
- ✅ Server must be running

## Run migration

### Option 1: Using curl (PowerShell)
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/migrate/seed-nft-metadata" -Method POST -Headers @{"Authorization"="Bearer YOUR_ADMIN_TOKEN"} | Select-Object -ExpandProperty Content
```

### Option 2: Using the script
```powershell
npm run migrate:nft-metadata
```

### Option 3: Manual API call
POST to `http://localhost:3000/api/admin/migrate/seed-nft-metadata`

## Expected output
```json
{
  "success": true,
  "data": {
    "message": "Migration completed successfully",
    "stats": {
      "totalMarketplaceItems": 61,
      "migratedNFTs": 61,
      "skippedDuplicates": 0,
      "errors": 0,
      "duration": 2500
    }
  }
}
```

## After migration
- ✅ Check `nft_metadata` collection has documents
- ✅ Verify indexes created: `nftAddress + tokenId`, `currentOwner`
- ✅ Test `/api/user/nfts?walletAddress=0x...`
- ✅ Test wallet connect (should load from DB)

## Rollback
If something goes wrong:
```javascript
// In MongoDB shell
use nft_marketplace
db.nft_metadata.drop()
```

## Next steps
After successful migration:
1. Test wallet NFT loading (should be instant from DB)
2. Test background sync (POST `/api/user/nfts/sync`)
3. Update marketplace sync service to use `nft_metadata`
4. Monitor performance improvements
