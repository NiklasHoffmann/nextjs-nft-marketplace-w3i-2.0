import { devLog } from '@/utils';
import {
    createFallbackClientEntries,
    getTimeoutConfig,
    markRpcEndpointRateLimited,
} from './rpc-config';

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

const RPC_FAILURE_LOG_THROTTLE_MS = 30000;
const rpcFailureLogState = new Map<string, { lastLoggedAt: number; suppressed: number }>();

function isRateLimitError(error: unknown): boolean {
    const safeError = error as any;
    const details = typeof safeError?.details === 'string' ? safeError.details : '';
    const shortMessage = typeof safeError?.shortMessage === 'string' ? safeError.shortMessage : '';
    const message = error instanceof Error ? error.message : String(error ?? '');
    const text = `${message} ${shortMessage} ${details}`.toLowerCase();
    return text.includes('429') || text.includes('too many requests') || text.includes('rate limit');
}

function extractShortErrorMessage(error: unknown): string {
    const safeError = error as any;
    const shortMessage = typeof safeError?.shortMessage === 'string' ? safeError.shortMessage : '';
    const details = typeof safeError?.details === 'string' ? safeError.details : '';
    const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');

    const candidate = shortMessage || details || message;
    return candidate.split('\n')[0]?.trim() || 'Unknown error';
}

function logRpcFailureThrottled(functionName: string, endpointLabel: string, summary: string): void {
    const key = `${functionName}:${endpointLabel}:${summary}`;
    const now = Date.now();
    const state = rpcFailureLogState.get(key);

    if (state && now - state.lastLoggedAt < RPC_FAILURE_LOG_THROTTLE_MS) {
        state.suppressed += 1;
        rpcFailureLogState.set(key, state);
        return;
    }

    const suppressed = state?.suppressed || 0;
    const suffix = suppressed > 0 ? ` (suppressed ${suppressed} similar logs)` : '';
    devLog.warn('contract-calls', `?? ${functionName}: ${endpointLabel} failed: ${summary}${suffix}`);
    rpcFailureLogState.set(key, { lastLoggedAt: now, suppressed: 0 });
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

    const clientEntries = createFallbackClientEntries();
    let lastError: Error | null = null;

    for (let i = 0; i < Math.min(clientEntries.length, maxRetries); i++) {
        try {
            const entry = clientEntries[i];
            if (!entry?.client) continue;

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${functionName} timeout after ${timeout}ms`)), timeout)
            );

            const callPromise = entry.client.readContract({
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
            const entry = clientEntries[i];
            const endpointLabel = `RPC endpoint ${i + 1}${entry?.url ? ` (${entry.url})` : ''}`;
            const errorSummary = extractShortErrorMessage(error);

            if (isDeterministicRevert(error)) {
                logRpcFailureThrottled(functionName, 'deterministic-revert', 'deterministic revert, skipping retries');
                return {
                    success: false,
                    error: errorSummary
                };
            }

            if (entry?.url && isRateLimitError(error)) {
                markRpcEndpointRateLimited(entry.url);
            }

            logRpcFailureThrottled(functionName, endpointLabel, errorSummary);

            if (i < clientEntries.length - 1) {
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

