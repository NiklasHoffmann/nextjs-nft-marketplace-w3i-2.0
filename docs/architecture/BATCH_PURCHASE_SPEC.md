# Batch Purchase Contract Spec

## Overview

This document defines a batch purchase function for the Ideation Market contract. The goal is to allow a buyer to purchase multiple listings in one transaction while preserving the existing validation rules and events.

## Goals

- Enable a single transaction to purchase multiple listings.
- Keep behavior consistent with the existing `purchaseListing` function.
- Support native ETH and ERC20 payments.
- Emit the same purchase events per item.

## Non-Goals (for v1)

- No swap listings in batch (only pure sale listings).
- No partial ERC1155 purchases in batch (full quantity only).
- No partial success mode (atomic behavior only).

If swaps or partial ERC1155 should be supported, we can extend the struct and add a separate function.

## Proposed Function

### Solidity Signature (proposed)

```solidity
struct BatchPurchaseItem {
    uint256 listingId;
    uint256 expectedPrice;
    address expectedCurrency; // address(0) for ETH
    uint256 expectedErc1155Quantity; // 0 for ERC721
    uint256 erc1155PurchaseQuantity; // 0 for ERC721
    address expectedDesiredTokenAddress; // address(0) for no swap
    uint256 expectedDesiredTokenId; // 0 for no swap
    uint256 expectedDesiredErc1155Quantity; // 0 for no swap
    address desiredErc1155Holder; // address(0) for no swap
}

function purchaseListings(BatchPurchaseItem[] calldata items) external payable;
```

### Behavior

- For each item, the function performs the same validation as `purchaseListing`.
- The function reverts if ANY item fails (atomic batch).
- The total ETH sent must equal the sum of ETH-priced items.
- ERC20 approvals are required for any ERC20-priced items.
- Only listings with listingType `PURE_ETH` or `SWAP_AND_ETH`? For v1, restrict to pure sales (no swaps).

### Validation Rules

- Listing exists and is active.
- Buyer is not seller.
- Expected price and currency match listing.
- Buyer whitelist rules are enforced.
- For ERC1155, quantity rules are enforced (v1: require full quantity).

### Events

- Emit the same `ListingPurchased` event per item.
- Optionally emit a `BatchPurchase` event with summary data.

## Gas and Limits

- Add a max batch size, e.g. `uint16 maxBatchSize` (config or constant).
- Consider `require(items.length > 0)` and `items.length <= maxBatchSize`.
- Include a fast revert for mixed currencies if ETH total does not match `msg.value`.

## Frontend Integration Notes

- Client will build the array from cart items.
- For ETH items, sum `expectedPrice` and pass as `msg.value`.
- For ERC20 items, ensure allowance for the total amount per token.
- For v1, only include listings with no swap and full-quantity ERC1155.

## Backend/Indexing Notes

- No new indexing required if existing `ListingPurchased` events are emitted.
- If a `BatchPurchase` event is added, update indexer to ignore or log it.

## Open Questions

- Should the batch support swap listings?
- Should it allow partial success (skip failures) instead of atomic behavior?
- Should there be a separate function for ERC1155 partial buys?

## Reference

Existing purchase function: `purchaseListing` in `ideation-market-facet` ABI.
