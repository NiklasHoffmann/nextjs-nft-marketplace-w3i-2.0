/**
 * Development-only logging utility
 * Logs are only shown in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const devLog = {
    info: (...args: any[]) => {
        if (isDev) console.log(...args);
    },

    warn: (...args: any[]) => {
        if (isDev) console.warn(...args);
    },

    error: (...args: any[]) => {
        // Errors should always be logged
        console.error(...args);
    },

    debug: (...args: any[]) => {
        if (isDev) console.debug(...args);
    },

    // Emojis for better visual scanning
    success: (...args: any[]) => {
        if (isDev) console.log('âœ…', ...args);
    },

    fail: (...args: any[]) => {
        if (isDev) console.log('âŒ', ...args);
    },

    event: (...args: any[]) => {
        if (isDev) console.log('ðŸ“¢', ...args);
    },

    cache: (...args: any[]) => {
        if (isDev) console.log('ðŸ’¾', ...args);
    },

    api: (...args: any[]) => {
        if (isDev) console.log('ðŸŒ', ...args);
    }
};
