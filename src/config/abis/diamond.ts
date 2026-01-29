/**
 * Diamond Contract ABI (Minimal)
 * 
 * Minimal ABI for accessing Diamond ownership functions.
 * Includes only the functions needed for MultiSig admin mode detection.
 */

export const DIAMOND_ABI = [
    // Ownership Functions
    { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
    { type: "function", name: "getPendingOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
    { type: "function", name: "transferOwnership", stateMutability: "nonpayable", inputs: [{ type: "address", name: "newOwner" }], outputs: [] },
    { type: "function", name: "acceptOwnership", stateMutability: "nonpayable", inputs: [], outputs: [] },

    // Pause Functions
    { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] },
    { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },

    // Fee Management Functions
    { type: "function", name: "updateListingFee", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "newFee" }], outputs: [] },
    { type: "function", name: "updateRoyaltyFee", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "newFee" }], outputs: [] },

    // Collection Whitelist Functions
    { type: "function", name: "addWhitelistedCollection", stateMutability: "nonpayable", inputs: [{ type: "address", name: "collection" }], outputs: [] },
    { type: "function", name: "removeWhitelistedCollection", stateMutability: "nonpayable", inputs: [{ type: "address", name: "collection" }], outputs: [] },
    { type: "function", name: "addWhitelistedCollections", stateMutability: "nonpayable", inputs: [{ type: "address[]", name: "collections" }], outputs: [] },
    { type: "function", name: "removeWhitelistedCollections", stateMutability: "nonpayable", inputs: [{ type: "address[]", name: "collections" }], outputs: [] },
] as const;
