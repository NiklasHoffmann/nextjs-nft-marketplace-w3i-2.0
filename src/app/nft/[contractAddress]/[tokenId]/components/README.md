# NFT Detail Components

Components exclusively used for the NFT Detail page.

## Structure

### Core Components
- `DetailHeader.tsx` - Header with NFT info and actions
- `MediaSection.tsx` - NFT image/video display
- `NFTPriceCard.tsx` - Price and purchase information

### Navigation
- `CategoryPills.tsx` - Category tags and links
- `TabNavigation.tsx` - Tab navigation for detail view

### Content
- `InfoTabs.tsx` - Tab content container with all tabs
- `CollectionItemsList.tsx` - More NFTs from the collection

### Features
- `SwapTargetInfo.tsx` - Swap target information

### Utilities
- `LoadingSpinner.tsx` - Loading indicator
- `ErrorDisplay.tsx` - Error display

### Tabs
`tabs/` - Specialized tab components:
- `OverviewTab.tsx` - NFT overview and basic info
- `TechnicalTab.tsx` - Technical and blockchain details
- `InvestmentTab.tsx` - Investment analysis
- `MarketInsightsTab.tsx` - Market insights and analytics
- `PersonalTab.tsx` - Personal user interactions
- `ProjektTab.tsx` - Project information
- `FunctionalitiesTab.tsx` - NFT functionalities
- `TokenomicsTab.tsx` - Tokenomics details

## Data Flow

All data is loaded from MongoDB via unified API endpoint:
- Single MongoDB API call in `page.tsx`
- Data passed down via props
- No NFTContext or TheGraph direct calls

## Usage

These components are used exclusively by the NFT Detail page (`app/nft/[nftAddress]/[tokenId]/`).
For reusable NFT components see `src/components/nft/`.