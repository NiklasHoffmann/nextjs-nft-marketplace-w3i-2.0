/**
 * CENTRAL CONFIG EXPORTS
 * 
 * Alle Konfigurationen importieren von hier:
 * import { wagmiConfig, HOME_CONFIG, isAdminAddress } from '@/config'
 * 
 * Struktur:
 * - app.config.ts: Feature Flags, Home Redirect
 * - admin.ts: Admin-Adressen, Routen-Schutz
 * - wagmi.ts: Web3/Blockchain Konfiguration
 * - apolloClient.ts: GraphQL Client
 */

// App Configuration (Feature Flags, Redirects)
export { HOME_CONFIG, FEATURES } from './app.config';

// Admin Configuration (Access Control)
export {
    ADMIN_ADDRESSES,
    isAdminAddress,
    APP_LOCK_ENABLED,
    PUBLIC_ROUTES,
    ADMIN_ONLY_ROUTES
} from './admin';

// Web3 Configuration (Wagmi, Chains, RPC)
export { wagmiConfig, publicClient, appName } from './wagmi';

// Apollo Client (GraphQL)
export { default as apolloClient } from './apolloClient';
