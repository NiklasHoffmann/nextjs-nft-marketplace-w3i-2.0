/**
 * CENTRAL CONFIG EXPORTS
 * 
 * All configuration imports go through this barrel export:
 * import { wagmiConfig, HOME_CONFIG, isAdminAddress, MARKETPLACE_ABI } from '@/config'
 * 
 * Structure:
 * - app.config.ts: Feature Flags, Home Redirect
 * - admin.ts: Admin Addresses, Route Protection
 * - wagmi.ts: Web3/Blockchain Configuration
 * - apolloClient.ts: GraphQL Client
 * - networks.ts: Network Config, Contract Addresses
 * - abis/: Smart Contract ABIs (TypeScript)
 * - subgraph/: GraphQL Queries for TheGraph
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

// Network Configuration (Contract Addresses, Chain Helpers)
export {
    NETWORK_CONFIG,
    getMarketplaceAddress,
    isSupportedChain,
    type NetworkMapping,
    type NetworkContracts
} from './networks';

// Smart Contract ABIs
export {
    MARKETPLACE_ABI,
    MULTISIG_WALLET_ABI,
    DIAMOND_ABI
} from './abis';

// Subgraph Queries
export * from './subgraph';
