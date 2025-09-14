// Global configuration and polyfills for the NFT marketplace application
// BigInt serialization setup for Next.js

// Make BigInt serializable in JSON.stringify
if (typeof globalThis !== 'undefined' && typeof BigInt !== 'undefined') {
    // Override BigInt's toJSON method
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };
}

// Safe console.log for BigInt values
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const safeSerialize = (args: any[]) => {
    return args.map(arg => {
        if (typeof arg === 'bigint') {
            return arg.toString();
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.parse(JSON.stringify(arg));
            } catch {
                return arg;
            }
        }
        return arg;
    });
};

console.log = (...args) => originalConsoleLog(...safeSerialize(args));
console.error = (...args) => originalConsoleError(...safeSerialize(args));
console.warn = (...args) => originalConsoleWarn(...safeSerialize(args));

export { };