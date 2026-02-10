/**
 * DiamondCut ABI
 *
 * Standard EIP-2535 diamondCut signature.
 * Contract: https://sepolia.etherscan.io/address/0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC
 *
 * Deployed:
 * - Sepolia: 0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC
 * - Mainnet: TODO
 */

export const DIAMOND_CUT_ABI = [
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "diamondCut",
    stateMutability: "nonpayable",
    inputs: [
      {
        type: "tuple[]",
        name: "_diamondCut",
        components: [
          { name: "facetAddress", type: "address" },
          { name: "action", type: "uint8" },
          { name: "functionSelectors", type: "bytes4[]" }
        ]
      },
      { type: "address", name: "_init" },
      { type: "bytes", name: "_calldata" }
    ],
    outputs: []
  }
] as const;
