/**
 * DummyUpgradeFacet ABI
 *
 * Complete ABI for the DummyUpgradeFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0xac16c19629d6b25FD8291e8E690288dF93080EE5
 *
 * Deployed:
 * - Sepolia: 0xac16c19629d6b25FD8291e8E690288dF93080EE5
 * - Mainnet: TODO
 */

export const DUMMY_UPGRADE_FACET_ABI = [
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "DummyUpgradeValueSet",
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "value", type: "uint256" }]
  },
  // ============================================================================
  // Read Functions
  // ============================================================================
  {
    type: "function",
    name: "getDummyUpgradeValue",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "setDummyUpgradeValue",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
    outputs: []
  }
] as const;
