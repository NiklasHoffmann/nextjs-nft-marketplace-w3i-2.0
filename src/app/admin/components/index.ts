/**
 * Admin Components - Barrel Export
 * 
 * Central export point for all admin-specific components.
 * Import from '@/app/admin/components' instead of individual files.
 * 
 * @example
 * ```tsx
 * import { AdminModeIndicator, ProposalCard } from '@/app/admin/components';
 * ```
 * 
 * @module admin/components
 */

// UI Components
export { AdminModeIndicator } from './ui/AdminModeIndicator';
export { MigrationBanner } from './ui/MigrationBanner';

// MultiSig Components
export { ProposalCard } from './multisig/ProposalCard';
export { CreateProposalModal } from './multisig/CreateProposalModal';
export { MultiSigTransactionCard } from './multisig/MultiSigTransactionCard';
export { TransactionBuilder } from './multisig/TransactionBuilder';

// Insights Management Components (original admin components)
export { default as AdminNFTInsightsManager } from './AdminNFTInsightsManager';

// Section Components
export {
    NFTSelector,
    BasicInfoManager,
    TagsManager,
    NFTSpecificDescriptionsManager,
    ProjectLinkManager,
    PartnershipManager,
    RaritySelector,
} from './sections';

// Form Components
export {
    TitleDescriptionManager,
    DynamicDescriptionManager,
    NFTCardDescriptionsManager,
} from './forms';
