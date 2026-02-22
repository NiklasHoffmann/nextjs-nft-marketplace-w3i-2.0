/**
 * Admin Configuration
 * Zentrale Konfiguration für Admin-Zugriff
 */

const parseAddressList = (addresses: string | undefined): string[] => {
    if (!addresses) return [];
    return addresses
        .split(',')
        .map(addr => addr.trim().toLowerCase())
        .filter(addr => addr.length > 0);
};

const unique = (addresses: string[]): string[] => [...new Set(addresses)];

// PRIMARY SOURCE: MultiSig owners (env-driven mirror of on-chain owners)
export const MULTISIG_OWNER_ADDRESSES = unique(parseAddressList(
    process.env.NEXT_PUBLIC_MULTISIG_OWNER_ADDRESSES || process.env.MULTISIG_OWNER_ADDRESSES
));

// ADDITIONAL SOURCE: Extra break-glass / service / temporary admin wallets
export const ADDITIONAL_ADMIN_ADDRESSES = unique(parseAddressList(
    process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_ADMIN_ADDRESSES
));

// Legacy compatibility fallback to avoid lockout when multisig list is not configured yet
const LEGACY_ADMIN_ADDRESSES = unique(parseAddressList(
    process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES
));

export const ADMIN_ADDRESSES = unique(
    MULTISIG_OWNER_ADDRESSES.length > 0
        ? [...MULTISIG_OWNER_ADDRESSES, ...ADDITIONAL_ADMIN_ADDRESSES]
        : LEGACY_ADMIN_ADDRESSES
);

/**
 * Prüft ob eine Wallet-Adresse Admin-Rechte hat
 */
export const isAdminAddress = (address: string | undefined | null): boolean => {
    if (!address) return false;
    const normalized = address.toLowerCase();
    return ADMIN_ADDRESSES.includes(normalized);
};

/**
 * App-weite Sperre aktiviert?
 * Wenn true, haben nur Admins Zugriff auf die gesamte App
 */
export const APP_LOCK_ENABLED = process.env.NEXT_PUBLIC_APP_LOCK_ENABLED === 'true';

/**
 * Öffentliche Routen die auch bei aktivierter App-Sperre erreichbar sind
 */
export const PUBLIC_ROUTES = [
    '/api/auth', // Auth-Endpoints müssen öffentlich bleiben
];

/**
 * Routen die immer Admin-Rechte erfordern (auch ohne App-Sperre)
 */
export const ADMIN_ONLY_ROUTES = [
    '/admin',
    '/api/nft/admin',
];
