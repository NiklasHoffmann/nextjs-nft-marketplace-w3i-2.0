/**
 * BuyerWhitelistFacet ABI
 *
 * Complete ABI for the BuyerWhitelistFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0x1b0Dc3BD49A8bd493387bb49376212B9b0A9A64f
 *
 * Deployed:
 * - Sepolia: 0x1b0Dc3BD49A8bd493387bb49376212B9b0A9A64f
 * - Mainnet: TODO
 */

export const BUYER_WHITELIST_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "BuyerWhitelist__EmptyCalldata", inputs: [] },
  {
    type: "error",
    name: "BuyerWhitelist__ExceedsMaxBatchSize",
    inputs: [{ internalType: "uint256", name: "batchSize", type: "uint256" }]
  },
  { type: "error", name: "BuyerWhitelist__ListingDoesNotExist", inputs: [] },
  { type: "error", name: "BuyerWhitelist__NotAuthorizedOperator", inputs: [] },
  {
    type: "error",
    name: "BuyerWhitelist__SellerIsNotERC1155Owner",
    inputs: [{ internalType: "address", name: "seller", type: "address" }]
  },
  {
    type: "error",
    name: "BuyerWhitelist__SellerIsNotERC721Owner",
    inputs: [
      { internalType: "address", name: "seller", type: "address" },
      { internalType: "address", name: "owner", type: "address" }
    ]
  },
  { type: "error", name: "BuyerWhitelist__ZeroAddress", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "BuyerRemovedFromWhitelist",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" }
    ]
  },
  {
    type: "event",
    name: "BuyerWhitelisted",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" }
    ]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "addBuyerWhitelistAddresses",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "address[]", name: "allowedBuyers", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "removeBuyerWhitelistAddresses",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "address[]", name: "disallowedBuyers", type: "address[]" }
    ],
    outputs: []
  }
] as const;
