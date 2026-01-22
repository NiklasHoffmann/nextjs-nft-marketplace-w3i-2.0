/**
 * MultiSig Wallet Types & Constants
 * 
 * Type definitions for the W3Ideation MultiSig Wallet contract.
 * Contract: https://github.com/web3ideation/multisig-wallet-w3i
 */

// ============================================================================
// Contract Addresses
// ============================================================================

export const MULTISIG_ADDRESSES = {
    sepolia: '0x2180aFbC0156E6fF3156ca57C4dFb0a1AB9152C7',
    mainnet: '0x66dcc49c47ebc505a4b560fD14Dc143f0098407f',
} as const;

export type MultiSigNetwork = keyof typeof MULTISIG_ADDRESSES;

// ============================================================================
// Enums
// ============================================================================

/**
 * Transaction types supported by MultiSig Wallet
 */
export enum TransactionType {
    ETH = 0,
    ERC20 = 1,
    ERC20_TRANSFER_FROM = 2,
    ERC721 = 3,
    AddOwner = 4,
    RemoveOwner = 5,
    BatchTransaction = 6,
    Other = 7, // Custom contract calls (used for Diamond operations)
}

/**
 * Human-readable labels for transaction types
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    [TransactionType.ETH]: 'ETH Transfer',
    [TransactionType.ERC20]: 'ERC20 Transfer',
    [TransactionType.ERC20_TRANSFER_FROM]: 'ERC20 TransferFrom',
    [TransactionType.ERC721]: 'ERC721 Transfer',
    [TransactionType.AddOwner]: 'Add Owner',
    [TransactionType.RemoveOwner]: 'Remove Owner',
    [TransactionType.BatchTransaction]: 'Batch Transaction',
    [TransactionType.Other]: 'Custom Call',
};

/**
 * Color coding for transaction types
 */
export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
    [TransactionType.ETH]: 'blue',
    [TransactionType.ERC20]: 'green',
    [TransactionType.ERC20_TRANSFER_FROM]: 'green',
    [TransactionType.ERC721]: 'purple',
    [TransactionType.AddOwner]: 'indigo',
    [TransactionType.RemoveOwner]: 'red',
    [TransactionType.BatchTransaction]: 'yellow',
    [TransactionType.Other]: 'gray',
};

// ============================================================================
// Core Types
// ============================================================================

/**
 * MultiSig transaction as stored in contract
 */
export interface MultiSigTransaction {
    transactionType: TransactionType;
    isActive: boolean;
    numConfirmations: bigint;
    owner: string;
    to: string;
    value: bigint;
    data: string;
}

/**
 * Pending transaction with additional metadata
 */
export interface PendingMultiSigTx extends MultiSigTransaction {
    txIndex: number;
    confirmations: string[]; // Array of addresses that confirmed
    canConfirm: boolean; // Can current user confirm?
    canRevoke: boolean; // Can current user revoke?
    canExecute: boolean; // Can transaction be executed?
    requiredConfirmations: number; // How many confirmations needed
    decodedCall?: DecodedContractCall; // Decoded function call (if available)
}

/**
 * Decoded contract call for better UX
 */
export interface DecodedContractCall {
    contractName: string;
    functionName: string;
    args: Array<{
        name: string;
        type: string;
        value: string;
    }>;
    description?: string; // Human-readable description
}

/**
 * MultiSig wallet stats
 */
export interface MultiSigStats {
    totalOwners: number;
    requiredConfirmations: number;
    pendingTransactions: number;
    totalTransactions: number;
    activeOwners: string[];
}

// ============================================================================
// Diamond Operations (for TransactionType.Other)
// ============================================================================

/**
 * Diamond contract operations that can be submitted via MultiSig
 */
export enum DiamondOperation {
    TRANSFER_OWNERSHIP = 'transferOwnership',
    ACCEPT_OWNERSHIP = 'acceptOwnership',
    PAUSE = 'pause',
    UNPAUSE = 'unpause',
    SET_INNOVATION_FEE = 'setInnovationFee',
    ADD_WHITELISTED_COLLECTION = 'addWhitelistedCollection',
    REMOVE_WHITELISTED_COLLECTION = 'removeWhitelistedCollection',
    BATCH_ADD_COLLECTIONS = 'batchAddWhitelistedCollections',
    BATCH_REMOVE_COLLECTIONS = 'batchRemoveWhitelistedCollections',
    CLEAN_LISTING = 'cleanListing',
    DIAMOND_CUT = 'diamondCut',
}

/**
 * Diamond operation templates for UI
 */
export interface DiamondOperationTemplate {
    operation: DiamondOperation;
    label: string;
    description: string;
    functionSignature: string;
    args: Array<{
        name: string;
        type: string;
        placeholder?: string;
        description?: string;
    }>;
    requiresMultiSig: boolean; // Must be executed via MultiSig?
}

export const DIAMOND_OPERATION_TEMPLATES: Record<
    DiamondOperation,
    DiamondOperationTemplate
> = {
    [DiamondOperation.TRANSFER_OWNERSHIP]: {
        operation: DiamondOperation.TRANSFER_OWNERSHIP,
        label: 'Transfer Ownership',
        description: 'Transfer contract ownership to new address',
        functionSignature: 'transferOwnership(address)',
        args: [
            {
                name: 'newOwner',
                type: 'address',
                placeholder: '0x...',
                description: 'New owner address',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.ACCEPT_OWNERSHIP]: {
        operation: DiamondOperation.ACCEPT_OWNERSHIP,
        label: 'Accept Ownership',
        description: 'Accept pending ownership transfer',
        functionSignature: 'acceptOwnership()',
        args: [],
        requiresMultiSig: true,
    },
    [DiamondOperation.PAUSE]: {
        operation: DiamondOperation.PAUSE,
        label: 'Pause Contract',
        description: 'Pause all marketplace operations',
        functionSignature: 'pause()',
        args: [],
        requiresMultiSig: true,
    },
    [DiamondOperation.UNPAUSE]: {
        operation: DiamondOperation.UNPAUSE,
        label: 'Unpause Contract',
        description: 'Resume marketplace operations',
        functionSignature: 'unpause()',
        args: [],
        requiresMultiSig: true,
    },
    [DiamondOperation.SET_INNOVATION_FEE]: {
        operation: DiamondOperation.SET_INNOVATION_FEE,
        label: 'Set Innovation Fee',
        description: 'Update marketplace fee (basis points)',
        functionSignature: 'setInnovationFee(uint256)',
        args: [
            {
                name: 'feeBps',
                type: 'uint256',
                placeholder: '250',
                description: 'Fee in basis points (250 = 2.5%)',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.ADD_WHITELISTED_COLLECTION]: {
        operation: DiamondOperation.ADD_WHITELISTED_COLLECTION,
        label: 'Whitelist Collection',
        description: 'Add NFT collection to whitelist',
        functionSignature: 'addWhitelistedCollection(address)',
        args: [
            {
                name: 'collection',
                type: 'address',
                placeholder: '0x...',
                description: 'NFT collection address',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.REMOVE_WHITELISTED_COLLECTION]: {
        operation: DiamondOperation.REMOVE_WHITELISTED_COLLECTION,
        label: 'Remove Whitelisted Collection',
        description: 'Remove NFT collection from whitelist',
        functionSignature: 'removeWhitelistedCollection(address)',
        args: [
            {
                name: 'collection',
                type: 'address',
                placeholder: '0x...',
                description: 'NFT collection address',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.BATCH_ADD_COLLECTIONS]: {
        operation: DiamondOperation.BATCH_ADD_COLLECTIONS,
        label: 'Batch Whitelist Collections',
        description: 'Add multiple collections to whitelist',
        functionSignature: 'batchAddWhitelistedCollections(address[])',
        args: [
            {
                name: 'collections',
                type: 'address[]',
                placeholder: '0x..., 0x..., 0x...',
                description: 'Array of collection addresses',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.BATCH_REMOVE_COLLECTIONS]: {
        operation: DiamondOperation.BATCH_REMOVE_COLLECTIONS,
        label: 'Batch Remove Collections',
        description: 'Remove multiple collections from whitelist',
        functionSignature: 'batchRemoveWhitelistedCollections(address[])',
        args: [
            {
                name: 'collections',
                type: 'address[]',
                placeholder: '0x..., 0x..., 0x...',
                description: 'Array of collection addresses',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.CLEAN_LISTING]: {
        operation: DiamondOperation.CLEAN_LISTING,
        label: 'Clean Listing',
        description: 'Remove invalid/stale listing',
        functionSignature: 'cleanListing(address,uint256)',
        args: [
            {
                name: 'nftAddress',
                type: 'address',
                placeholder: '0x...',
                description: 'NFT contract address',
            },
            {
                name: 'tokenId',
                type: 'uint256',
                placeholder: '1',
                description: 'Token ID',
            },
        ],
        requiresMultiSig: true,
    },
    [DiamondOperation.DIAMOND_CUT]: {
        operation: DiamondOperation.DIAMOND_CUT,
        label: 'Diamond Cut (Upgrade)',
        description: 'Add/Replace/Remove facets (ADVANCED)',
        functionSignature: 'diamondCut((address,uint8,bytes4[])[],address,bytes)',
        args: [
            {
                name: 'facetCuts',
                type: 'tuple[]',
                placeholder: 'JSON encoded',
                description: 'Facet cut operations (Advanced)',
            },
            {
                name: 'init',
                type: 'address',
                placeholder: '0x...',
                description: 'Init contract address',
            },
            {
                name: 'calldata',
                type: 'bytes',
                placeholder: '0x',
                description: 'Init function calldata',
            },
        ],
        requiresMultiSig: true,
    },
};

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Submit transaction request
 */
export interface SubmitTransactionRequest {
    transactionType: TransactionType;
    to: string;
    value: bigint;
    data: string;
    description?: string; // Optional description for UI
}

/**
 * Transaction submission result
 */
export interface TransactionSubmissionResult {
    txHash: string;
    txIndex: number;
    success: boolean;
    error?: string;
}

/**
 * Confirmation result
 */
export interface ConfirmationResult {
    txHash: string;
    executed: boolean; // Was transaction auto-executed?
    success: boolean;
    error?: string;
}

// ============================================================================
// Admin Mode Types
// ============================================================================

/**
 * Current admin mode
 */
export enum AdminMode {
    SINGLE_OWNER = 'single-owner',
    MULTISIG = 'multisig',
    TRANSITIONING = 'transitioning', // During ownership transfer
}

/**
 * Admin mode info
 */
export interface AdminModeInfo {
    mode: AdminMode;
    currentOwner: string;
    pendingOwner?: string;
    isMultiSigOwner: boolean;
    canUseDirect: boolean; // Can use direct admin interface?
    multiSigAddress?: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * MultiSig contract events
 */
export interface MultiSigEvents {
    SubmitTransaction: {
        _transactionType: TransactionType;
        txIndex: bigint;
        to: string;
        value: bigint;
        tokenAddress: string;
        amountOrTokenId: bigint;
        owner: string;
        data: string;
    };
    ConfirmTransaction: {
        owner: string;
        txIndex: bigint;
    };
    RevokeConfirmation: {
        owner: string;
        txIndex: bigint;
    };
    ExecuteTransaction: {
        owner: string;
        txIndex: bigint;
    };
    OwnerAdded: {
        owner: string;
    };
    OwnerRemoved: {
        owner: string;
    };
}
