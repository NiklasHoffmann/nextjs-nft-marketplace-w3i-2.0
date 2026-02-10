/**
 * VersionFacet ABI
 *
 * Complete ABI for the VersionFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0xeDD15c75a980da4eD70F609c30F8E73bCDBdd186
 *
 * Deployed:
 * - Sepolia: 0xeDD15c75a980da4eD70F609c30F8E73bCDBdd186
 * - Mainnet: TODO
 */

export const VERSION_FACET_ABI = [
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "VersionUpdated",
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "version", type: "string" },
      { indexed: true, internalType: "bytes32", name: "implementationId", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "setVersion",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "string", name: "newVersion", type: "string" },
      { internalType: "bytes32", name: "newImplementationId", type: "bytes32" }
    ],
    outputs: []
  }
] as const;
