/**
 * Diamond Contract ABI (Minimal)
 * 
 * Minimal ABI for accessing Diamond ownership functions.
 * Includes only the functions needed for MultiSig admin mode detection.
 */

export const DIAMOND_ABI = [
    {
        type: 'function',
        name: 'owner',
        inputs: [],
        outputs: [{ name: '', type: 'address', internalType: 'address' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getPendingOwner',
        inputs: [],
        outputs: [{ name: '', type: 'address', internalType: 'address' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'transferOwnership',
        inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'acceptOwnership',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'pause',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'unpause',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'updateListingFee',
        inputs: [{ name: 'newFee', type: 'uint256', internalType: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'updateRoyaltyFee',
        inputs: [{ name: 'newFee', type: 'uint256', internalType: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'addWhitelistedCollection',
        inputs: [{ name: 'collection', type: 'address', internalType: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'removeWhitelistedCollection',
        inputs: [{ name: 'collection', type: 'address', internalType: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'addWhitelistedCollections',
        inputs: [{ name: 'collections', type: 'address[]', internalType: 'address[]' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'removeWhitelistedCollections',
        inputs: [{ name: 'collections', type: 'address[]', internalType: 'address[]' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;
