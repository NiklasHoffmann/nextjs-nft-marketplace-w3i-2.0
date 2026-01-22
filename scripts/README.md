# Scripts Directory

Professional script organization for the NFT Marketplace.

## 📁 Directory Structure

```
scripts/
├── production/          # Production-ready scripts
├── dev/                # Development & testing tools
├── utils/              # Utility scripts
├── maintenance/        # Maintenance & cleanup
├── lib/                # Shared libraries
└── archive/            # Historical scripts (reference only)
```

## 🚀 Production Scripts

Located in [`production/`](./production/)

### Main Synchronization
- **`sync-marketplace-data.js`** ⭐ **MAIN PRODUCTION SCRIPT**
  ```bash
  node scripts/production/sync-marketplace-data.js
  ```
  - Syncs NFT data: TheGraph → Blockchain → IPFS → MongoDB
  - Auto-start on server boot (production)
  - Status: ✅ Active (61 NFTs synced)

- **`start-sync.mjs`** / **`start-sync.ts`**
  - Entry points for starting the sync service
  - Used by server instrumentation

- **`sync-collections.ts`**
  - Syncs collection-level data and statistics
  - Aggregates marketplace insights

### Database Management
- **`create-indexes.js`**
  ```bash
  node scripts/production/create-indexes.js
  ```
  - Creates MongoDB indexes for optimal query performance
  - Run after schema changes

- **`create-cart-indexes.js`**
  - Creates cart-specific indexes
  - Run once for cart feature setup

- **`migrate-nft-stats.js`**
  ```bash
  node scripts/production/migrate-nft-stats.js
  ```
  - Initializes/migrates nft_stats collection
  - Run once when setting up stats system

## 🧪 Development Scripts

Located in [`dev/`](./dev/)

### Testing
- **`test-api-direct.js`** - Direct API endpoint testing
- **`test-subgraph.js`** - TheGraph query testing
- **`test-sort.js`** - MongoDB sorting verification

### Verification
- **`check-data-structure.js`** - Inspect MongoDB documents
- **`check-nft-stats.js`** - Verify nft_stats collection
- **`check-full-schema.js`** - Full schema validation
- **`verify-stats-separation.js`** - Data separation audit

### Seeding
- **`add-test-stats.js`** - Add test statistics data
- **`seed-test-data.ts`** - Seed test marketplace data
- **`setup-indexes.ts`** - Setup development indexes

## 🛠️ Utility Scripts

Located in [`utils/`](./utils/)

- **`calc-selector.js`** - Calculate function selectors
- **`compare-abi.js`** - Compare ABI files
- **`find-signature.js`** - Find function signatures

## 🔧 Maintenance Scripts

Located in [`maintenance/`](./maintenance/)

```bash
node scripts/maintenance/<script-name>
```

- **`cleanup-duplicate-interactions.ts`** - Remove duplicate user interactions
- **`cleanup-orphaned.js`** - Remove orphaned data
- **`fix-negative-stats.js`** - Fix negative stat values

## 📦 Shared Libraries

Located in [`lib/`](./lib/)

- **`sync-helpers.js`** - Shared synchronization utilities

## 📚 Archive

Located in [`archive/`](./archive/)

Historical scripts kept for reference only:
- `archive/check-scripts/` - Debug/check scripts (one-time use)
- `archive/migrations/` - Applied migration scripts
- `archive/fixes/` - Applied fix scripts
- `archive/tests/` - Old test scripts

**⚠️ These scripts are NOT maintained and may not work with current codebase.**

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Start sync service** | `node scripts/production/sync-marketplace-data.js` |
| **Create DB indexes** | `node scripts/production/create-indexes.js` |
| **Migrate stats** | `node scripts/production/migrate-nft-stats.js` |
| **Test API** | `node scripts/dev/test-api-direct.js` |
| **Check data** | `node scripts/dev/check-data-structure.js` |
| **Cleanup duplicates** | `node scripts/maintenance/cleanup-duplicate-interactions.ts` |

## 📋 Best Practices

### For Production Scripts
- ✅ Always test in development first
- ✅ Check MongoDB connection before running
- ✅ Monitor logs for errors
- ✅ Use environment variables from `.env.local`

### For Development Scripts
- Run in non-production environment
- Safe to experiment and modify
- Create backups before testing cleanup scripts

### For Maintenance Scripts
- ⚠️ Run with caution in production
- Always create database backups first
- Test on staging environment when possible

## 🔍 Finding Scripts

Use these commands to quickly find scripts:

```bash
# List all production scripts
ls scripts/production/

# List all dev scripts
ls scripts/dev/

# Search for specific functionality
grep -r "function name" scripts/
```

## 📝 Adding New Scripts

When adding new scripts:

1. **Determine the correct location:**
   - Production-critical → `production/`
   - Testing/debugging → `dev/`
   - One-time maintenance → `maintenance/`
   - Utilities → `utils/`

2. **Follow naming conventions:**
   - Verbs first: `sync-`, `create-`, `migrate-`, `check-`, `test-`
   - Clear purpose: `sync-marketplace-data.js` not `sync.js`

3. **Add documentation:**
   - Comment header with purpose
   - Update this README
   - Add usage examples

4. **Include error handling:**
   - MongoDB connection errors
   - Environment variable checks
   - Graceful failures

## 🆘 Troubleshooting

### MongoDB Connection Issues
Check MongoDB connection in development environment first.

### Sync Issues
Monitor logs in production/sync-marketplace-data.js output.

### Missing Environment Variables
Ensure `.env.local` contains:
- `MONGODB_URI`
- `THEGRAPH_URL`
- `ALCHEMY_API_KEY`
- `RPC_URL`

## 📖 Related Documentation

- [ORGANIZATION_SUMMARY.md](./ORGANIZATION_SUMMARY.md) - Reorganization notes
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) - Development guide
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture

---

**Last Updated:** January 19, 2026  
**Status:** Reorganization Complete ✅
