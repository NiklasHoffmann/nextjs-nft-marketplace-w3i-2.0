// utils/04-blockchain/05-blockchain-rpc-config.ts
import { createPublicClient, http, type PublicClient, type Chain, type Transport } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

interface RPCEndpointConfig {
    endpoints: string[];
    maxRetries: number;
    timeoutMs: number;
}

interface ChainRPCConfig {
    chain: Chain;
    rpcUrls: string[];
    primaryRpcUrl: string;
    maxRetries: number;
    timeoutMs: number;
}

/**
 * Robuste RPC-Konfiguration mit mehreren Backup-Endpoints
 */
export function getRPCEndpoints(): string[] {
    const endpoints = [
        process.env.ALCHEMY_URL,
        process.env.INFURA_URL,
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://sepolia.gateway.tenderly.co',
        'https://rpc.sepolia.org',
        'https://sepolia.drpc.org'
    ].filter(Boolean) as string[];

    if (endpoints.length === 0) {
        console.warn('âš ï¸ No RPC endpoints configured! Using fallback.');
        endpoints.push('https://rpc.sepolia.org');
    }

    return endpoints;
}

/**
 * Erweiterte Chain-Konfiguration mit Fallback-Strategien
 */
export function getChainConfig(): ChainRPCConfig {
    const endpoints = getRPCEndpoints();
    return {
        chain: sepolia,
        rpcUrls: endpoints,
        primaryRpcUrl: endpoints[0] || 'https://rpc.sepolia.org',
        maxRetries: 3,
        timeoutMs: 15000 // ErhÃ¶ht von 8s auf 15s
    };
}

/**
 * Erstellt einen robusten PublicClient mit Fallback-UnterstÃ¼tzung
 */
export function createRobustPublicClient(config?: Partial<ChainRPCConfig>): PublicClient {
    const chainConfig = getChainConfig();
    const finalConfig = { ...chainConfig, ...config };

    // Nutze Primary RPC URL fÃ¼r den initialen Client
    const client = createPublicClient({
        chain: finalConfig.chain,
        transport: http(finalConfig.primaryRpcUrl, {
            timeout: finalConfig.timeoutMs,
        }),
    });

    return client;
}

/**
 * Erstellt mehrere Clients fÃ¼r Fallback-Strategien
 */
export function createFallbackClients(config?: Partial<ChainRPCConfig>): PublicClient[] {
    const chainConfig = getChainConfig();
    const finalConfig = { ...chainConfig, ...config };

    return finalConfig.rpcUrls.map(rpcUrl =>
        createPublicClient({
            chain: finalConfig.chain,
            transport: http(rpcUrl, {
                timeout: finalConfig.timeoutMs,
            }),
        })
    );
}

/**
 * FÃ¼hrt Contract-Calls mit automatischem Fallback durch
 */
export async function executeWithFallback<T>(
    operation: (client: PublicClient) => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    const clients = createFallbackClients();
    let lastError: Error | null = null;

    for (let i = 0; i < Math.min(clients.length, maxRetries); i++) {
        try {
            const client = clients[i];
            if (!client) continue;

            const result = await operation(client);
            if (i > 0) {

            }
            return result;
        } catch (error) {
            lastError = error as Error;
            console.warn(`âš ï¸ RPC endpoint ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');

            if (i < clients.length - 1) {
                // Kurze Pause vor dem nÃ¤chsten Versuch
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }
    }

    throw lastError || new Error('All RPC endpoints failed');
}

/**
 * Spezielle Timeout-Konfiguration fÃ¼r verschiedene Call-Typen
 */
export function getTimeoutConfig(callType: 'critical' | 'optional' | 'batch'): number {
    switch (callType) {
        case 'critical':
            return 20000; // 20s fÃ¼r kritische Calls wie tokenURI
        case 'optional':
            return 10000; // 10s fÃ¼r optionale Calls wie owner/name
        case 'batch':
            return 15000; // 15s fÃ¼r Batch-Calls
        default:
            return 15000;
    }
}
