/**
 * Admin Components - Barrel Export
 * 
 * Feature-based structure for better organization.
 * Import from '@/app/admin/components' instead of individual files.
 * 
 * @example
 * ```tsx
 * import { AdminModeIndicator, ProposalCard, InsightsManager } from '@/app/admin/components';
 * ```
 * 
 * @module admin/components
 */

// Global Admin Components
export { default as AdminNavbar } from './AdminNavbar';

// Shared Components (used across features)
export { AdminModeIndicator } from './shared/AdminModeIndicator';
export { MigrationBanner } from './shared/MigrationBanner';

// MultiSig Feature Components
export { ProposalCard } from './multisig/ProposalCard';
export { CreateProposalModal } from './multisig/CreateProposalModal';
export { MultiSigTransactionCard } from './multisig/MultiSigTransactionCard';
export { TransactionBuilder } from './multisig/TransactionBuilder';

// Insights Feature Components
export { default as InsightsManager } from './insights/InsightsManager';
export { default as AdminNFTInsightsManager } from './insights/InsightsManager'; // Backwards compatibility

// Insights - Section Components
export {
    NFTSelector,
    BasicInfoManager,
    TagsManager,
    NFTSpecificDescriptionsManager,
    ProjectLinkManager,
    PartnershipManager,
    RaritySelector,
} from './insights/sections';

// Insights - Form Components
export {
    TitleDescriptionManager,
    DynamicDescriptionManager,
    NFTCardDescriptionsManager,
} from './insights/forms';
