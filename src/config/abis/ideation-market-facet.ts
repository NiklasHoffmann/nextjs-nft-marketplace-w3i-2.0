/**
 * IdeationMarketFacet ABI
 *
 * Complete ABI for the IdeationMarketFacet contract.
 * Contract: https://sepolia.etherscan.io/address/0x6f4e8be1EEaF712a3ff85E7FFe992d21794E790E
 *
 * Deployed:
 * - Sepolia: 0x6f4e8be1EEaF712a3ff85E7FFe992d21794E790E
 * - Mainnet: TODO
 */

export const IDEATION_MARKET_FACET_ABI = [
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "IdeationMarket__AlreadyListed", inputs: [] },
  {
    type: "error",
    name: "IdeationMarket__BuyerNotWhitelisted",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "address", name: "buyer", type: "address" }
    ]
  },
  {
    type: "error",
    name: "IdeationMarket__CollectionNotWhitelisted",
    inputs: [{ internalType: "address", name: "tokenAddress", type: "address" }]
  },
  { type: "error", name: "IdeationMarket__ContractPaused", inputs: [] },
  { type: "error", name: "IdeationMarket__CurrencyNotAllowed", inputs: [] },
  {
    type: "error",
    name: "IdeationMarket__ERC20TokenAddressIsNotAContract",
    inputs: [{ internalType: "address", name: "token", type: "address" }]
  },
  {
    type: "error",
    name: "IdeationMarket__ERC20TransferFailed",
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "receiver", type: "address" }
    ]
  },
  {
    type: "error",
    name: "IdeationMarket__EthTransferFailed",
    inputs: [{ internalType: "address", name: "receiver", type: "address" }]
  },
  { type: "error", name: "IdeationMarket__FreeListingsNotSupported", inputs: [] },
  {
    type: "error",
    name: "IdeationMarket__InsufficientSwapTokenBalance",
    inputs: [
      { internalType: "uint256", name: "required", type: "uint256" },
      { internalType: "uint256", name: "available", type: "uint256" }
    ]
  },
  { type: "error", name: "IdeationMarket__InvalidNoSwapParameters", inputs: [] },
  { type: "error", name: "IdeationMarket__InvalidPurchaseQuantity", inputs: [] },
  { type: "error", name: "IdeationMarket__InvalidUnitPrice", inputs: [] },
  { type: "error", name: "IdeationMarket__ListingTermsChanged", inputs: [] },
  { type: "error", name: "IdeationMarket__NoSwapForSameToken", inputs: [] },
  { type: "error", name: "IdeationMarket__NotApprovedForMarketplace", inputs: [] },
  { type: "error", name: "IdeationMarket__NotAuthorizedOperator", inputs: [] },
  { type: "error", name: "IdeationMarket__NotAuthorizedToCancel", inputs: [] },
  { type: "error", name: "IdeationMarket__NotListed", inputs: [] },
  { type: "error", name: "IdeationMarket__NotSupportedTokenStandard", inputs: [] },
  { type: "error", name: "IdeationMarket__PartialBuyNotPossible", inputs: [] },
  {
    type: "error",
    name: "IdeationMarket__PriceNotMet",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "value", type: "uint256" }
    ]
  },
  { type: "error", name: "IdeationMarket__Reentrant", inputs: [] },
  { type: "error", name: "IdeationMarket__RoyaltyFeeExceedsProceeds", inputs: [] },
  { type: "error", name: "IdeationMarket__SameBuyerAsSeller", inputs: [] },
  {
    type: "error",
    name: "IdeationMarket__SellerInsufficientTokenBalance",
    inputs: [
      { internalType: "uint256", name: "required", type: "uint256" },
      { internalType: "uint256", name: "available", type: "uint256" }
    ]
  },
  {
    type: "error",
    name: "IdeationMarket__SellerNotTokenOwner",
    inputs: [{ internalType: "uint128", name: "listingId", type: "uint128" }]
  },
  { type: "error", name: "IdeationMarket__StillApproved", inputs: [] },
  { type: "error", name: "IdeationMarket__WhitelistDisabled", inputs: [] },
  { type: "error", name: "IdeationMarket__WrongErc1155HolderParameter", inputs: [] },
  { type: "error", name: "IdeationMarket__WrongPaymentCurrency", inputs: [] },
  { type: "error", name: "IdeationMarket__WrongQuantityParameter", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "CollectionWhitelistRevokedCancelTriggered",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" }
    ]
  },
  {
    type: "event",
    name: "InnovationFeePaid",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "marketplaceOwner", type: "address" },
      { indexed: true, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint256", name: "innovationFee", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "InnovationFeeUpdated",
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint32", name: "previousFee", type: "uint32" },
      { indexed: false, internalType: "uint32", name: "newFee", type: "uint32" }
    ]
  },
  {
    type: "event",
    name: "ListingCanceled",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "address", name: "triggeredBy", type: "address" }
    ]
  },
  {
    type: "event",
    name: "ListingCanceledDueToInvalidListing",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "address", name: "triggeredBy", type: "address" }
    ]
  },
  {
    type: "event",
    name: "ListingCreated",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "erc1155Quantity", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint32", name: "feeRate", type: "uint32" },
      { indexed: false, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "bool", name: "buyerWhitelistEnabled", type: "bool" },
      { indexed: false, internalType: "bool", name: "partialBuyEnabled", type: "bool" },
      { indexed: false, internalType: "address", name: "desiredTokenAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "desiredTokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "desiredErc1155Quantity", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ListingPurchased",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "erc1155Quantity", type: "uint256" },
      { indexed: false, internalType: "bool", name: "partialBuy", type: "bool" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint32", name: "feeRate", type: "uint32" },
      { indexed: false, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "address", name: "desiredTokenAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "desiredTokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "desiredErc1155Quantity", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ListingUpdated",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "erc1155Quantity", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint32", name: "feeRate", type: "uint32" },
      { indexed: false, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "bool", name: "buyerWhitelistEnabled", type: "bool" },
      { indexed: false, internalType: "bool", name: "partialBuyEnabled", type: "bool" },
      { indexed: false, internalType: "address", name: "desiredTokenAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "desiredTokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "desiredErc1155Quantity", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "RoyaltyPaid",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "royaltyReceiver", type: "address" },
      { indexed: true, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint256", name: "royaltyAmount", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "SellerProceedsPaid",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint128", name: "listingId", type: "uint128" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: true, internalType: "address", name: "currency", type: "address" },
      { indexed: false, internalType: "uint256", name: "sellerProceeds", type: "uint256" }
    ]
  },
  // ============================================================================
  // Functions
  // ============================================================================
  {
    type: "function",
    name: "cancelListing",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint128", name: "listingId", type: "uint128" }],
    outputs: []
  },
  {
    type: "function",
    name: "cleanListing",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint128", name: "listingId", type: "uint128" }],
    outputs: []
  },
  {
    type: "function",
    name: "createListing",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "tokenAddress", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "erc1155Holder", type: "address" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "address", name: "currency", type: "address" },
      { internalType: "address", name: "desiredTokenAddress", type: "address" },
      { internalType: "uint256", name: "desiredTokenId", type: "uint256" },
      { internalType: "uint256", name: "desiredErc1155Quantity", type: "uint256" },
      { internalType: "uint256", name: "erc1155Quantity", type: "uint256" },
      { internalType: "bool", name: "buyerWhitelistEnabled", type: "bool" },
      { internalType: "bool", name: "partialBuyEnabled", type: "bool" },
      { internalType: "address[]", name: "allowedBuyers", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "purchaseListing",
    stateMutability: "payable",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "uint256", name: "expectedPrice", type: "uint256" },
      { internalType: "address", name: "expectedCurrency", type: "address" },
      { internalType: "uint256", name: "expectedErc1155Quantity", type: "uint256" },
      { internalType: "address", name: "expectedDesiredTokenAddress", type: "address" },
      { internalType: "uint256", name: "expectedDesiredTokenId", type: "uint256" },
      { internalType: "uint256", name: "expectedDesiredErc1155Quantity", type: "uint256" },
      { internalType: "uint256", name: "erc1155PurchaseQuantity", type: "uint256" },
      { internalType: "address", name: "desiredErc1155Holder", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setInnovationFee",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint32", name: "newFee", type: "uint32" }],
    outputs: []
  },
  {
    type: "function",
    name: "updateListing",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint128", name: "listingId", type: "uint128" },
      { internalType: "uint256", name: "newPrice", type: "uint256" },
      { internalType: "address", name: "newCurrency", type: "address" },
      { internalType: "address", name: "newDesiredTokenAddress", type: "address" },
      { internalType: "uint256", name: "newDesiredTokenId", type: "uint256" },
      { internalType: "uint256", name: "newDesiredErc1155Quantity", type: "uint256" },
      { internalType: "uint256", name: "newErc1155Quantity", type: "uint256" },
      { internalType: "bool", name: "newBuyerWhitelistEnabled", type: "bool" },
      { internalType: "bool", name: "newPartialBuyEnabled", type: "bool" },
      { internalType: "address[]", name: "newAllowedBuyers", type: "address[]" }
    ],
    outputs: []
  }
] as const;
