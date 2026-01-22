# Database Documentation

MongoDB setup, troubleshooting, and schema documentation.

## Contents

### [Quick Fix Guide](./quick-fix.md)
Fast solutions for common MongoDB connection issues.

**Topics:**
- IP whitelist configuration
- Connection string setup
- Network diagnostics
- 2-minute fixes

### [Troubleshooting Guide](./troubleshooting.md)
Comprehensive MongoDB troubleshooting.

**Topics:**
- Connection errors
- Authentication issues
- Network problems
- Performance optimization
- Index management
- Deployment issues

### [Database Schemas](./schemas/)
JSON schema definitions for all MongoDB collections.

**Files:**
- `mongodb-collections.json` - Collection structure
- `nft-data-schema.json` - NFT data model
- `nft-display-fields.json` - Display field mappings
- `data-source-mapping.json` - Data source configuration

## Collections Overview

### **nft_metadata**
Central source of truth for all NFT data:
- Metadata (name, image, description, attributes)
- Contract info (name, symbol, totalSupply)
- Ownership history with transfer tracking
- Insights (category, rarity, tags)
- Last sync timestamp

### **marketplace_items**
Listing-specific data only:
- Price, seller, buyer
- Listing status (active, sold, cancelled)
- Listing type (sale, swap)
- References nft_metadata via nftAddress+tokenId

### **nft_stats**
User interaction data:
- View count, favorite count, watchlist count
- Average rating, rating count
- Per-user interactions

## Quick Links

- **Main Docs**: [../README.md](../README.md)
- **Architecture**: [../architecture/overview.md](../architecture/overview.md)
- **API Routes**: [../api/routes.md](../api/routes.md)
