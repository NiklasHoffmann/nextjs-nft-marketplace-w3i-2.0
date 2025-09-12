# 🚀 NFT Marketplace 2.0 - Refactored & Optimized

A modern, full-stack NFT marketplace built with Next.js 15, TypeScript, and Web3 technologies. **Recently refactored for improved maintainability, performance, and code organization.**

![NFT Marketplace](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 🎯 **Recent Refactoring Highlights** ⚡

### **Complete NFT Detail Page Refactoring**
- **Reduced from 930+ lines to 250 lines** in main component
- **Extracted 13+ reusable components** for better maintainability
- **Centralized types and utilities** for consistency
- **Performance optimized** with React hooks (useCallback, useMemo)
- **Enhanced error handling** and validation

### **New Architecture Benefits**
- ✅ **Modular Components** - Each component has a single responsibility
- ✅ **Centralized Type System** - All types organized in `/src/types`
- ✅ **Utility Functions** - Reusable helpers in `/src/utils/nft-helpers.ts`
- ✅ **Performance Optimized** - React best practices implemented
- ✅ **Type-Safe** - Complete TypeScript coverage
- ✅ **Clean Imports** - Organized export structure

## ✨ Features

### 🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
- **Refactored component structure** for better maintainability
- Optimized image loading with Next.js Image component
- Smooth animations and transitions
- Mobile-first approach
- Accessible components with ARIA support

### 🔗 **Web3 Integration**
- Multi-chain support (Ethereum, Polygon, etc.)
- Wallet connectivity with RainbowKit
- Smart contract interactions with Wagmi & Viem
- ERC-721 and ERC-2981 standard support
- Real-time blockchain data synchronization

### 💾 **Data Management**
- GraphQL integration with Apollo Client
- Efficient caching and state management
- **Centralized type definitions** for better consistency
- Real-time updates via WebSocket subscriptions
- Error handling and retry mechanisms
- Optimized data fetching strategies

### 🖼️ **NFT Features**
- **Completely refactored NFT detail pages** with modular components
- Support for images, videos, and animations
- **Tabbed interface** (Project/Functionalities/Tokenomics)
- IPFS gateway integration with fallbacks
- Attribute filtering and search
- Collection browsing
- **Smart validation** for NFT addresses and token IDs

### 💰 **Marketplace Functionality**
- Active listings display
- Price tracking in multiple currencies
- Transaction history
- Seller/Buyer information
- Real-time marketplace updates

## 🛠️ Tech Stack

### **Frontend**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React 18](https://react.dev/)** - Component library with concurrent features

### **Web3**
- **[Wagmi](https://wagmi.sh/)** - React hooks for Ethereum
- **[Viem](https://viem.sh/)** - TypeScript interface for Ethereum
- **[RainbowKit](https://www.rainbowkit.com/)** - Wallet connection interface

### **Data & State**
- **[Apollo Client](https://www.apollographql.com/docs/react/)** - GraphQL client
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[React Error Boundary](https://github.com/bvaughn/react-error-boundary)** - Error handling

### **Development**
- **[ESLint](https://eslint.org/)** - Code linting
- **[Turbopack](https://turbo.build/pack)** - Fast development bundler

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nextjs-nft-marketplace-w3i-2.0.git
   cd nextjs-nft-marketplace-w3i-2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following environment variables:
   ```env
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Web3 Configuration
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

   # GraphQL Subgraph
   NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/your-subgraph
   NEXT_PUBLIC_SUBGRAPH_WS_URL=wss://api.thegraph.com/subgraphs/name/your-subgraph

   # API Keys
   COINGECKO_API_KEY=your_coingecko_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure (Updated)

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── nft-metadata/  # NFT metadata endpoints
│   │   ├── test/          # Health check
│   │   └── web3/          # Web3 interaction endpoints
│   ├── nft/               # NFT detail pages
│   │   └── [nftAddress]/[tokenId]/  # Refactored dynamic routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── nft-detail/       # 🆕 Refactored NFT detail components
│   │   ├── tabs/         # Tab components
│   │   │   ├── ProjectTab.tsx
│   │   │   ├── FunctionalitiesTab.tsx
│   │   │   └── TokenomicsTab.tsx
│   │   ├── NFTDetailHeader.tsx
│   │   ├── CategoryPills.tsx
│   │   ├── NFTMediaSection.tsx
│   │   ├── NFTPriceCard.tsx
│   │   ├── NFTInfoTabs.tsx
│   │   ├── PropertiesDisplay.tsx
│   │   ├── SwapTargetInfo.tsx
│   │   ├── CollectionItemsList.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorDisplay.tsx
│   │   └── index.ts      # Clean exports
│   ├── features/         # Feature-specific components
│   │   ├── ActiveItemsList.tsx
│   │   ├── NFTCard.tsx
│   │   └── OptimizedNFTImage.tsx
│   ├── ui/               # Reusable UI components
│   ├── CurrencySelector.tsx
│   ├── Navbar.tsx
│   └── Web3Provider.tsx
├── contexts/             # React contexts
│   └── CurrencyContext.tsx
├── hooks/                # Custom React hooks
│   ├── useImageCache.tsx
│   ├── useNFTMetadata.ts
│   └── useNFTMetadataOptimized.ts
├── lib/                  # Library configurations
│   ├── config.ts         # App configuration
│   └── utils.ts          # Utility functions
├── types/                # 🆕 Centralized TypeScript types
│   ├── nft.ts           # Core NFT types
│   ├── nft-detail.ts    # 🆕 NFT detail page types
│   ├── currency.ts      # Currency types
│   ├── ui.ts           # UI component types
│   └── index.ts        # Type exports
├── utils/                # 🆕 Enhanced utility functions
│   ├── nft-helpers.ts   # 🆕 NFT-specific utilities
│   ├── bigint.ts        # BigInt utilities
│   ├── contracts.ts     # Smart contract utilities
│   ├── formatters.ts    # Data formatting
│   ├── media.ts         # Media handling
│   ├── validation.ts    # Input validation
│   └── index.ts         # Clean exports
├── constants/           # Application constants
├── config/              # Configuration files
└── ui/                  # UI layout components
```

## 🎨 Key Features Deep Dive

### **🆕 Refactored NFT Detail Pages**
**Before**: 930+ lines monolithic component
**After**: Clean, modular architecture with 13+ components

#### **New Components Structure:**
- **`NFTDetailHeader`** - Navigation, title, and actions (share, favorite)
- **`CategoryPills`** - Categories, tags, and external links display
- **`NFTMediaSection`** - Media display (images, videos, audio)
- **`NFTPriceCard`** - Price display and purchase actions
- **`NFTInfoTabs`** - Container for tabbed content
  - **`ProjectTab`** - Project info, metadata, and attributes
  - **`FunctionalitiesTab`** - Contract capabilities and functions
  - **`TokenomicsTab`** - Economic data and market analysis
- **`PropertiesDisplay`** - NFT properties visualization
- **`SwapTargetInfo`** - Swap target information
- **`CollectionItemsList`** - More items from collection
- **`LoadingSpinner`** - Consistent loading states
- **`ErrorDisplay`** - Error handling component

#### **Performance Optimizations:**
- ✅ **useCallback** for event handlers
- ✅ **useMemo** for expensive computations
- ✅ **React.memo** where appropriate
- ✅ **Optimized re-renders** with proper dependency arrays
- ✅ **Parameter validation** with custom validators

### **🆕 Centralized Utility Functions**
Located in `/src/utils/nft-helpers.ts`:

```typescript
// Address formatting
truncateAddress(address, startLength?, endLength?)

// NFT display names
formatNFTDisplayName(name?, tokenId?, fallback?)
formatCollectionDisplayName(contractName?, collection?, symbol?, address?)

// Media type detection
getMediaType(imageUrl?, animationUrl?, videoUrl?, audioUrl?)

// Rarity information formatting
formatRarityInfo(rarityRank?, rarityScore?)

// Validation utilities
isValidNFTAddress(address)
isValidNFTTokenId(tokenId)

// And more...
```

### **🆕 Centralized Type System**
All types organized in `/src/types/`:
- **`nft.ts`** - Core NFT interfaces
- **`nft-detail.ts`** - NFT detail page specific types
- **`currency.ts`** - Currency and pricing types
- **`ui.ts`** - UI component types

### **Smart Contract Integration**
- Official Wagmi/Viem ABIs for better maintainability
- Parallel contract calls for comprehensive NFT data
- Support for ERC-721 standard functions
- Support for EIP-2981 royalty information
- Robust error handling and fallbacks

### **Image Optimization**
- Next.js Image component with performance optimizations
- IPFS URL conversion with gateway fallbacks
- Lazy loading and progressive enhancement
- Video file support with fallback to images
- Consistent styling with rounded corners

## 🔧 Configuration

### **Blockchain Networks**

Configure supported networks in `src/lib/config.ts`:

```typescript
export const WEB3_CONFIG = {
  defaultChainId: 1, // Ethereum Mainnet
  supportedChainIds: [1, 5, 11155111], // Mainnet, Goerli, Sepolia
  infuraProjectId: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
}
```

### **Currency Support**

Configure supported currencies:

```typescript
export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    decimals: 18,
  },
  // ... other currencies
]
```

## 🚢 Deployment

### **Vercel (Recommended)**

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy - Vercel will automatically build and deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nextjs-nft-marketplace-w3i-2.0)

### **Build Commands**
```bash
# Production build
npm run build

# Start production server
npm start

# Development with Turbopack
npm run dev
```

## 🧪 Development

### **Code Quality**
```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build verification
npm run build
```

### **Performance Optimization**
- Turbopack for fast development builds
- Next.js Image optimization for media
- React Query for efficient data caching
- Lazy loading for components and images
- **Optimized React patterns** with hooks
- **Modular architecture** for tree shaking

## 🔍 API Routes

### **NFT Metadata** - `/api/nft-metadata`
- Fetches and processes NFT metadata from multiple sources
- IPFS gateway integration with fallbacks
- Caching for improved performance

### **Web3 TokenURI** - `/api/web3/tokenURI`
- Direct smart contract interaction for token URIs
- Supports various contract standards
- Error handling for contract calls

### **Health Check** - `/api/test`
- Application health monitoring
- Configuration verification
- Environment status check

## 🔄 Refactoring Benefits

### **Before Refactoring:**
- ❌ 930+ line monolithic component
- ❌ Scattered type definitions
- ❌ Repeated utility code
- ❌ Hard to maintain and test
- ❌ Poor performance with unnecessary re-renders

### **After Refactoring:**
- ✅ **13+ modular components** (~50-100 lines each)
- ✅ **Centralized type system** with full TypeScript coverage
- ✅ **Reusable utility functions** with comprehensive helpers
- ✅ **Easy to maintain and extend** with clear separation of concerns
- ✅ **Performance optimized** with React best practices
- ✅ **Consistent code patterns** across all components
- ✅ **Better error handling** with dedicated error components

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. **Follow the new modular architecture** patterns
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m 'feat: add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### **Development Guidelines**
- Use TypeScript for all new code
- **Follow the modular component architecture**
- **Use centralized types** from `/src/types`
- **Leverage utility functions** from `/src/utils/nft-helpers.ts`
- Add proper error handling and loading states
- Update types when adding new features
- Write clear, self-documenting code
- Test cross-browser compatibility
- **Use React performance patterns** (useCallback, useMemo)

## 📈 Performance Metrics

### **Bundle Size Improvements:**
- **NFT Detail Page**: Reduced from 10.3kB to optimized modular loading
- **Tree Shaking**: Better with modular exports
- **Code Splitting**: Improved with component-based architecture

### **Development Experience:**
- **Faster builds** with modular structure
- **Better IntelliSense** with centralized types
- **Easier debugging** with component isolation
- **Simplified testing** with focused components

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Next.js Team](https://nextjs.org/)** - React framework
- **[Wagmi Contributors](https://wagmi.sh/)** - Web3 React hooks
- **[Viem Team](https://viem.sh/)** - TypeScript Ethereum interface
- **[The Graph Protocol](https://thegraph.com/)** - Decentralized data indexing
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/nextjs-nft-marketplace-w3i-2.0/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/nextjs-nft-marketplace-w3i-2.0/discussions)
- **Documentation**: [Project Wiki](https://github.com/yourusername/nextjs-nft-marketplace-w3i-2.0/wiki)

---

**Built with ❤️ for the Web3 community**

*Recently refactored and optimized for better performance, maintainability, and developer experience.*