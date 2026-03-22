// utils/04-blockchain/03-blockchain-contract-calls.ts
import { createPublicClient, http, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { devLog } from '@/utils';
import { createFallbackClients, getTimeoutConfig } from './rpc-config';

interface ContractCallOptions {
    address: `0x${string}`;
    abi: any;
    functionName: string;
    args?: any[];
    timeout?: number;
    maxRetries?: number;
    callType?: 'critical' | 'optional' | 'batch';
}

interface CallResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    rpcUsed?: number;
}

function isDeterministicRevert(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return message.includes('execution reverted') || message.includes('revert');
}

/**
 * F�hrt einen einzelnen Contract Call mit Fallback-Unterst�tzung durch
 */
export async function executeContractCallWithFallback<T>(
    options: ContractCallOptions
): Promise<CallResult<T>> {
    const {
        address,
        abi,
        functionName,
        args = [],
        timeout = getTimeoutConfig(options.callType || 'optional'),
        maxRetries = 3
    } = options;

    const clients = createFallbackClients();
    let lastError: Error | null = null;

    for (let i = 0; i < Math.min(clients.length, maxRetries); i++) {
        try {
            const client = clients[i];
            if (!client) continue;

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${functionName} timeout after ${timeout}ms`)), timeout)
            );

            const callPromise = client.readContract({
                address,
                abi,
                functionName,
                args,
            });

            const result = await Promise.race([callPromise, timeoutPromise]);

            if (i > 0) {

            }

            return {
                success: true,
                data: result as T,
                rpcUsed: i + 1
            };

        } catch (error) {
            lastError = error as Error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            if (isDeterministicRevert(error)) {
                devLog.warn('contract-calls', `⚠️ ${functionName}: deterministic revert, skipping retries`);
                return {
                    success: false,
                    error: errorMsg
                };
            }

            devLog.warn('contract-calls', `?? ${functionName}: RPC endpoint ${i + 1} failed: ${errorMsg}`);

            if (i < clients.length - 1) {
                // Progressive delay: 500ms, 1000ms, 1500ms
                const delay = 500 * (i + 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return {
        success: false,
        error: lastError?.message || 'All RPC endpoints failed'
    };
}

/**
 * F�hrt mehrere Contract Calls parallel mit intelligenter Fehlerbehandlung durch
 */
export async function executeBatchContractCalls(
    calls: ContractCallOptions[]
): Promise<{
    results: CallResult<any>[],
    successCount: number,
    totalCalls: number
}> {

    const startTime = Date.now();
    const results = await Promise.allSettled(
        calls.map(call => executeContractCallWithFallback(call))
    );

    const finalResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            const call = calls[index];
            const functionName = call?.functionName || 'unknown';
            devLog.error('contract-calls', `? Batch call ${index} (${functionName}) failed:`, result.reason);
            return {
                success: false,
                error: result.reason?.message || 'Unknown batch error'
            };
        }
    });

    const successCount = finalResults.filter(r => r.success).length;
    const duration = Date.now() - startTime;

    return {
        results: finalResults,
        successCount,
        totalCalls: calls.length
    };
}

/**
 * Spezielle Behandlung f�r kritische Calls (tokenURI)
 */
export async function executeCriticalCall<T>(
    options: Omit<ContractCallOptions, 'callType'>
): Promise<CallResult<T>> {
    const criticalOptions: ContractCallOptions = {
        ...options,
        callType: 'critical',
        timeout: getTimeoutConfig('critical'),
        maxRetries: 5 // Mehr Versuche f�r kritische Calls
    };

    const result = await executeContractCallWithFallback<T>(criticalOptions);

    if (!result.success) {
        devLog.error('contract-calls', `? Critical call ${options.functionName} failed after all retries`);
    }

    return result;
}

/**
 * Graceful degradation f�r optionale Calls
 */
export async function executeOptionalCall<T>(
    options: Omit<ContractCallOptions, 'callType'>,
    defaultValue?: T
): Promise<T | null> {
    const optionalOptions: ContractCallOptions = {
        ...options,
        callType: 'optional',
        timeout: getTimeoutConfig('optional'),
        maxRetries: 2 // Weniger Versuche f�r optionale Calls
    };

    const result = await executeContractCallWithFallback<T>(optionalOptions);

    if (result.success) {
        return result.data || null;
    } else {

        return defaultValue || null;
    }
}

