# 🛠️ Development Guide

Complete guide for developers working on the NFT Marketplace 2.0.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn**
- **Git**
- **VS Code** (recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0.git
cd nextjs-nft-marketplace-w3i-2.0

# Install dependencies
npm install

# Copy environment file
cp .env.local.template .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

### Required Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Web3
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# GraphQL
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/your-subgraph
NEXT_PUBLIC_SUBGRAPH_WS_URL=wss://api.thegraph.com/subgraphs/name/your-subgraph

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nft-marketplace

# Auth
JWT_SECRET=your_strong_jwt_secret

# APIs
COINGECKO_API_KEY=your_coingecko_key
```

### Getting API Keys

**WalletConnect**:

1. Visit [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID

**Infura**:

1. Visit [infura.io](https://infura.io)
2. Create account
3. Create new project
4. Copy Project ID

**Alchemy**:

1. Visit [alchemy.com](https://alchemy.com)
2. Create app
3. Copy API Key

**CoinGecko**:

1. Visit [coingecko.com/api](https://www.coingecko.com/en/api)
2. Sign up for free tier
3. Get API key

---

## 📁 Project Structure

```
nextjs-nft-marketplace-w3i-2.0/
├── docs/                       # 📚 Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── FEATURES.md
│   ├── CHANGELOG.md
│   └── DEVELOPMENT.md
├── public/                     # Static assets
│   ├── media/
│   └── cached-nft-images/     # Runtime cache (gitignored)
├── scripts/                    # Utility scripts
│   ├── dev/                   # Development scripts
│   ├── maintenance/           # DB cleanup, migrations
│   └── fixes/                 # One-time fixes
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── nft/
│   │   │   ├── user/
│   │   │   └── admin/
│   │   ├── nft/              # NFT pages
│   │   ├── wallet/           # Wallet dashboard
│   │   ├── admin/            # Admin panel
│   │   ├── history-towers/   # Game
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React components
│   │   ├── 01-layout/        # Layout components
│   │   ├── 02-nft/           # NFT components
│   │   ├── 03-marketplace/   # Marketplace features
│   │   ├── 05-ui/            # Reusable UI
│   │   ├── 06-admin/         # Admin components
│   │   └── 08-auth/          # Auth guards
│   ├── contexts/              # React contexts
│   │   ├── NFTContext.tsx
│   │   ├── NFTStatsContext.tsx
│   │   └── CurrencyContext.tsx
│   ├── hooks/                 # Custom hooks
│   │   └── nfts/
│   ├── lib/                   # Libraries & configs
│   │   ├── cache.ts          # Shared cache
│   │   ├── mongodb.ts        # DB connection
│   │   └── utils.ts
│   ├── types/                 # TypeScript types
│   │   ├── nft.ts
│   │   ├── events.ts
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── nft-helpers.ts
│   │   ├── formatters.ts
│   │   └── devLog.ts
│   ├── config/                # App configuration
│   ├── constants/             # Constants
│   └── schemas/               # Data schemas
├── .env.local                 # Environment variables (gitignored)
├── .env.local.template        # Development environment template
├── next.config.ts             # Next.js config
├── tailwind.config.js         # Tailwind config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies
├── README.md                  # Project overview
└── REFACTORING_ROADMAP.md     # Refactoring plan
```

---

## 🧑‍💻 Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start dev server
npm run dev

# 4. Make changes...

# 5. Test changes
npm run build        # Ensure builds
npm run lint         # Check linting

# 6. Commit changes
git add .
git commit -m "feat: your feature description"

# 7. Push and create PR
git push origin feature/your-feature-name
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user rating system
fix: resolve cache invalidation bug
refactor: extract NFT card component
docs: update API documentation
chore: update dependencies
```

---

## 🧪 Testing

### Manual Testing Checklist

**NFT Detail Page**:

- [ ] Image loads correctly
- [ ] Stats display accurately
- [ ] Like button toggles
- [ ] Watchlist button toggles
- [ ] Rating system works
- [ ] Tabs switch correctly
- [ ] Personal notes save

**Wallet Dashboard**:

- [ ] NFTs load
- [ ] Filters work
- [ ] Favorites tab shows only favorites
- [ ] Watchlist tab shows only watchlisted

**Performance**:

- [ ] Page load < 3s
- [ ] Cached requests < 50ms
- [ ] No console errors
- [ ] No memory leaks

### Testing Tools

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build test
npm run build

# Start production build
npm start
```

---

## 🎨 Code Style Guide

### TypeScript

```typescript
// ✅ Good: Use interfaces for objects
interface NFT {
  id: string;
  name?: string;
}

// ✅ Good: Use type for unions
type Status = "loading" | "success" | "error";

// ✅ Good: Explicit return types
function getNFT(id: string): Promise<NFT | null> {
  // ...
}

// ❌ Bad: Implicit any
function process(data) {
  // Missing type
  // ...
}
```

### React Components

```typescript
// ✅ Good: Functional components with props interface
interface NFTCardProps {
  nft: NFT;
  showStats?: boolean;
}

export function NFTCard({ nft, showStats = true }: NFTCardProps) {
  // Component logic
}

// ✅ Good: Use hooks at top level
const [loading, setLoading] = useState(false);
const { nfts } = useNFTContext();

// ✅ Good: Memoize expensive computations
const sortedNFTs = useMemo(
  () => nfts.sort((a, b) => a.price - b.price),
  [nfts],
);
```

### Naming Conventions

```typescript
// Components: PascalCase
export function NFTCard() {}

// Hooks: camelCase with 'use' prefix
export function useNFTData() {}

// Utilities: camelCase
export function formatPrice() {}

// Constants: UPPER_SNAKE_CASE
export const MAX_ITEMS = 100;

// Types/Interfaces: PascalCase
export interface NFTMetadata {}
```

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from "react";

// 2. External libraries
import { useQuery } from "@tanstack/react-query";

// 3. Internal absolute imports
import { NFTCard } from "@/components/nft/NFTCard";
import { useNFTContext } from "@/contexts/NFTContext";
import type { NFT } from "@/types";

// 4. Relative imports (avoid when possible)
import { localHelper } from "./helpers";

// 5. Styles
import styles from "./Component.module.css";
```

---

## 🛠️ Common Tasks

### Adding a New Component

```bash
# 1. Create component file
touch src/components/02-nft/NFTNewFeature.tsx

# 2. Create component
export function NFTNewFeature() {
  return <div>New Feature</div>;
}

# 3. Export from index (if using barrel exports)
# Add to src/components/index.ts
export { NFTNewFeature } from './nft/NFTNewFeature';
```

### Adding a New API Route

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const param = searchParams.get("param");

    // Your logic here

    return NextResponse.json({
      success: true,
      data: {
        /* your data */
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Error message" },
      { status: 500 },
    );
  }
}
```

### Adding a New Context

```typescript
// src/contexts/ExampleContext.tsx
import { createContext, useContext, ReactNode } from 'react';

interface ExampleContextType {
  value: string;
  setValue: (value: string) => void;
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined);

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState('');

  return (
    <ExampleContext.Provider value={{ value, setValue }}>
      {children}
    </ExampleContext.Provider>
  );
}

export function useExampleContext() {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExampleContext must be used within ExampleProvider');
  }
  return context;
}
```

---

## 🐛 Debugging

### Common Issues

#### Issue: "Module not found"

```bash
# Solution: Clear Next.js cache
rm -rf .next
npm run dev
```

#### Issue: "Type errors after dependency update"

```bash
# Solution: Regenerate types
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "GraphQL errors"

```bash
# Check:
# 1. NEXT_PUBLIC_SUBGRAPH_URL is correct
# 2. Subgraph is deployed and synced
# 3. Network connection is stable
```

### Debug Tools

**React DevTools**:

- Install: [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Use: Inspect component props/state

**Apollo DevTools**:

- Install: [Chrome](https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm)
- Use: Inspect GraphQL queries/cache

**Next.js DevTools**:

- Built-in: Check terminal output
- Fast Refresh: Auto-reloads on changes

### Logging

```typescript
// Development only
import { devLog } from "@/utils";

devLog("Debug message", data); // Only logs in development
console.log("Always logs"); // Logs in all environments
```

---

## 📦 Scripts

```json
{
  "dev": "next dev", // Start development server
  "build": "next build", // Build for production
  "start": "next start", // Start production server
  "lint": "eslint" // Run linter
}
```

### Custom Scripts

```bash
# Development
npm run dev                 # Start dev server

# Production
npm run build              # Build app
npm start                  # Start production server

# Quality
npm run lint               # Check code style
npx tsc --noEmit          # Type check

# Database (if using local MongoDB)
npm run db:seed           # Seed test data (if script exists)
npm run db:indexes        # Create indexes (if script exists)
```

---

## 🔧 Configuration Files

### next.config.ts

```typescript
const config = {
  // Image optimization
  images: {
    domains: ["ipfs.io", "cloudflare-ipfs.com"],
    formats: ["image/avif", "image/webp"],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: true,
  },
};

export default config;
```

### tailwind.config.js

```javascript
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Custom colors, fonts, etc.
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   - Visit [vercel.com](https://vercel.com)
   - Import Git repository
2. **Configure Environment**:
   - Add all `.env` variables
   - Set production values
3. **Deploy**:
   - Automatic on `main` branch push
   - Preview deployments on PRs

### Build Checklist

- [ ] All environment variables set
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] MongoDB indexes created
- [ ] API keys valid

---

## 📚 Learning Resources

### Next.js

- [Docs](https://nextjs.org/docs)
- [Learn](https://nextjs.org/learn)

### React

- [Docs](https://react.dev)
- [Beta Docs](https://react.dev/learn)

### TypeScript

- [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Playground](https://www.typescriptlang.org/play)

### Tailwind CSS

- [Docs](https://tailwindcss.com/docs)
- [Cheatsheet](https://nerdcave.com/tailwind-cheat-sheet)

### Web3

- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)
- [RainbowKit Docs](https://www.rainbowkit.com)

---

## 🤝 Contributing

### Pull Request Process

1. **Fork** the repository
2. **Create** feature branch
3. **Make** changes
4. **Test** thoroughly
5. **Update** documentation
6. **Submit** PR with clear description

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing

- [ ] Tested locally
- [ ] No console errors
- [ ] Builds successfully

## Screenshots (if UI changes)

[Add screenshots]
```

---

## 📞 Getting Help

### Resources

- **Documentation**: `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0/issues)
- **Discussions**: [GitHub Discussions](https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0/discussions)

### Common Questions

**Q: How do I add a new NFT attribute?**
A: Update the `NFT` interface in `/src/types/nft.ts` and handle it in the relevant components.

**Q: How do I add caching to a new API route?**
A: Import cache functions from `/src/lib/cache.ts` and follow the pattern in existing routes.

**Q: How do I add a new context?**
A: See "Adding a New Context" section above.

---

**Last Updated**: 2025-10-15
