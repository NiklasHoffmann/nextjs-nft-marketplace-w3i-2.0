/**
 * DiamondUpgradeFacet ABI
 *
 * Complete ABI for the DiamondUpgradeFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0xDA227064DadE08d65d1880488B368B1A73AAA489
 *
 * Deployed:
 * - Sepolia: 0xDA227064DadE08d65d1880488B368B1A73AAA489
 * - Mainnet: TODO
 */

export const DIAMOND_UPGRADE_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  {
    type: "error",
    name: "CannotAddFunctionToDiamondThatAlreadyExists",
    inputs: [{ internalType: "bytes4", name: "_selector", type: "bytes4" }]
  },
  {
    type: "error",
    name: "CannotRemoveFunctionThatDoesNotExist",
    inputs: [{ internalType: "bytes4", name: "_selector", type: "bytes4" }]
  },
  {
    type: "error",
    name: "CannotRemoveImmutableFunction",
    inputs: [{ internalType: "bytes4", name: "_selector", type: "bytes4" }]
  },
  {
    type: "error",
    name: "CannotReplaceFunctionThatDoesNotExist",
    inputs: [{ internalType: "bytes4", name: "_selector", type: "bytes4" }]
  },
  {
    type: "error",
    name: "CannotReplaceFunctionWithTheSameFacet",
    inputs: [{ internalType: "bytes4", name: "_selector", type: "bytes4" }]
  },
  {
    type: "error",
    name: "CannotReplaceImmutableFunction",
    inputs: [{ internalType: "bytes4", name: "_selector", type: "bytes4" }]
  },
  {
    type: "error",
    name: "DelegateCallReverted",
    inputs: [
      { internalType: "address", name: "_delegate", type: "address" },
      { internalType: "bytes", name: "_functionCall", type: "bytes" }
    ]
  },
  {
    type: "error",
    name: "NoBytecodeAtAddress",
    inputs: [{ internalType: "address", name: "_contractAddress", type: "address" }]
  },
  {
    type: "error",
    name: "NoSelectorsProvidedForFacet",
    inputs: [{ internalType: "address", name: "_facet", type: "address" }]
  },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "DiamondDelegateCall",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_delegate", type: "address" },
      { indexed: false, internalType: "bytes", name: "_functionCall", type: "bytes" }
    ]
  },
  {
    type: "event",
    name: "DiamondFunctionAdded",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes4", name: "_selector", type: "bytes4" },
      { indexed: true, internalType: "address", name: "_facet", type: "address" }
    ]
  },
  {
    type: "event",
    name: "DiamondFunctionRemoved",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes4", name: "_selector", type: "bytes4" },
      { indexed: true, internalType: "address", name: "_oldFacet", type: "address" }
    ]
  },
  {
    type: "event",
    name: "DiamondFunctionReplaced",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes4", name: "_selector", type: "bytes4" },
      { indexed: true, internalType: "address", name: "_oldFacet", type: "address" },
      { indexed: true, internalType: "address", name: "_newFacet", type: "address" }
    ]
  },
  {
    type: "event",
    name: "DiamondMetadata",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "_tag", type: "bytes32" },
      { indexed: false, internalType: "bytes", name: "_data", type: "bytes" }
    ]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "upgradeDiamond",
    stateMutability: "nonpayable",
    inputs: [
      {
        internalType: "struct IDiamondUpgradeFacet.FacetFunctions[]",
        name: "_addFunctions",
        type: "tuple[]",
        components: [
          { internalType: "address", name: "facet", type: "address" },
          { internalType: "bytes4[]", name: "selectors", type: "bytes4[]" }
        ]
      },
      {
        internalType: "struct IDiamondUpgradeFacet.FacetFunctions[]",
        name: "_replaceFunctions",
        type: "tuple[]",
        components: [
          { internalType: "address", name: "facet", type: "address" },
          { internalType: "bytes4[]", name: "selectors", type: "bytes4[]" }
        ]
      },
      { internalType: "bytes4[]", name: "_removeFunctions", type: "bytes4[]" },
      { internalType: "address", name: "_delegate", type: "address" },
      { internalType: "bytes", name: "_functionCall", type: "bytes" },
      { internalType: "bytes32", name: "_tag", type: "bytes32" },
      { internalType: "bytes", name: "_metadata", type: "bytes" }
    ],
    outputs: []
  }
] as const;
