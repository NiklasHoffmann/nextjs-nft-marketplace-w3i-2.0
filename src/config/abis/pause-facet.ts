/**
 * PauseFacet ABI
 *
 * Complete ABI for the PauseFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0xc39f8c071668Eea19392F1Ea3AC7fe8A5391b4b3
 *
 * Deployed:
 * - Sepolia: 0xc39f8c071668Eea19392F1Ea3AC7fe8A5391b4b3
 * - Mainnet: TODO
 */

export const PAUSE_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "Pause__AlreadyPaused", inputs: [] },
  { type: "error", name: "Pause__NotPaused", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "Paused",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "triggeredBy", type: "address" }]
  },
  {
    type: "event",
    name: "Unpaused",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "triggeredBy", type: "address" }]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
] as const;
