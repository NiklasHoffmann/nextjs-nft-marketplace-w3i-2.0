# Archive Directory

**⚠️ Historical Scripts - Reference Only**

This directory contains scripts that have been archived because they:
- Were used for one-time debugging
- Are migrations that have already been applied
- Fixed issues that no longer exist
- Have been superseded by better implementations

**These scripts are NOT maintained and may not work with the current codebase.**

## 📁 Directory Structure

```
archive/
├── check-scripts/    # One-time debugging scripts
├── migrations/       # Applied database migrations
├── fixes/           # Applied bug fixes
└── tests/           # Superseded test scripts
```

## 🔍 Contents

### Check Scripts (13)
**Purpose:** One-time debugging and verification

Scripts used to diagnose specific issues:
- `check-approved-field.js` - Verified approved field in nft_metadata
- `check-approved-status.js` - Checked approval status
- `check-collections.js` - Collections data verification
- `check-contract-state.js` - Contract state inspection
- `check-diamond-facets.js` - Diamond proxy facets check
- `check-diamond-functions.js` - Diamond functions verification
- `check-listing-blockchain.js` - Blockchain listing verification
- `check-listing-exact.js` - Exact listing match check
- `check-nft-886.js` - Specific NFT debugging
- `check-nft-metadata-approved.js` - Metadata approval check
- `check-nft-owner.js` - Owner verification
- `check-null-tokenids.js` - Null token ID detection
- `check-api-migration-status.js` - API migration progress tracking

**Status:** Issues resolved, no longer needed

### Migrations (3)
**Purpose:** Database schema migrations (already applied)

One-time data transformations:
- `migrate-favoriteCount-to-likeCount.js` - Renamed favorite → like
- `migrate-marketplace-nftAddress.js` - Updated nftAddress field
- `migrate-nft-metadata.js` - Migrated to nft_metadata collection

**Status:** Already executed, kept for reference

### Fixes (5)
**Purpose:** One-time bug fixes

Scripts that fixed specific issues:
- `fix-approved-field.js` - Fixed approved field inconsistencies
- `fix-undefined-contractAddress.js` - Fixed missing contract addresses
- `cleanup-marketplace-duplicates.js` - Removed duplicate listings
- `cleanup-marketplace-items-fields.js` - Cleaned up field inconsistencies
- `update-approved-addresses.js` - Updated approval addresses

**Status:** Issues fixed, scripts no longer needed

### Tests (5)
**Purpose:** Old testing scripts

Superseded or obsolete test scripts:
- `test-api-routes.js` - API route testing (use dev/ scripts now)
- `test-metadata-query.js` - Metadata query testing
- `test-mongodb-connection.mjs` - MongoDB connection test
- `test-sync-security.js` - Sync security testing
- `diagnose-mongodb.mjs` - MongoDB diagnostics

**Status:** Replaced by scripts in dev/ folder

## ⚠️ Important Notes

### Do NOT Use These Scripts

1. **Outdated:** May reference old schemas or collections
2. **Not Maintained:** No updates or bug fixes
3. **May Break:** Could cause data inconsistencies
4. **Superseded:** Better alternatives exist in active directories

### Use Active Scripts Instead

For current operations, use:
- **Production:** `scripts/production/`
- **Development:** `scripts/dev/`
- **Utilities:** `scripts/utils/`
- **Maintenance:** `scripts/maintenance/`

## 📖 Reference Usage

These scripts are kept for:
- **Historical context** - Understanding past issues
- **Reference** - Learning from previous solutions
- **Audit trail** - Documenting what was changed
- **Recovery** - In case old logic is needed

## 🗑️ Cleanup Policy

This directory can be safely deleted if:
- Space is needed
- Historical context is not required
- All migrations are documented elsewhere

Before deletion:
1. Confirm all migrations are documented
2. Verify no dependencies exist
3. Create backup if needed
4. Update ORGANIZATION_SUMMARY.md

## 📋 When to Add to Archive

Move scripts here when they are:
- ✅ One-time use completed
- ✅ Superseded by better implementation
- ✅ No longer compatible with current code
- ✅ Historical reference only

## 🔗 Related Documentation

- [../README.md](../README.md) - Main scripts documentation
- [../ORGANIZATION_SUMMARY.md](../ORGANIZATION_SUMMARY.md) - Reorganization details
- [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System architecture

---

**Last Updated:** January 19, 2026  
**Total Archived Scripts:** 26  
**Status:** Reference Only 📦
