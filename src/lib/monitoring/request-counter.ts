import { devLog } from '@/utils';

type CounterState = {
    total: number;
    windowCount: number;
    windowStart: number;
    lastLogAt: number;
};

const counters = new Map<string, CounterState>();

const COUNTER_WINDOW_MS = 10 * 60 * 1000;
const COUNTER_LOG_INTERVAL_MS = 30 * 1000;

export function incrementRequestCounter(key: string, incrementBy = 1): void {
    const now = Date.now();
    const existing = counters.get(key);

    if (!existing) {
        const initialState: CounterState = {
            total: incrementBy,
            windowCount: incrementBy,
            windowStart: now,
            lastLogAt: 0,
        };
        counters.set(key, initialState);
        logCounter(key, initialState, now);
        return;
    }

    if (now - existing.windowStart >= COUNTER_WINDOW_MS) {
        existing.windowStart = now;
        existing.windowCount = 0;
    }

    existing.total += incrementBy;
    existing.windowCount += incrementBy;

    if (now - existing.lastLogAt >= COUNTER_LOG_INTERVAL_MS) {
        logCounter(key, existing, now);
    }
}

function logCounter(key: string, state: CounterState, now: number): void {
    state.lastLogAt = now;

    const windowMinutes = Math.round(COUNTER_WINDOW_MS / 60_000);
    devLog.info(
        '[request-counter]',
        `${key}: total=${state.total}, window=${state.windowCount}/${windowMinutes}m`
    );
}

export function getRequestCounterSnapshot(key: string): {
    total: number;
    windowCount: number;
    windowStartedAt: number;
} | null {
    const state = counters.get(key);
    if (!state) {
        return null;
    }

    return {
        total: state.total,
        windowCount: state.windowCount,
        windowStartedAt: state.windowStart,
    };
}

export function getAllRequestCounterSnapshots(): Array<{
    key: string;
    total: number;
    windowCount: number;
    windowStartedAt: number;
}> {
    return Array.from(counters.entries())
        .map(([key, state]) => ({
            key,
            total: state.total,
            windowCount: state.windowCount,
            windowStartedAt: state.windowStart,
        }))
        .sort((a, b) => b.windowCount - a.windowCount || b.total - a.total);
}
