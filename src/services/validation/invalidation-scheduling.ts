export interface RetryScheduler {
    schedule: (delayMs: number, action: () => void) => void;
    clear: () => void;
}

export function createRetryScheduler(): RetryScheduler {
    let primaryTimeout: NodeJS.Timeout | null = null;
    let secondaryTimeout: NodeJS.Timeout | null = null;

    const clear = () => {
        if (primaryTimeout) {
            clearTimeout(primaryTimeout);
            primaryTimeout = null;
        }
        if (secondaryTimeout) {
            clearTimeout(secondaryTimeout);
            secondaryTimeout = null;
        }
    };

    const schedule = (delayMs: number, action: () => void) => {
        clear();

        primaryTimeout = setTimeout(action, delayMs);
        secondaryTimeout = setTimeout(action, delayMs * 2);
    };

    return { schedule, clear };
}

export function createDebouncedScheduler(): RetryScheduler {
    let timeout: NodeJS.Timeout | null = null;

    const clear = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    const schedule = (delayMs: number, action: () => void) => {
        clear();
        timeout = setTimeout(action, delayMs);
    };

    return { schedule, clear };
}
