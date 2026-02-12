/**
 * MultiSig Service
 * 
 * Utility functions for interacting with MultiSig Wallet contract.
 * Handles transaction encoding, decoding, and common operations.
 */

import { encodeFunctionData, decodeFunctionData, parseAbi } from 'viem';
import {
    DiamondOperation,
    DIAMOND_OPERATION_TEMPLATES,
    TransactionType,
    type PendingMultiSigTx,
    type MultiSigTransaction,
    type DecodedContractCall,
    type SubmitTransactionRequest,
} from '@/types';
import { OWNERSHIP_FACET_ABI } from '@/config/abis/ownership-facet';
import { PAUSE_FACET_ABI } from '@/config/abis/pause-facet';
import { IDEATION_MARKET_FACET_ABI } from '@/config/abis/ideation-market-facet';
import { COLLECTION_WHITELIST_FACET_ABI } from '@/config/abis/collection-whitelist-facet';
import { BUYER_WHITELIST_FACET_ABI } from '@/config/abis/buyer-whitelist-facet';
import { CURRENCY_WHITELIST_FACET_ABI } from '@/config/abis/currency-whitelist-facet';
import { DIAMOND_CUT_ABI } from '@/config/abis/diamond-cut';
import { devLog } from '@/utils';

// ============================================================================
// Transaction Encoding
// ============================================================================

/**
 * Encode Diamond operation for MultiSig submission
 */
export function encodeDiamondOperation(
    operation: DiamondOperation,
    args: any[]
): string {
    const template = DIAMOND_OPERATION_TEMPLATES[operation];
    const operationAbiMap: Record<DiamondOperation, readonly unknown[]> = {
        [DiamondOperation.TRANSFER_OWNERSHIP]: OWNERSHIP_FACET_ABI,
        [DiamondOperation.ACCEPT_OWNERSHIP]: OWNERSHIP_FACET_ABI,
        [DiamondOperation.PAUSE]: PAUSE_FACET_ABI,
        [DiamondOperation.UNPAUSE]: PAUSE_FACET_ABI,
        [DiamondOperation.SET_INNOVATION_FEE]: IDEATION_MARKET_FACET_ABI,
        [DiamondOperation.ADD_WHITELISTED_COLLECTION]: COLLECTION_WHITELIST_FACET_ABI,
        [DiamondOperation.REMOVE_WHITELISTED_COLLECTION]: COLLECTION_WHITELIST_FACET_ABI,
        [DiamondOperation.BATCH_ADD_COLLECTIONS]: COLLECTION_WHITELIST_FACET_ABI,
        [DiamondOperation.BATCH_REMOVE_COLLECTIONS]: COLLECTION_WHITELIST_FACET_ABI,
        [DiamondOperation.ADD_BUYER_WHITELIST_ADDRESSES]: BUYER_WHITELIST_FACET_ABI,
        [DiamondOperation.REMOVE_BUYER_WHITELIST_ADDRESSES]: BUYER_WHITELIST_FACET_ABI,
        [DiamondOperation.ADD_ALLOWED_CURRENCY]: CURRENCY_WHITELIST_FACET_ABI,
        [DiamondOperation.REMOVE_ALLOWED_CURRENCY]: CURRENCY_WHITELIST_FACET_ABI,
        [DiamondOperation.CLEAN_LISTING]: IDEATION_MARKET_FACET_ABI,
        [DiamondOperation.DIAMOND_CUT]: DIAMOND_CUT_ABI,
    };
    const operationAbi = operationAbiMap[operation];

    try {
        const data = encodeFunctionData({
            abi: operationAbi,
            functionName: template.functionSignature.split('(')[0] as any,
            args: args as any,
        });

        return data;
    } catch (error) {
        devLog.error(`Failed to encode ${operation}:`, error);
        throw new Error(`Failed to encode ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Create transaction request for Diamond operation
 */
export function createDiamondTransactionRequest(
    diamondAddress: string,
    operation: DiamondOperation,
    args: any[],
    description?: string
): SubmitTransactionRequest {
    const data = encodeDiamondOperation(operation, args);

    return {
        transactionType: TransactionType.Other,
        to: diamondAddress,
        value: BigInt(0),
        data,
        description: description || DIAMOND_OPERATION_TEMPLATES[operation].label,
    };
}

// ============================================================================
// Transaction Decoding
// ============================================================================

/**
 * Decode contract call data
 */
export function decodeContractCall(
    to: string,
    data: string,
    diamondAddress: string
): DecodedContractCall | null {
    // Check if it's a Diamond contract call
    if (to.toLowerCase() !== diamondAddress.toLowerCase()) {
        return {
            contractName: 'Unknown Contract',
            functionName: 'Unknown Function',
            args: [],
            description: `Custom call to ${to}`,
        };
    }

    try {
        // Try to decode as Diamond function
        const decoded = decodeFunctionData({
            abi: [
                ...OWNERSHIP_FACET_ABI,
                ...PAUSE_FACET_ABI,
                ...IDEATION_MARKET_FACET_ABI,
                ...COLLECTION_WHITELIST_FACET_ABI,
                ...BUYER_WHITELIST_FACET_ABI,
                ...CURRENCY_WHITELIST_FACET_ABI,
                ...DIAMOND_CUT_ABI,
            ],
            data: data as `0x${string}`,
        });

        // Match with Diamond operation templates
        const operation = Object.values(DiamondOperation).find(
            (op) => DIAMOND_OPERATION_TEMPLATES[op].functionSignature.startsWith(decoded.functionName)
        );

        if (operation) {
            const template = DIAMOND_OPERATION_TEMPLATES[operation];

            return {
                contractName: 'IdeationMarket Diamond',
                functionName: decoded.functionName,
                args: template.args.map((argDef, index) => ({
                    name: argDef.name,
                    type: argDef.type,
                    value: String(decoded.args?.[index] ?? ''),
                })),
                description: template.description,
            };
        }

        // Generic Diamond function
        return {
            contractName: 'IdeationMarket Diamond',
            functionName: decoded.functionName,
            args: decoded.args?.map((arg, index) => ({
                name: `arg${index}`,
                type: typeof arg,
                value: String(arg),
            })) ?? [],
        };
    } catch (error) {
        devLog.warn('Failed to decode contract call:', error);
        return null;
    }
}

// ============================================================================
// Transaction Analysis
// ============================================================================

/**
 * Calculate required confirmations based on transaction type and owner count
 */
export function calculateRequiredConfirmations(
    transactionType: TransactionType,
    ownerCount: number
): number {
    // Owner management needs 2/3 consensus
    if (
        transactionType === TransactionType.AddOwner ||
        transactionType === TransactionType.RemoveOwner
    ) {
        return Math.ceil((ownerCount * 2) / 3);
    }

    // Other operations need >50%
    return Math.ceil(ownerCount / 2);
}

/**
 * Check if transaction can be executed
 */
export function canExecuteTransaction(
    tx: MultiSigTransaction,
    ownerCount: number
): boolean {
    if (!tx.isActive) return false;

    const required = calculateRequiredConfirmations(
        tx.transactionType,
        ownerCount
    );

    return Number(tx.numConfirmations) >= required;
}

/**
 * Check if user can confirm transaction
 */
export function canConfirmTransaction(
    tx: MultiSigTransaction,
    userAddress: string,
    confirmations: string[]
): boolean {
    if (!tx.isActive) return false;

    // Check if already confirmed
    const alreadyConfirmed = confirmations.some(
        (addr) => addr.toLowerCase() === userAddress.toLowerCase()
    );

    return !alreadyConfirmed;
}

/**
 * Check if user can revoke confirmation
 */
export function canRevokeConfirmation(
    tx: MultiSigTransaction,
    userAddress: string,
    confirmations: string[]
): boolean {
    if (!tx.isActive) return false;

    // Check if user has confirmed
    const hasConfirmed = confirmations.some(
        (addr) => addr.toLowerCase() === userAddress.toLowerCase()
    );

    return hasConfirmed;
}

// ============================================================================
// Pending Transaction Enhancement
// ============================================================================

/**
 * Enhance transaction with metadata and permissions
 */
export function enhancePendingTransaction(
    tx: MultiSigTransaction,
    txIndex: number,
    confirmations: string[],
    userAddress: string,
    ownerCount: number,
    diamondAddress: string
): PendingMultiSigTx {
    const requiredConfirmations = calculateRequiredConfirmations(
        tx.transactionType,
        ownerCount
    );

    const decodedCall = tx.data && tx.data !== '0x'
        ? decodeContractCall(tx.to, tx.data, diamondAddress) || undefined
        : undefined;

    return {
        ...tx,
        txIndex,
        confirmations,
        canConfirm: canConfirmTransaction(tx, userAddress, confirmations),
        canRevoke: canRevokeConfirmation(tx, userAddress, confirmations),
        canExecute: canExecuteTransaction(tx, ownerCount),
        requiredConfirmations,
        decodedCall,
    };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate transaction request
 */
export function validateTransactionRequest(
    request: SubmitTransactionRequest
): { valid: boolean; error?: string } {
    // Validate address
    if (!request.to || !request.to.match(/^0x[a-fA-F0-9]{40}$/)) {
        return { valid: false, error: 'Invalid target address' };
    }

    // Validate value
    if (request.value < BigInt(0)) {
        return { valid: false, error: 'Value cannot be negative' };
    }

    // Validate data for specific transaction types
    if (request.transactionType === TransactionType.Other) {
        if (!request.data || request.data === '0x' || request.data.length < 10) {
            return { valid: false, error: 'Custom calls require valid calldata' };
        }
    }

    return { valid: true };
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format transaction value based on type
 */
export function formatTransactionValue(
    type: TransactionType,
    value: bigint
): string {
    if (type === TransactionType.ETH) {
        return `${Number(value) / 1e18} ETH`;
    }

    if (type === TransactionType.ERC20 || type === TransactionType.ERC20_TRANSFER_FROM) {
        return `${Number(value) / 1e18} tokens`;
    }

    if (type === TransactionType.ERC721) {
        return `Token ID: ${value}`;
    }

    return String(value);
}

/**
 * Get transaction status label
 */
export function getTransactionStatusLabel(
    tx: PendingMultiSigTx
): string {
    if (!tx.isActive) {
        return 'Inactive';
    }

    if (tx.canExecute) {
        return 'Ready to Execute';
    }

    const remaining = tx.requiredConfirmations - Number(tx.numConfirmations);
    return `Needs ${remaining} more confirmation${remaining !== 1 ? 's' : ''}`;
}

/**
 * Get transaction status color
 */
export function getTransactionStatusColor(
    tx: PendingMultiSigTx
): 'gray' | 'yellow' | 'green' | 'red' {
    if (!tx.isActive) {
        return 'gray';
    }

    if (tx.canExecute) {
        return 'green';
    }

    const progress = Number(tx.numConfirmations) / tx.requiredConfirmations;
    if (progress >= 0.5) {
        return 'yellow';
    }

    return 'red';
}

// ============================================================================
// Diamond Operation Helpers
// ============================================================================

/**
 * Get all available Diamond operations
 */
export function getAvailableDiamondOperations(): DiamondOperation[] {
    return Object.values(DiamondOperation);
}

/**
 * Get operation template
 */
export function getOperationTemplate(operation: DiamondOperation) {
    return DIAMOND_OPERATION_TEMPLATES[operation];
}

/**
 * Validate operation arguments
 */
export function validateOperationArgs(
    operation: DiamondOperation,
    args: any[]
): { valid: boolean; error?: string } {
    const template = DIAMOND_OPERATION_TEMPLATES[operation];

    if (args.length !== template.args.length) {
        return {
            valid: false,
            error: `Expected ${template.args.length} arguments, got ${args.length}`,
        };
    }

    // Basic type validation
    for (let i = 0; i < args.length; i++) {
        const argDef = template.args[i];
        const arg = args[i];

        if (!argDef) continue;

        if (argDef.type === 'address') {
            if (!arg || !arg.match(/^0x[a-fA-F0-9]{40}$/)) {
                return { valid: false, error: `Invalid address for ${argDef.name}` };
            }
        }

        if (argDef.type === 'uint256' || argDef.type === 'uint128') {
            if (isNaN(Number(arg)) || Number(arg) < 0) {
                return { valid: false, error: `Invalid ${argDef.type} for ${argDef.name}` };
            }
        }

        if (argDef.type === 'address[]') {
            if (!Array.isArray(arg)) {
                return { valid: false, error: `Expected array for ${argDef.name}` };
            }
            for (const addr of arg) {
                if (!addr || !addr.match(/^0x[a-fA-F0-9]{40}$/)) {
                    return { valid: false, error: `Invalid address in array ${argDef.name}` };
                }
            }
        }
    }

    return { valid: true };
}
