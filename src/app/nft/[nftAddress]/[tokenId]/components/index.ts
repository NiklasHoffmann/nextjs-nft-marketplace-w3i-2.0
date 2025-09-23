// Main components
export { default as NFTDetailHeader } from './01-core-DetailHeader';
export { default as CategoryPills } from './04-navigation-CategoryPills';
export { default as NFTMediaSection } from './02-core-MediaSection';
export { default as NFTPriceCard } from './03-core-NFTPriceCard';
export { default as TabNavigation } from './05-navigation-TabNavigation';
export { default as NewNFTInfoTabs } from './06-content-InfoTabs';
export { default as SwapTargetInfo } from './08-features-SwapTargetInfo';
export { default as CollectionItemsList } from './07-content-CollectionItemsList';
export { default as LoadingSpinner } from './09-utils-LoadingSpinner';
export { default as NFTDetailErrorDisplay } from './10-utils-ErrorDisplay';
// Note: ErrorDisplay is exported from ui components to avoid conflicts

// New Tab components
export { default as OverviewTab } from './tabs/02-OverviewTab';
export { default as TechnicalTab } from './tabs/03-TechnicalTab';
export { default as InvestmentTab } from './tabs/04-InvestmentTab';
export { default as ProjektTab } from './tabs/01-ProjektTab';
export { default as MarketInsightsTab } from './tabs/05-MarketInsightsTab';
export { default as PersonalTab } from './tabs/06-PersonalTab';

// Legacy Tab components (kept for backward compatibility)
export { default as FunctionalitiesTab } from './tabs/07-FunctionalitiesTab';
export { default as TokenomicsTab } from './tabs/08-TokenomicsTab';
