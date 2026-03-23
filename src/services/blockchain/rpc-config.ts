// utils/04-blockchain/05-blockchain-rpc-config.ts
import { createPublicClient, http, type PublicClient, type Chain } from 'viem';
import { sepolia } from 'viem/chains';
import { devLog } from '@/utils';

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

export interface FallbackRPCClientEntry {
    url: string;
    client: PublicClient;
}

const ENDPOINT_RATE_LIMIT_COOLDOWN_MS = 120000;
const endpointCooldownUntil = new Map<string, number>();

function isEndpointCoolingDown(url: string, now: number = Date.now()): boolean {
    const cooldownUntil = endpointCooldownUntil.get(url) || 0;
    if (cooldownUntil <= now) {
        endpointCooldownUntil.delete(url);
        return false;
    }

    return true;
}

export function markRpcEndpointRateLimited(url: string, cooldownMs: number = ENDPOINT_RATE_LIMIT_COOLDOWN_MS): void {
    endpointCooldownUntil.set(url, Date.now() + cooldownMs);
}

/**
 * Robuste RPC-Konfiguration mit mehreren Backup-Endpoints
 */
export function getRPCEndpoints(): string[] {
    const configuredEndpoints = [
        process.env.ALCHEMY_URL,
        process.env.INFURA_URL,
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://sepolia.gateway.tenderly.co',
        'https://rpc.sepolia.org',
        'https://sepolia.drpc.org'
    ].filter(Boolean) as string[];

    const endpoints = [...new Set(configuredEndpoints)];

    if (endpoints.length === 0) {
        devLog.warn('rpc-config', '⚠️ No RPC endpoints configured! Using fallback.');
        endpoints.push('https://rpc.sepolia.org');
    }

    const now = Date.now();
    const healthy = endpoints.filter((url) => !isEndpointCoolingDown(url, now));
    const cooling = endpoints.filter((url) => isEndpointCoolingDown(url, now));

    return [...healthy, ...cooling];
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
        timeoutMs: 15000 // Erhöht von 8s auf 15s
    };
}

/**
 * Erstellt einen robusten PublicClient mit Fallback-Unterstützung
 */
export function createRobustPublicClient(config?: Partial<ChainRPCConfig>): PublicClient {
    const chainConfig = getChainConfig();
    const finalConfig = { ...chainConfig, ...config };

    // Nutze Primary RPC URL für den initialen Client
    const client = createPublicClient({
        chain: finalConfig.chain,
        transport: http(finalConfig.primaryRpcUrl, {
            timeout: finalConfig.timeoutMs,
        }),
    });

    return client;
}

/**
 * Erstellt mehrere Clients für Fallback-Strategien
 */
export function createFallbackClients(config?: Partial<ChainRPCConfig>): PublicClient[] {
    return createFallbackClientEntries(config).map((entry) => entry.client);
}

/**
 * Erstellt mehrere Clients mit URL-Metadaten für erweiterte Fallback-Strategien
 */
export function createFallbackClientEntries(config?: Partial<ChainRPCConfig>): FallbackRPCClientEntry[] {
    const chainConfig = getChainConfig();
    const finalConfig = { ...chainConfig, ...config };

    return finalConfig.rpcUrls.map((rpcUrl) => ({
        url: rpcUrl,
        client: createPublicClient({
            chain: finalConfig.chain,
            transport: http(rpcUrl, {
                timeout: finalConfig.timeoutMs,
            }),
        }),
    }));
}

/**
 * Führt Contract-Calls mit automatischem Fallback durch
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
            devLog.warn('rpc-config', `⚠️ RPC endpoint ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');

            if (i < clients.length - 1) {
                // Kurze Pause vor dem nächsten Versuch
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }
    }

    throw lastError || new Error('All RPC endpoints failed');
}

/**
 * Spezielle Timeout-Konfiguration für verschiedene Call-Typen
 */
export function getTimeoutConfig(callType: 'critical' | 'optional' | 'batch'): number {
    switch (callType) {
        case 'critical':
            return 20000; // 20s für kritische Calls wie tokenURI
        case 'optional':
            return 10000; // 10s für optionale Calls wie owner/name
        case 'batch':
            return 15000; // 15s für Batch-Calls
        default:
            return 15000;
    }
}
