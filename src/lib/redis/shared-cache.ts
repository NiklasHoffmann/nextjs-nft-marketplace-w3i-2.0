import { getRedisClientIfAvailable } from './client';

interface LocalCacheEntry {
    value: string;
    expiresAt: number;
}

const localCache = new Map<string, LocalCacheEntry>();
const LOCAL_CACHE_MAX_ENTRIES = 5_000;

function cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, entry] of localCache.entries()) {
        if (entry.expiresAt <= now) {
            localCache.delete(key);
        }
    }

    if (localCache.size <= LOCAL_CACHE_MAX_ENTRIES) {
        return;
    }

    const entries = Array.from(localCache.entries())
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = localCache.size - LOCAL_CACHE_MAX_ENTRIES;

    for (let index = 0; index < toRemove; index++) {
        const entry = entries[index];
        if (entry) {
            localCache.delete(entry[0]);
        }
    }
}

export async function getSharedCacheValue<T>(key: string): Promise<T | null> {
    const redis = await getRedisClientIfAvailable();
    if (redis) {
        try {
            const raw = await redis.get(key);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw) as T;
        } catch {
            // Fallback to local cache below
        }
    }

    cleanupLocalCache();
    const localEntry = localCache.get(key);
    if (!localEntry || localEntry.expiresAt <= Date.now()) {
        if (localEntry) {
            localCache.delete(key);
        }
        return null;
    }

    try {
        return JSON.parse(localEntry.value) as T;
    } catch {
        localCache.delete(key);
        return null;
    }
}

export async function setSharedCacheValue<T>(
    key: string,
    value: T,
    ttlSeconds: number
): Promise<void> {
    const serializedValue = JSON.stringify(value);

    const redis = await getRedisClientIfAvailable();
    if (redis) {
        try {
            await redis.set(key, serializedValue, 'EX', ttlSeconds);
            return;
        } catch {
            // Fallback to local cache below
        }
    }

    cleanupLocalCache();
    localCache.set(key, {
        value: serializedValue,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
}

export async function deleteSharedCacheValue(key: string): Promise<void> {
    const redis = await getRedisClientIfAvailable();
    if (redis) {
        try {
            await redis.del(key);
        } catch {
            // Ignore and still clear local fallback
        }
    }

    localCache.delete(key);
}
