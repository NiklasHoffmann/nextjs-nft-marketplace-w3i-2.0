# Scripts Directory

This directory contains scripts for data synchronization, database maintenance, and development tools.

## 🚀 Production Scripts

### Main Sync Script
```bash
node scripts/sync-marketplace-data.js
```
**Purpose**: Synchronizes NFT data from TheGraph → Blockchain → IPFS → MongoDB
- Fetches marketplace events from TheGraph subgraph
- Retrieves contract data (owner, tokenURI, approval) via viem
- Parses metadata from IPFS
- Loads insights from admin_nft_insights collection
- Updates marketplace_items collection
- Auto-start on server boot (production)

**Status**: ✅ Active - 61 NFTs synced

### Database Setup
```bash
node scripts/create-indexes.js
```
**Purpose**: Creates MongoDB indexes for optimal query performance
- Run after schema changes
- Improves marketplace queries

```bash
node scripts/migrate-nft-stats.js
```
**Purpose**: Initializes/migrates nft_stats collection
- Run once when setting up stats system
- Creates initial stats documents from user interactions

## 🧪 Development Scripts

Located in `scripts/dev/`:

### Testing
```bash
node scripts/dev/test-sort.js          # Test MongoDB numerical sorting
node scripts/dev/test-api-direct.js    # Test API endpoints
node scripts/dev/test-subgraph.js      # Test TheGraph queries
```

### Verification
```bash
node scripts/dev/check-data-structure.js     # Inspect MongoDB documents
node scripts/dev/check-nft-stats.js          # Verify stats collection
node scripts/dev/verify-stats-separation.js  # Verify data separation
```

### Development Utilities
```bash
node scripts/dev/add-test-stats.js     # Add test stats data
```

## 🛠️ Maintenance Scripts

Located in `scripts/maintenance/`:

```bash
node scripts/maintenance/cleanup-duplicate-interactions.ts  # Remove duplicate user interactions
node scripts/maintenance/cleanup-orphaned.js                # Remove orphaned data
node scripts/maintenance/fix-negative-stats.js              # Fix negative stat values
```

## 📦 Archive

All obsolete scripts have been moved to `scripts/archive/`:
- `archive/old-sync/` - Old synchronization scripts (replaced by sync-marketplace-data.js)
- `archive/old-migrations/` - Applied migration scripts (already executed)
- `archive/debug-check/` - Old debug/check scripts (superseded)
- `archive/old-tests/` - Old test scripts (no longer needed)
- `archive/refactor/` - PowerShell refactoring scripts (already applied)
- `archive/fixes/` - One-time fix scripts (already applied)

## 📋 Script Organization

### Essential (Keep)
- ✅ `sync-marketplace-data.js` - Main production sync
- ✅ `create-indexes.js` - Database indexes
- ✅ `migrate-nft-stats.js` - Stats migration

### Development (Keep)
- ✅ `dev/` folder - Testing and verification tools

### Maintenance (Keep if needed)
- ⚠️ `maintenance/` folder - Cleanup and fix scripts

### Archive (Reference only)
- 📦 `archive/` folder - Obsolete scripts for reference

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Sync marketplace data | `node scripts/sync-marketplace-data.js` |
| Create DB indexes | `node scripts/create-indexes.js` |
| Migrate stats | `node scripts/migrate-nft-stats.js` |
| Test price sorting | `node scripts/dev/test-sort.js` |
| Check data structure | `node scripts/dev/check-data-structure.js` |
| Verify stats | `node scripts/dev/check-nft-stats.js` |

## 🔄 Auto-Sync (Production)

The main sync script runs automatically on server boot via:
- Node.js: Server startup hook
- Polling interval: 30 seconds
- Status: ✅ Active

## 📚 Documentation

See `SCRIPTS_OVERVIEW.md` for detailed script descriptions and categorization.
