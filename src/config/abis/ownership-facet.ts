/**
 * OwnershipFacet ABI
 *
 * Complete ABI for the OwnershipFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0x1dEEE0f8e73a19E31c49D51419C47e15f48667f9
 *
 * Deployed:
 * - Sepolia: 0x1dEEE0f8e73a19E31c49D51419C47e15f48667f9
 * - Mainnet: TODO
 */

export const OWNERSHIP_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "Ownership__CallerIsNotThePendingOwner", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "OwnershipTransferInitiated",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" }
    ]
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" }
    ]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "acceptOwnership",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  // ============================================================================
  // Read Functions
  // ============================================================================
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address", name: "", type: "address" }]
  },
  {
    type: "function",
    name: "transferOwnership",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    outputs: []
  }
] as const;
