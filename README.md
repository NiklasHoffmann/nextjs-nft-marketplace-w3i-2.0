# 🚀 NFT Marketplace 2.0

A modern, full-stack NFT marketplace built with Next.js 15, TypeScript, and Web3 technologies. This application provides a seamless experience for browsing, viewing, and interacting with NFTs across different blockchain networks.

![NFT Marketplace](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

### 🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
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
- Real-time updates via WebSocket subscriptions
- Error handling and retry mechanisms
- Optimized data fetching strategies

### 🖼️ **NFT Features**
- Comprehensive NFT metadata display
- Support for images, videos, and animations
- IPFS gateway integration with fallbacks
- Attribute filtering and search
- Collection browsing
- Detailed NFT information pages with tabs

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

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── nft-metadata/  # NFT metadata endpoints
│   │   ├── test/          # Health check
│   │   └── web3/          # Web3 interaction endpoints
│   ├── nft/               # NFT detail pages
│   │   └── [nftAddress]/[tokenId]/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── features/         # Feature-specific components
│   │   ├── ActiveItemsList.tsx
│   │   ├── NFTCard.tsx
│   │   └── OptimizedNFTImage.tsx
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorDisplay.tsx
│   │   └── Loading.tsx
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
├── types/                # TypeScript type definitions
│   ├── currency.ts       # Currency types
│   ├── nft.ts           # NFT-related types
│   ├── ui.ts            # UI component types
│   └── index.ts         # Type exports
├── utils/                # Utility functions
│   ├── bigint.ts        # BigInt utilities
│   ├── contracts.ts     # Smart contract utilities
│   ├── formatters.ts    # Data formatting
│   ├── media.ts         # Media handling
│   └── validation.ts    # Input validation
├── constants/           # Application constants
│   ├── index.js
│   └── subgraph.queries.ts
├── config/              # Configuration files
│   ├── apolloClient.ts
│   └── wagmi.ts
└── ui/                  # UI layout components
    └── ClientLayout.tsx
```

## 🎨 Key Features Deep Dive

### **NFT Detail Pages**
- Comprehensive NFT information display
- Tabbed interface for Project/Functionalities/Tokenomics
- Smart contract data integration (ERC-721 + EIP-2981)
- Categories displayed as pills between header and content
- Optimized image display with:
  - Gray container with padding
  - White background for images
  - Rounded corners
  - Full image visibility with `object-contain`

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
```

### **Performance Optimization**
- Turbopack for fast development builds
- Next.js Image optimization for media
- React Query for efficient data caching
- Lazy loading for components and images
- Bundle analysis with built-in tools

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

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Test your changes thoroughly
5. Commit with clear messages: `git commit -m 'feat: add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Development Guidelines**
- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Add proper error handling and loading states
- Update types when adding new features
- Write clear, self-documenting code
- Test cross-browser compatibility

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
