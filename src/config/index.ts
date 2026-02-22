/**
 * CENTRAL CONFIG EXPORTS
 * 
 * All configuration imports go through this barrel export:
 * import { wagmiConfig, HOME_CONFIG, isAdminAddress, GETTER_FACET_ABI } from '@/config'
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
    MULTISIG_OWNER_ADDRESSES,
    ADDITIONAL_ADMIN_ADDRESSES,
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
    getMultisigAddress,
    isSupportedChain,
    type NetworkMapping,
    type NetworkContracts
} from './networks';

// Smart Contract ABIs
export {
    GETTER_FACET_ABI,
    IDEATION_MARKET_FACET_ABI,
    COLLECTION_WHITELIST_FACET_ABI,
    BUYER_WHITELIST_FACET_ABI,
    CURRENCY_WHITELIST_FACET_ABI,
    OWNERSHIP_FACET_ABI,
    PAUSE_FACET_ABI,
    VERSION_FACET_ABI,
    DIAMOND_LOUPE_FACET_ABI,
    DIAMOND_UPGRADE_FACET_ABI,
    DUMMY_UPGRADE_FACET_ABI,
    DIAMOND_CUT_ABI,
    MULTISIG_WALLET_ABI
} from './abis';

// Subgraph Queries
export * from './subgraph';
