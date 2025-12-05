# Scripts Overview

## 📋 Production Scripts (ESSENTIAL - KEEP)

### Data Synchronization
- **`sync-marketplace-data.js`** ⭐ MAIN PRODUCTION SCRIPT
  - Syncs NFT data from TheGraph → Blockchain → IPFS → MongoDB
  - Fetches contract data, metadata, and insights
  - Auto-start on server boot
  - Status: ✅ Active (61 NFTs synced)

### Database Maintenance
- **`create-indexes.js`**
  - Creates MongoDB indexes for performance
  - Should run after schema changes
  - Status: ✅ Keep for performance

- **`migrate-nft-stats.js`**
  - Migrates/initializes nft_stats collection
  - Run once when setting up stats
  - Status: ✅ Keep for migrations

## 🧪 Development & Testing (KEEP - USEFUL)

### Testing & Verification
- **`test-sort.js`**
  - Tests MongoDB numerical sorting
  - Useful for verifying price sorting
  - Status: ✅ Keep

- **`check-data-structure.js`**
  - Inspects MongoDB document structure
  - Useful for debugging
  - Status: ✅ Keep

- **`check-nft-stats.js`**
  - Verifies nft_stats collection data
  - Status: ✅ Keep

- **`verify-stats-separation.js`**
  - Verifies marketplace_items vs nft_stats separation
  - Status: ✅ Keep

### Development Tools (dev/)
- **`dev/test-api-direct.js`** - Test API endpoints directly
- **`dev/test-subgraph.js`** - Test TheGraph queries
- **`dev/add-test-stats.js`** - Add test stats data

## 🗑️ Deprecated/Obsolete Scripts (CAN DELETE)

### Old Sync Scripts (replaced by sync-marketplace-data.js)
- ❌ `sync-marketplace-metadata.js` - Old metadata sync
- ❌ `sync-marketplace-metadata-clean.js` - Old metadata sync variant
- ❌ `sync-metadata.js` - Generic metadata sync
- ❌ `sync-real-metadata.js` - Real metadata sync
- ❌ `sync-contract-data.js` - Contract data sync (now integrated)
- ❌ `sync-stats-insights.js` - Stats/insights sync (now integrated)
- ❌ `enrich-all-nfts.js` - Old enrichment script
- ❌ `enrich-with-enhanced-data.js` - Enhanced enrichment
- ❌ `quick-enrich-metadata.js` - Quick enrichment
- ❌ `reload-metadata-contract.js` - Reload metadata

### Old Migration Scripts (already applied)
- ❌ `migrate-add-listingId.js` - Add listingId field (done)
- ❌ `migrate-insights-to-marketplace.js` - Migrate insights (done)
- ❌ `migrate-price-to-number.js` - Convert prices to numbers (done)
- ❌ `remove-stats-from-marketplace.js` - Stats separation (done)

### Debug/Check Scripts (many duplicates)
- ❌ `check-all-insights.js` - Check insights
- ❌ `check-approvals.js` - Check approvals
- ❌ `check-approved-addresses.js` - Check approved addresses
- ❌ `check-approved-in-db.js` - Check approved in DB
- ❌ `check-collection-insights.js` - Collection insights
- ❌ `check-contract-data.js` - Contract data
- ❌ `check-db-types.js` - DB types
- ❌ `check-db.js` - Generic DB check
- ❌ `check-erc721-abi.js` - ERC721 ABI
- ❌ `check-insights-data.js` - Insights data
- ❌ `check-invalid-markings.js` - Invalid markings
- ❌ `check-metadata-status.js` - Metadata status
- ❌ `check-mongo-count.js` - Mongo count
- ❌ `check-progress.js` - Check progress
- ❌ `check-specific-doc.js` - Specific document
- ❌ `check-stats-insights.js` - Stats insights
- ❌ `check-top-items.js` - Top items
- ❌ `check-user-actions.js` - User actions
- ❌ `simple-db-check.js` - Simple DB check
- ❌ `debug-contract-calls.js` - Debug contract calls
- ❌ `debug-query.js` - Debug query
- ❌ `list-collections.js` - List collections
- ❌ `verify-data.js` - Verify data

### Old Fix Scripts (already applied)
- ❌ `apply-collection-insights.js` - Apply insights
- ❌ `fix-contract-data.js` - Fix contract data
- ❌ `mark-invalid-listings.js` - Mark invalid
- ❌ `validate-listings.js` - Validate listings
- ❌ `fixes/fix-missing-parens.js` - Fix syntax

### Cleanup Scripts (one-time use)
- ❌ `clean-mock-data.js` - Clean mock data
- ❌ `drop-old-collection.js` - Drop old collection
- ❌ `remove-duplicates.js` - Remove duplicates
- ❌ `update-index.js` - Update index

### Test/Seed Scripts (not needed in production)
- ❌ `seed-test-data.js` - Seed test data
- ❌ `test-enhanced-enrichment.ts` - Test enrichment
- ❌ `test-erc721-abi.js` - Test ABI
- ❌ `test-poll.js` - Test polling
- ❌ `test-sync.js` - Test sync

### Old Sync Patterns (deprecated)
- ❌ `continuous-metadata-sync.js` - Continuous sync (use cron instead)
- ❌ `sync-like-count.js` - Sync likes (now in nft_stats)
- ❌ `warm-image-cache.js` - Image cache warming

### Maintenance Scripts (keep if needed later)
- ⚠️ `maintenance/cleanup-duplicate-interactions.ts` - Cleanup duplicates
- ⚠️ `maintenance/cleanup-orphaned.js` - Cleanup orphaned data
- ⚠️ `maintenance/fix-negative-stats.js` - Fix negative stats

### Refactor Scripts (PowerShell - used during refactoring)
- ❌ `refactor/*.ps1` - All refactoring scripts (already applied)

## 📊 Summary

**Total Scripts**: ~70+
**Keep (Essential)**: 5-10
**Keep (Useful)**: 10-15
**Can Delete**: 50+

## 🎯 Recommended Action Plan

1. **Move to Archive** (create `scripts/archive/` folder):
   - All deprecated sync scripts
   - All old migration scripts
   - All debug/check duplicates
   - All refactor scripts

2. **Keep in Root** (organized):
   ```
   scripts/
   ├── sync-marketplace-data.js          # Main sync
   ├── create-indexes.js                 # DB indexes
   ├── migrate-nft-stats.js             # Stats migration
   └── README.md                         # Scripts guide
   ```

3. **Keep in dev/** (testing):
   ```
   scripts/dev/
   ├── test-api-direct.js
   ├── test-subgraph.js
   ├── test-sort.js
   ├── check-data-structure.js
   └── check-nft-stats.js
   ```

4. **Keep in maintenance/** (if needed):
   ```
   scripts/maintenance/
   ├── cleanup-duplicate-interactions.ts
   ├── cleanup-orphaned.js
   └── fix-negative-stats.js
   ```

5. **Delete or Archive Everything Else**
