# NFT Detail Components

**Zweck:** Components die ausschließlich für die NFT Detail Seite verwendet werden.

## Struktur

### Core Components
- `01-core-DetailHeader.tsx` - Header mit NFT Info und Actions
- `02-core-MediaSection.tsx` - NFT Bild/Video Anzeige  
- `03-core-NFTPriceCard.tsx` - Preis und Kauf-Informationen

### Navigation
- `04-navigation-CategoryPills.tsx` - Kategorie-Tags und Links
- `05-navigation-TabNavigation.tsx` - Tab-Navigation für Detail-Ansicht

### Content
- `06-content-InfoTabs.tsx` - Tab-Inhalte (Eigenschaften, Historie, etc.)
- `07-content-CollectionItemsList.tsx` - Weitere NFTs der Collection

### Features  
- `08-features-SwapTargetInfo.tsx` - Tausch-Ziel Informationen
- `NFTInsightsPanel.tsx` - Insights und Analytics Panel

### Utilities
- `09-utils-LoadingSpinner.tsx` - Loading Indikator
- `10-utils-ErrorDisplay.tsx` - Fehler-Anzeige

### Tabs
- `tabs/` - Spezielle Tab-Components für verschiedene Ansichten

## Verwendung

Diese Components werden ausschließlich von der NFT Detail Seite (`app/nft/[nftAddress]/[tokenId]/`) verwendet.
Für wiederverwendbare NFT Components siehe `src/components/nft/`.