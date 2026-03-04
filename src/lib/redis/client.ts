import Redis from 'ioredis';
import { devLog } from '@/utils';

type RedisClient = Redis;

const redisUrl = process.env.REDIS_URL?.trim();
const redisDisabled = process.env.REDIS_DISABLED === 'true';

let redisClient: RedisClient | null = null;
let redisAvailable = false;
let warnedUnavailable = false;

export interface RedisHealthStatus {
    mode: 'redis' | 'memory';
    configured: boolean;
    disabled: boolean;
    available: boolean;
    clientStatus: string;
    pingMs: number | null;
}

function createRedisClient(): RedisClient | null {
    if (!redisUrl || redisDisabled) {
        return null;
    }

    try {
        const client = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            enableAutoPipelining: true,
        });

        client.on('error', (error) => {
            redisAvailable = false;
            if (!warnedUnavailable) {
                warnedUnavailable = true;
                devLog.warn('⚠️ Redis unavailable, falling back to in-memory cache/rate-limit:', error instanceof Error ? error.message : error);
            }
        });

        client.on('ready', () => {
            redisAvailable = true;
            warnedUnavailable = false;
            devLog.info('✅ Redis connected');
        });

        return client;
    } catch (error) {
        if (!warnedUnavailable) {
            warnedUnavailable = true;
            devLog.warn('⚠️ Failed to initialize Redis client, falling back to in-memory mode:', error instanceof Error ? error.message : error);
        }
        return null;
    }
}

export function getRedisClient(): RedisClient | null {
    if (redisClient) {
        return redisClient;
    }

    redisClient = createRedisClient();
    return redisClient;
}

export async function getRedisClientIfAvailable(): Promise<RedisClient | null> {
    const client = getRedisClient();
    if (!client) {
        return null;
    }

    if (client.status === 'ready' || client.status === 'connect') {
        return client;
    }

    try {
        await client.connect();
        redisAvailable = true;
        warnedUnavailable = false;
        return client;
    } catch (error) {
        redisAvailable = false;
        if (!warnedUnavailable) {
            warnedUnavailable = true;
            devLog.warn('⚠️ Redis connect failed, using in-memory fallback:', error instanceof Error ? error.message : error);
        }
        return null;
    }
}

export function isRedisConfigured(): boolean {
    return Boolean(redisUrl) && !redisDisabled;
}

export function isRedisAvailable(): boolean {
    return redisAvailable;
}

export async function getRedisHealthStatus(): Promise<RedisHealthStatus> {
    const configured = Boolean(redisUrl);
    const disabled = redisDisabled;

    if (!configured || disabled) {
        return {
            mode: 'memory',
            configured,
            disabled,
            available: false,
            clientStatus: disabled ? 'disabled' : 'not-configured',
            pingMs: null,
        };
    }

    const client = await getRedisClientIfAvailable();
    if (!client) {
        return {
            mode: 'memory',
            configured,
            disabled,
            available: false,
            clientStatus: redisClient?.status || 'disconnected',
            pingMs: null,
        };
    }

    try {
        const start = Date.now();
        await client.ping();
        const pingMs = Date.now() - start;

        return {
            mode: 'redis',
            configured,
            disabled,
            available: true,
            clientStatus: client.status,
            pingMs,
        };
    } catch {
        return {
            mode: 'memory',
            configured,
            disabled,
            available: false,
            clientStatus: client.status,
            pingMs: null,
        };
    }
}
