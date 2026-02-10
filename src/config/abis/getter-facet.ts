/**
 * GetterFacet ABI
 *
 * Complete ABI for the GetterFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0xb42c109A61Cb882B11bb7E98B9A0302C3E486327
 *
 * Deployed:
 * - Sepolia: 0xb42c109A61Cb882B11bb7E98B9A0302C3E486327
 * - Mainnet: TODO
 */

export const GETTER_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  {
    type: "error",
    name: "Getter__ListingNotFound",
    inputs: [{ internalType: "uint128", name: "listingId", type: "uint128" }]
  },
  // ============================================================================
  // Read Functions
  // ============================================================================
  {
    type: "function",
    name: "getActiveListingIdByERC721",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" }
    ],
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }]
  },
  {
    type: "function",
    name: "getAllowedCurrencies",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address[]", name: "currencies", type: "address[]" }]
  },
  {
    type: "function",
    name: "getBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getBuyerWhitelistMaxBatchSize",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint16", name: "maxBatchSize", type: "uint16" }]
  },
  {
    type: "function",
    name: "getContractOwner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address", name: "", type: "address" }]
  },
  {
    type: "function",
    name: "getImplementationId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "getInnovationFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint32", name: "innovationFee", type: "uint32" }]
  },
  {
    type: "function",
    name: "getListingByListingId",
    stateMutability: "view",
    inputs: [{ internalType: "uint128", name: "listingId", type: "uint128" }],
    outputs: [
      {
        internalType: "struct Listing",
        name: "listing",
        type: "tuple",
        components: [
          { internalType: "uint128", name: "listingId", type: "uint128" },
          { internalType: "uint32", name: "feeRate", type: "uint32" },
          { internalType: "bool", name: "buyerWhitelistEnabled", type: "bool" },
          { internalType: "bool", name: "partialBuyEnabled", type: "bool" },
          { internalType: "address", name: "tokenAddress", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "erc1155Quantity", type: "uint256" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "currency", type: "address" },
          { internalType: "address", name: "desiredTokenAddress", type: "address" },
          { internalType: "uint256", name: "desiredTokenId", type: "uint256" },
          { internalType: "uint256", name: "desiredErc1155Quantity", type: "uint256" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getNextListingId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }]
  },
  {
    type: "function",
    name: "getPendingOwner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address", name: "", type: "address" }]
  },
  {
    type: "function",
    name: "getPreviousVersion",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "string", name: "version", type: "string" },
      { internalType: "bytes32", name: "implementationId", type: "bytes32" },
      { internalType: "uint256", name: "timestamp", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getVersion",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "string", name: "version", type: "string" },
      { internalType: "bytes32", name: "implementationId", type: "bytes32" },
      { internalType: "uint256", name: "timestamp", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getVersionString",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "string", name: "", type: "string" }]
  },
  {
    type: "function",
    name: "getWhitelistedCollections",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }]
  },
  {
    type: "function",
    name: "isBuyerWhitelisted",
    stateMutability: "view",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "address", name: "buyer", type: "address" }
    ],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "isCollectionWhitelisted",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "collection", type: "address" }],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "isCurrencyAllowed",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "currency", type: "address" }],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "isPaused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  }
] as const;
