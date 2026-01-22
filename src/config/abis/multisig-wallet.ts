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
    // Read Functions
    // ============================================================================
    {
        inputs: [],
        name: 'getTransactionCount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_txIndex', type: 'uint256' }],
        name: 'getTransaction',
        outputs: [
            {
                components: [
                    { internalType: 'enum MultisigWallet.TransactionType', name: 'transactionType', type: 'uint8' },
                    { internalType: 'bool', name: 'isActive', type: 'bool' },
                    { internalType: 'uint64', name: 'numConfirmations', type: 'uint64' },
                    { internalType: 'address', name: 'owner', type: 'address' },
                    { internalType: 'address', name: 'to', type: 'address' },
                    { internalType: 'uint256', name: 'value', type: 'uint256' },
                    { internalType: 'bytes', name: 'data', type: 'bytes' },
                ],
                internalType: 'struct MultisigWallet.Transaction',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getOwners',
        outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getOwnerCount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'isOwner',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: '_txIndex', type: 'uint256' },
            { internalType: 'address', name: '_owner', type: 'address' },
        ],
        name: 'isConfirmed',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'transactions',
        outputs: [
            { internalType: 'enum MultisigWallet.TransactionType', name: 'transactionType', type: 'uint8' },
            { internalType: 'bool', name: 'isActive', type: 'bool' },
            { internalType: 'uint64', name: 'numConfirmations', type: 'uint64' },
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'value', type: 'uint256' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        stateMutability: 'view',
        type: 'function',
    },

    // ============================================================================
    // Write Functions
    // ============================================================================
    {
        inputs: [
            { internalType: 'enum MultisigWallet.TransactionType', name: '_transactionType', type: 'uint8' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
            { internalType: 'bytes', name: '_data', type: 'bytes' },
        ],
        name: 'submitTransaction',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_txIndex', type: 'uint256' }],
        name: 'confirmTransaction',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_txIndex', type: 'uint256' }],
        name: 'revokeConfirmation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_txIndex', type: 'uint256' }],
        name: 'executeTransaction',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },

    // ============================================================================
    // Owner Management Functions
    // ============================================================================
    {
        inputs: [{ internalType: 'address', name: '_newOwner', type: 'address' }],
        name: 'addOwner',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
        name: 'removeOwner',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },

    // ============================================================================
    // ETH/Token Transfer Functions
    // ============================================================================
    {
        inputs: [
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_amount', type: 'uint256' },
        ],
        name: 'sendETH',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_amount', type: 'uint256' },
        ],
        name: 'transferERC20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_amount', type: 'uint256' },
        ],
        name: 'transferFromERC20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_tokenId', type: 'uint256' },
        ],
        name: 'safeTransferFromERC721',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },

    // ============================================================================
    // Batch Transfer Function
    // ============================================================================
    {
        inputs: [
            {
                components: [
                    { internalType: 'address', name: 'to', type: 'address' },
                    { internalType: 'address', name: 'tokenAddress', type: 'address' },
                    { internalType: 'uint256', name: 'value', type: 'uint256' },
                    { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                ],
                internalType: 'struct MultisigWallet.BatchTransaction[]',
                name: '_batchTransactions',
                type: 'tuple[]',
            },
        ],
        name: 'batchTransfer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },

    // ============================================================================
    // Utility Functions
    // ============================================================================
    {
        inputs: [],
        name: 'deactivateMyPendingTransactions',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },

    // ============================================================================
    // Events
    // ============================================================================
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'amountOrTokenId', type: 'uint256' },
            { indexed: true, internalType: 'uint256', name: 'balance', type: 'uint256' },
        ],
        name: 'Deposit',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'enum MultisigWallet.TransactionType', name: '_transactionType', type: 'uint8' },
            { indexed: true, internalType: 'uint256', name: 'txIndex', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'to', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
            { indexed: false, internalType: 'address', name: 'tokenAddress', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amountOrTokenId', type: 'uint256' },
            { indexed: false, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        name: 'SubmitTransaction',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'txIndex', type: 'uint256' },
        ],
        name: 'ConfirmTransaction',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'txIndex', type: 'uint256' },
        ],
        name: 'RevokeConfirmation',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'txIndex', type: 'uint256' },
        ],
        name: 'ExecuteTransaction',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'enum MultisigWallet.TransactionType', name: '_transactionType', type: 'uint8' },
            { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
            { indexed: false, internalType: 'address', name: 'tokenAddress', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
            { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
        ],
        name: 'TransferExecuted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }],
        name: 'OwnerAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }],
        name: 'OwnerRemoved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [],
        name: 'PendingTransactionsDeactivated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'txIndex', type: 'uint256' },
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
        ],
        name: 'DeactivatedMyPendingTransaction',
        type: 'event',
    },

    // ============================================================================
    // Receive Function
    // ============================================================================
    {
        stateMutability: 'payable',
        type: 'receive',
    },
] as const;

export default MULTISIG_WALLET_ABI;
