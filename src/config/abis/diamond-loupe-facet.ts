/**
 * DiamondLoupeFacet ABI
 *
 * Complete ABI for the DiamondLoupeFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0x16D2e785ec9f270C8e0CdB6dc0Ca0f0f9646610C
 *
 * Deployed:
 * - Sepolia: 0x16D2e785ec9f270C8e0CdB6dc0Ca0f0f9646610C
 * - Mainnet: TODO
 */

export const DIAMOND_LOUPE_FACET_ABI = [
  // ============================================================================
  // Read Functions
  // ============================================================================
  {
    type: "function",
    name: "facetAddress",
    stateMutability: "view",
    inputs: [{ internalType: "bytes4", name: "_functionSelector", type: "bytes4" }],
    outputs: [{ internalType: "address", name: "facetAddress_", type: "address" }]
  },
  {
    type: "function",
    name: "facetAddresses",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address[]", name: "facetAddresses_", type: "address[]" }]
  },
  {
    type: "function",
    name: "facetFunctionSelectors",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "_facet", type: "address" }],
    outputs: [{ internalType: "bytes4[]", name: "facetFunctionSelectors_", type: "bytes4[]" }]
  },
  {
    type: "function",
    name: "facets",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        internalType: "struct IDiamondLoupeFacet.Facet[]",
        name: "facets_",
        type: "tuple[]",
        components: [
          { internalType: "address", name: "facetAddress", type: "address" },
          { internalType: "bytes4[]", name: "functionSelectors", type: "bytes4[]" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "functionFacetPairs",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        internalType: "struct IDiamondInspectFacet.FunctionFacetPair[]",
        name: "pairs",
        type: "tuple[]",
        components: [
          { internalType: "bytes4", name: "selector", type: "bytes4" },
          { internalType: "address", name: "facet", type: "address" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ internalType: "bytes4", name: "_interfaceId", type: "bytes4" }],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  }
] as const;
