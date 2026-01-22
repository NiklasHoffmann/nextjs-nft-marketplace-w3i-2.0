/**
 * Network Configuration
 * Contract addresses for different blockchain networks
 */

export interface NetworkContracts {
    NftMarketplace: string[];
}

export interface NetworkMapping {
    [chainId: string]: NetworkContracts;
}

export const NETWORK_CONFIG: NetworkMapping = {
    // Hardhat Local Network
    "31337": {
        NftMarketplace: ["0x5FbDB2315678afecb367f032d93F642f64180aa3"]
    },
    // Sepolia Testnet
    "11155111": {
        NftMarketplace: ["0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC"]
    }
} as const;

/**
 * Get marketplace contract address for a specific chain
 */
export function getMarketplaceAddress(chainId: number | string): string | undefined {
    const contracts = NETWORK_CONFIG[chainId.toString()];
    return contracts?.NftMarketplace[0];
}

/**
 * Check if a chain is supported
 */
export function isSupportedChain(chainId: number | string): boolean {
    return chainId.toString() in NETWORK_CONFIG;
}
