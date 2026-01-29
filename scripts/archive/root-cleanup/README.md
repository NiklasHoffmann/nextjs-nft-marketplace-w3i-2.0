# Root Cleanup Archive

This directory contains scripts and files that were previously in the project root.
They have been archived to maintain a clean root structure following senior-level best practices.

## Archived Files (January 29, 2026)

### Test/Debug Scripts
- `analyze-local-abi.js` - Local ABI analysis tool
- `check-all-events.js` - Event verification script
- `check-token-events.js` - Token event checker
- `test-category-filter.js` - Category filter testing
- `test-collectibles.js` - Collectibles testing
- `test-event-sig.js` - Event signature verification
- `verify-signature.js` - Signature verification utility

### Contract ABIs
- `deployed-abi.json` - Deployed contract ABI snapshot
- `etherscan-abi.json` - Etherscan ABI fetch result

### Script
- `fetch-etherscan-abi.js` - Etherscan ABI fetching utility

## Why Archived?

These files served their purpose during development but are no longer needed in the root:

1. **Test scripts** have been replaced by organized scripts in `scripts/dev/`
2. **ABI files** are now managed in `src/config/abis/`
3. **Root directory** should only contain essential config files

## Active Alternatives

If you need similar functionality:

- **Testing**: Use `scripts/dev/` organized test scripts
- **ABI Management**: Check `src/config/abis/` for current contract ABIs
- **Event Testing**: Use `scripts/dev/test-subgraph.js` or similar

## Recovery

If you need any of these files, they're preserved here and in git history.
