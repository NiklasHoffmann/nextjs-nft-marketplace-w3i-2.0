// utils/bigint.ts
// Add BigInt serialization support for JSON.stringify

// Extend BigInt prototype to add toJSON method
declare global {
    interface BigInt {
        toJSON(): string;
    }
}

// Add BigInt serialization method
if (typeof BigInt !== 'undefined') {
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };
}

// Safe JSON stringify that handles BigInt
export const safeStringify = (obj: any): string => {
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
};

// Parse BigInt values from strings when needed
export const parseBigIntFields = (obj: any, fields: string[]): any => {
    const result = { ...obj };
    fields.forEach(field => {
        if (result[field] && typeof result[field] === 'string') {
            try {
                result[field] = result[field];
            } catch (error) {
                console.warn(`Failed to parse BigInt for field ${field}:`, error);
            }
        }
    });
    return result;
};

export default {};
