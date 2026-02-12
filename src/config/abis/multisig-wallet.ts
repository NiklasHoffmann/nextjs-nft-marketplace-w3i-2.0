/**
 * MultiSig Wallet Contract ABI
 *
 * Complete ABI for the W3Ideation MultiSig Wallet contract.
 * Contract: https://github.com/web3ideation/multisig-wallet-w3i
 *
 * Deployed:
 * - Sepolia: 0x2180aFbC0156E6fF3156ca57C4dFb0a1AB9152C7
 * - Mainnet: 0x66dcc49c47ebc505a4b560fD14Dc143f0098407f
 */

export const MULTISIG_WALLET_ABI = [
  // ============================================================================
  // Constructor
  // ============================================================================
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address[]", name: "_owners", type: "address[]" }]
  },
  // ============================================================================
  // Errors
  // ============================================================================
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  // ============================================================================
  // Events
  // ============================================================================
  {
    type: "event",
    name: "BatchTransferExecuted",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "recipient", type: "address" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ConfirmTransaction",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "uint256", name: "txIndex", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "DeactivatedMyPendingTransaction",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "txIndex", type: "uint256" },
      { indexed: true, internalType: "address", name: "owner", type: "address" }
    ]
  },
  {
    type: "event",
    name: "Deposit",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: true, internalType: "uint256", name: "amountOrTokenId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "balance", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ERC721Received",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "operator", type: "address" },
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "bytes", name: "data", type: "bytes" }
    ]
  },
  {
    type: "event",
    name: "ExecuteTransaction",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "enum MultisigWallet.TransactionType", name: "_transactionType", type: "uint8" },
      { indexed: true, internalType: "uint256", name: "txIndex", type: "uint256" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      { indexed: false, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountOrTokenId", type: "uint256" },
      { indexed: false, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "bytes", name: "data", type: "bytes" }
    ]
  },
  {
    type: "event",
    name: "OwnerAdded",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "owner", type: "address" }]
  },
  {
    type: "event",
    name: "OwnerRemoved",
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "owner", type: "address" }]
  },
  { type: "event", name: "PendingTransactionsDeactivated", anonymous: false, inputs: [] },
  {
    type: "event",
    name: "RevokeConfirmation",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "uint256", name: "txIndex", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "SubmitTransaction",
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "enum MultisigWallet.TransactionType", name: "_transactionType", type: "uint8" },
      { indexed: true, internalType: "uint256", name: "txIndex", type: "uint256" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      { indexed: false, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountOrTokenId", type: "uint256" },
      { indexed: false, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "bytes", name: "data", type: "bytes" }
    ]
  },
  // ============================================================================
  // Write Functions
  // ============================================================================
  {
    type: "function",
    name: "addOwner",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "batchTransfer",
    stateMutability: "nonpayable",
    inputs: [
      {
        internalType: "struct MultisigWallet.BatchTransaction[]",
        name: "transfers",
        type: "tuple[]",
        components: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "address", name: "tokenAddress", type: "address" },
          { internalType: "uint256", name: "value", type: "uint256" },
          { internalType: "uint256", name: "tokenId", type: "uint256" }
        ]
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "confirmTransaction",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint256", name: "_txIndex", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "deactivateMyPendingTransaction",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint256", name: "_txIndex", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "executeTransaction",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint256", name: "_txIndex", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "removeOwner",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "revokeConfirmation",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "uint256", name: "_txIndex", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "safeTransferFromERC721",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "address", name: "_from", type: "address" },
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "sendETH",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "submitTransaction",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "enum MultisigWallet.TransactionType", name: "_transactionType", type: "uint8" },
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
      { internalType: "bytes", name: "_data", type: "bytes" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "transferERC20",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "contract IERC20", name: "_token", type: "address" },
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "transferFromERC20",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "contract IERC20", name: "_token", type: "address" },
      { internalType: "address", name: "_from", type: "address" },
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "onERC721Received",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }]
  },
  // ============================================================================
  // Read Functions
  // ============================================================================
  {
    type: "function",
    name: "getOwnerCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }]
  },
  {
    type: "function",
    name: "isConfirmed",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" }
    ],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "isOwner",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "", type: "address" }],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "owners",
    stateMutability: "view",
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    outputs: [{ internalType: "address", name: "", type: "address" }]
  },
  {
    type: "function",
    name: "transactions",
    stateMutability: "view",
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    outputs: [
      { internalType: "enum MultisigWallet.TransactionType", name: "transactionType", type: "uint8" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint64", name: "numConfirmations", type: "uint64" },
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ]
  },
  // ============================================================================
  // Receive
  // ============================================================================
  { type: "receive", stateMutability: "payable" }
] as const;

