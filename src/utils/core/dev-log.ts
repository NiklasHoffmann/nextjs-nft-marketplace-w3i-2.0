/**
 * Development-only logging utility
 * Logs are only shown in development mode
 */

const isDev = process.env.NODE_ENV === 'development';
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const rawLevel = (process.env.DEV_LOG_LEVEL || 'info').toLowerCase() as LogLevel;
const levelRank: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
const currentLevel = levelRank[rawLevel] ?? levelRank.info;
const shouldLog = (minLevel: number) => isDev && currentLevel >= minLevel;

export const devLog = {
    log: (...args: any[]) => {
        if (shouldLog(levelRank.info)) console.log(...args);
    },

    info: (...args: any[]) => {
        if (shouldLog(levelRank.info)) console.log(...args);
    },

    warn: (...args: any[]) => {
        if (shouldLog(levelRank.warn)) console.warn(...args);
    },

    error: (...args: any[]) => {
        // Errors should always be logged
        console.error(...args);
    },

    debug: (...args: any[]) => {
        if (shouldLog(levelRank.debug)) console.debug(...args);
    },

    // ASCII markers for better visual scanning
    success: (...args: any[]) => {
        if (shouldLog(levelRank.info)) console.log('[OK]', ...args);
    },

    fail: (...args: any[]) => {
        if (shouldLog(levelRank.warn)) console.log('[FAIL]', ...args);
    },

    event: (...args: any[]) => {
        if (shouldLog(levelRank.info)) console.log('[EVENT]', ...args);
    },

    cache: (...args: any[]) => {
        if (shouldLog(levelRank.info)) console.log('[CACHE]', ...args);
    },

    api: (...args: any[]) => {
        if (shouldLog(levelRank.info)) console.log('[API]', ...args);
    }
};
