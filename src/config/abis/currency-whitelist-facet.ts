/**
 * CurrencyWhitelistFacet ABI
 *
 * Complete ABI for the CurrencyWhitelistFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0xf98025444A70391286e15014023758624754d780
 *
 * Deployed:
 * - Sepolia: 0xf98025444A70391286e15014023758624754d780
 * - Mainnet: TODO
 */

export const CURRENCY_WHITELIST_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "CurrencyWhitelist__AlreadyAllowed", inputs: [] },
  { type: "error", name: "CurrencyWhitelist__NotAllowed", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "CurrencyAllowed",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "currency", type: "address" }]
  },
  {
    type: "event",
    name: "CurrencyRemoved",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "currency", type: "address" }]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "addAllowedCurrency",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "currency", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "removeAllowedCurrency",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "currency", type: "address" }],
    outputs: []
  }
] as const;
