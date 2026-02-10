/**
 * CollectionWhitelistFacet ABI
 *
 * Complete ABI for the CollectionWhitelistFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0x1eeDB782151377AC05d61EecC3Bdf4ECCbf3B298
 *
 * Deployed:
 * - Sepolia: 0x1eeDB782151377AC05d61EecC3Bdf4ECCbf3B298
 * - Mainnet: TODO
 */

export const COLLECTION_WHITELIST_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "CollectionWhitelist__AlreadyWhitelisted", inputs: [] },
  { type: "error", name: "CollectionWhitelist__NotWhitelisted", inputs: [] },
  { type: "error", name: "CollectionWhitelist__ZeroAddress", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "CollectionAddedToWhitelist",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "tokenAddress", type: "address" }]
  },
  {
    type: "event",
    name: "CollectionRemovedFromWhitelist",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "tokenAddress", type: "address" }]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "addWhitelistedCollection",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "tokenAddress", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "batchAddWhitelistedCollections",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address[]", name: "tokenAddresses", type: "address[]" }],
    outputs: []
  },
  {
    type: "function",
    name: "batchRemoveWhitelistedCollections",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address[]", name: "tokenAddresses", type: "address[]" }],
    outputs: []
  },
  {
    type: "function",
    name: "removeWhitelistedCollection",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "tokenAddress", type: "address" }],
    outputs: []
  }
] as const;
