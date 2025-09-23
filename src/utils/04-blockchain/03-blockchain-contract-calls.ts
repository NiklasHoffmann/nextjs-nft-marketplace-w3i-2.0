// utils/04-blockchain/03-blockchain-contract-calls.ts
import { createPublicClient, http, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { createFallbackClients, getTimeoutConfig } from './05-blockchain-rpc-config';

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

/**
 * Führt einen einzelnen Contract Call mit Fallback-Unterstützung durch
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
            console.log(`🔄 ${functionName}: Trying RPC endpoint ${i + 1}/${clients.length}`);

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${functionName} timeout after ${timeout}ms`)), timeout)
            );

            const callPromise = clients[i].readContract({
                address,
                abi,
                functionName,
                args,
            });

            const result = await Promise.race([callPromise, timeoutPromise]);

            if (i > 0) {
                console.log(`✅ ${functionName}: Fallback successful on endpoint ${i + 1}`);
            }

            return {
                success: true,
                data: result as T,
                rpcUsed: i + 1
            };

        } catch (error) {
            lastError = error as Error;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`⚠️ ${functionName}: RPC endpoint ${i + 1} failed: ${errorMsg}`);

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
 * Führt mehrere Contract Calls parallel mit intelligenter Fehlerbehandlung durch
 */
export async function executeBatchContractCalls(
    calls: ContractCallOptions[]
): Promise<{
    results: CallResult<any>[],
    successCount: number,
    totalCalls: number
}> {
    console.log(`📦 Executing batch of ${calls.length} contract calls`);

    const startTime = Date.now();
    const results = await Promise.allSettled(
        calls.map(call => executeContractCallWithFallback(call))
    );

    const finalResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error(`❌ Batch call ${index} (${calls[index].functionName}) failed:`, result.reason);
            return {
                success: false,
                error: result.reason?.message || 'Unknown batch error'
            };
        }
    });

    const successCount = finalResults.filter(r => r.success).length;
    const duration = Date.now() - startTime;

    console.log(`📊 Batch completed: ${successCount}/${calls.length} successful in ${duration}ms`);

    return {
        results: finalResults,
        successCount,
        totalCalls: calls.length
    };
}

/**
 * Spezielle Behandlung für kritische Calls (tokenURI)
 */
export async function executeCriticalCall<T>(
    options: Omit<ContractCallOptions, 'callType'>
): Promise<CallResult<T>> {
    const criticalOptions: ContractCallOptions = {
        ...options,
        callType: 'critical',
        timeout: getTimeoutConfig('critical'),
        maxRetries: 5 // Mehr Versuche für kritische Calls
    };

    console.log(`🔑 Executing critical call: ${options.functionName}`);

    const result = await executeContractCallWithFallback<T>(criticalOptions);

    if (!result.success) {
        console.error(`❌ Critical call ${options.functionName} failed after all retries`);
    } else {
        console.log(`✅ Critical call ${options.functionName} succeeded${result.rpcUsed ? ` (RPC ${result.rpcUsed})` : ''}`);
    }

    return result;
}

/**
 * Graceful degradation für optionale Calls
 */
export async function executeOptionalCall<T>(
    options: Omit<ContractCallOptions, 'callType'>,
    defaultValue?: T
): Promise<T | null> {
    const optionalOptions: ContractCallOptions = {
        ...options,
        callType: 'optional',
        timeout: getTimeoutConfig('optional'),
        maxRetries: 2 // Weniger Versuche für optionale Calls
    };

    const result = await executeContractCallWithFallback<T>(optionalOptions);

    if (result.success) {
        return result.data || null;
    } else {
        console.log(`⚠️ Optional call ${options.functionName} failed, using default`);
        return defaultValue || null;
    }
}