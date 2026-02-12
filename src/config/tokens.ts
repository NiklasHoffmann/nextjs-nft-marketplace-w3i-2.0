import { devLog } from '@/utils';

/**
 * Token Configuration
 * Supported ERC20 tokens for marketplace payments
 * 
 * For extended token list (76 tokens), see tokens-extended.ts
 */

export interface TokenConfig {
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
    icon?: string;
    isMock?: boolean; // Flag for development/testing tokens
    category?: string; // Optional category for grouping
}

export interface NetworkTokens {
    [chainId: string]: {
        WETH: TokenConfig;
        USDC?: TokenConfig;
        DAI?: TokenConfig;
        // Mock tokens (Hardhat only)
        MOCK_ERC20?: TokenConfig;
        MOCK_WBTC?: TokenConfig;
        MOCK_EURS?: TokenConfig;
        MOCK_USDT?: TokenConfig;
    };
}

/**
 * Token addresses per network
 */
export const TOKENS: NetworkTokens = {
    // Hardhat Local (Mock tokens)
    "31337": {
        // Standard Production Tokens (for testing production flows)
        WETH: {
            address: "0x0000000000000000000000000000000000000000", // Deploy WETH mock contract
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18
        },
        USDC: {
            address: "0xEaefa01B8c4c8126226A8B2DA2cF6Eb0E5B0bD26", // MockUSDC_6 (deployed)
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6
        },
        DAI: {
            address: "0x0000000000000000000000000000000000000000", // Deploy DAI mock contract
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18
        },

        // ========================================
        // MOCK TOKENS (Development/Testing Only)
        // ========================================
        // These tokens can be safely removed for production
        MOCK_ERC20: {
            address: "0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e", // MockERC20_18 (deployed)
            symbol: "MERC20",
            name: "Mock ERC20 Token",
            decimals: 18,
            isMock: true
        },
        MOCK_WBTC: {
            address: "0xB1A8786Fd1bBDB7F56f8cEa78A77897a0Aa9fAb2", // MockWBTC_8 (deployed)
            symbol: "MWBTC",
            name: "Mock Wrapped Bitcoin",
            decimals: 8,
            isMock: true
        },
        MOCK_EURS: {
            address: "0xe06E78AB6314993FCa9106536aecfE4284aA791a", // MockEURS_2 (deployed)
            symbol: "MEURS",
            name: "Mock STASIS EURS",
            decimals: 2,
            isMock: true
        },
        MOCK_USDT: {
            address: "0xd11Db19892F8c9C89A03Ba6EFD636795cbBc0d74", // MockUSDTLike_6 (deployed)
            symbol: "MUSDT",
            name: "Mock Tether USD",
            decimals: 6,
            isMock: true
        }
        // ======================================== END MOCK TOKENS
    },
    // Sepolia Testnet
    "11155111": {
        WETH: {
            address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // Official Sepolia WETH
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18
        },
        USDC: {
            address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Official Sepolia USDC
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6
        },
        DAI: {
            address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574", // Official Sepolia DAI
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18
        },

        // ========================================
        // MOCK TOKENS (Development/Testing Only)
        // ========================================
        // These tokens can be safely removed for production
        MOCK_ERC20: {
            address: "0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e", // MockERC20_18 (deployed on Sepolia) ✅ WHITELISTED
            symbol: "MERC20",
            name: "Mock ERC20 Token",
            decimals: 18,
            isMock: true
        },
        MOCK_WBTC: {
            address: "0xB1A8786Fd1bBDB7F56f8cEa78A77897a0Aa9fAb2", // MockWBTC_8 (deployed on Sepolia)
            symbol: "MWBTC",
            name: "Mock Wrapped Bitcoin",
            decimals: 8,
            isMock: true
        },
        MOCK_EURS: {
            address: "0xe06E78AB6314993FCa9106536aecfE4284aA791a", // MockEURS_2 (deployed on Sepolia)
            symbol: "MEURS",
            name: "Mock STASIS EURS",
            decimals: 2,
            isMock: true
        },
        MOCK_USDT: {
            address: "0xd11Db19892F8c9C89A03Ba6EFD636795cbBc0d74", // MockUSDTLike_6 (deployed on Sepolia)
            symbol: "MUSDT",
            name: "Mock Tether USD",
            decimals: 6,
            isMock: true
        }
        // ======================================== END MOCK TOKENS
    },
    // Ethereum Mainnet
    "1": {
        WETH: {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Official Mainnet WETH
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18
        },
        USDC: {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Official Mainnet USDC
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6
        },
        DAI: {
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Official Mainnet DAI
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18
        }
    }
} as const;

/**
 * Get specific token config
 */
export function getTokenConfig(
    chainId: number | string,
    tokenSymbol: 'WETH' | 'USDC' | 'DAI' | 'MOCK_ERC20' | 'MOCK_WBTC' | 'MOCK_EURS' | 'MOCK_USDT'
): TokenConfig | undefined {
    return TOKENS[chainId.toString()]?.[tokenSymbol];
}

/**
 * Get all available tokens for a chain
 * @param chainId - Network chain ID
 * @param includeMockTokens - Include mock tokens (default: true for Hardhat, false for production)
 */
export function getAvailableTokens(chainId: number | string, includeMockTokens?: boolean): TokenConfig[] {
    const networkTokens = TOKENS[chainId.toString()];
    if (!networkTokens) return [];

    // Auto-detect: include mocks on Hardhat and Sepolia unless explicitly set
    const shouldIncludeMocks = includeMockTokens ?? (chainId.toString() === '31337' || chainId.toString() === '11155111');

    const tokens: TokenConfig[] = [];

    // ======================================== MOCK TOKENS SECTION (displayed first)
    // Add mock tokens only if requested (easy to remove this entire block)
    if (shouldIncludeMocks) {
        if (networkTokens.MOCK_ERC20) tokens.push(networkTokens.MOCK_ERC20);
        if (networkTokens.MOCK_WBTC) tokens.push(networkTokens.MOCK_WBTC);
        if (networkTokens.MOCK_EURS) tokens.push(networkTokens.MOCK_EURS);
        if (networkTokens.MOCK_USDT) tokens.push(networkTokens.MOCK_USDT);
    }
    // ======================================== END MOCK TOKENS

    // Production tokens
    if (networkTokens.WETH) tokens.push(networkTokens.WETH);
    if (networkTokens.USDC) tokens.push(networkTokens.USDC);
    if (networkTokens.DAI) tokens.push(networkTokens.DAI);

    return tokens;
}

/**
 * Get WETH address for current chain
 */
export function getWETHAddress(chainId: number | string): `0x${string}` | undefined {
    return TOKENS[chainId.toString()]?.WETH?.address;
}

function normalizeAddress(address?: string | null): string {
    return (address || '').trim().toLowerCase();
}

/**
 * Get token symbol from address
 */
export function getTokenSymbolByAddress(chainId: number | string, address: string): string | null {
    const networkTokens = TOKENS[chainId.toString()];
    if (!networkTokens) {
        devLog.warn('⚠️ [getTokenSymbolByAddress] No tokens for chainId:', chainId);
        return null;
    }

    const addressLower = normalizeAddress(address);
    if (!addressLower) {
        return null;
    }
    
    // DEBUG: Log what we're looking up
    devLog.debug('🔍 [getTokenSymbolByAddress] Lookup:', {
        chainId,
        address: addressLower,
        mockERC20Address: normalizeAddress(networkTokens.MOCK_ERC20?.address),
        wethAddress: normalizeAddress(networkTokens.WETH?.address),
        usdcAddress: normalizeAddress(networkTokens.USDC?.address)
    });

    // Standard production tokens
    if (normalizeAddress(networkTokens.WETH?.address) === addressLower) return 'WETH';
    if (normalizeAddress(networkTokens.USDC?.address) === addressLower) return 'USDC';
    if (normalizeAddress(networkTokens.DAI?.address) === addressLower) return 'DAI';

    // ======================================== MOCK TOKENS LOOKUP
    // Check mock tokens (easy to remove this entire block)
    if (normalizeAddress(networkTokens.MOCK_ERC20?.address) === addressLower) return 'MERC20';
    if (normalizeAddress(networkTokens.MOCK_WBTC?.address) === addressLower) return 'MWBTC';
    if (normalizeAddress(networkTokens.MOCK_EURS?.address) === addressLower) return 'MEURS';
    if (normalizeAddress(networkTokens.MOCK_USDT?.address) === addressLower) return 'MUSDT';
    // ======================================== END MOCK TOKENS

    return null;
}

function findTokenSymbolByAddress(address: string): string | null {
    const addressLower = normalizeAddress(address);
    if (!addressLower) {
        return null;
    }

    for (const chainKey of Object.keys(TOKENS)) {
        const networkTokens = TOKENS[chainKey];
        if (!networkTokens) continue;

        for (const token of Object.values(networkTokens)) {
            if (normalizeAddress(token?.address) === addressLower) {
                return token.symbol;
            }
        }
    }

    return null;
}

/**
 * Get currency symbol (ETH, WETH, USDC, DAI)
 * @deprecated Use getCurrencySymbolByAddress with chainId for accurate symbol lookup
 */
export function getCurrencySymbol(currency?: string | null): string {
    if (!currency || isNativeETH(currency)) {
        return 'ETH';
    }
    // Fallback for backward compatibility
    // ⚠️ This cannot determine the correct token without chainId
    return 'WETH';
}

/**
 * Get currency symbol by address with chain context
 */
export function getCurrencySymbolByAddress(chainId: number | string, currency?: string | null): string {
    if (!currency || isNativeETH(currency)) {
        return 'ETH';
    }

    const symbol = getTokenSymbolByAddress(chainId, currency);
    const fallbackSymbol = symbol ? null : findTokenSymbolByAddress(currency);
    
    // DEBUG: Log symbol lookup
    devLog.debug('🔍 [getCurrencySymbolByAddress]', {
        chainId,
        currency,
        symbol,
        fallbackSymbol,
        result: symbol || fallbackSymbol || 'WETH'
    });
    
    return symbol || fallbackSymbol || 'WETH'; // Fallback to WETH for unknown tokens
}

/**
 * Get token decimals by address with chain context
 */
export function getTokenDecimalsByAddress(chainId: number | string, currency?: string | null): number {
    if (!currency || isNativeETH(currency)) {
        return 18;
    }

    const addressLower = normalizeAddress(currency);
    const networkTokens = TOKENS[chainId.toString()];

    if (networkTokens) {
        for (const token of Object.values(networkTokens)) {
            if (token && normalizeAddress(token.address) === addressLower) {
                return token.decimals;
            }
        }
    }

    for (const chainTokens of Object.values(TOKENS)) {
        for (const token of Object.values(chainTokens)) {
            if (token && normalizeAddress(token.address) === addressLower) {
                return token.decimals;
            }
        }
    }

    return 18;
}

/**
 * Check if address is WETH
 */
export function isWETH(chainId: number | string, address: string): boolean {
    const wethAddress = getWETHAddress(chainId);
    return normalizeAddress(wethAddress) === normalizeAddress(address);
}

/**
 * Zero address constant (represents native ETH)
 */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Check if address is native ETH (zero address)
 */
export function isNativeETH(address: string): boolean {
    return normalizeAddress(address) === normalizeAddress(ZERO_ADDRESS);
}

// ========================================
// EXTENDED TOKEN SUPPORT
// ========================================
// Re-export extended token configuration for comprehensive token support
export * from './tokens-extended';


