# Development Documentation

Setup guides and development workflows.

## Contents

### [Setup Guide](./setup.md)
Complete development environment setup.

**Topics:**
- Prerequisites (Node.js, npm, Git)
- Installation steps
- Environment configuration
- Running the development server
- Building for production
- Development workflow
- Code quality tools (ESLint, TypeScript)
- Testing

### [Environment Variables](./environment.md)
Required environment variables and configuration.

**Topics:**
- App configuration
- Web3 configuration (WalletConnect, Infura, Alchemy)
- GraphQL subgraph (TheGraph)
- MongoDB connection
- Admin wallet addresses
- API keys (CoinGecko, etc.)
- Development vs Production settings

## Quick Start

```bash
# Clone repository
git clone https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0.git
cd nextjs-nft-marketplace-w3i-2.0

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure environment variables (see environment.md)
# Edit .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development Guidelines

- **Use TypeScript** for all new code
- **Follow API patterns** - Use `apiHandler`, middleware, Zod validation
- **Use component library** - BaseCard, BaseModal, LoadingState
- **Centralized types** - Import from `/src/types`
- **Utility functions** - Use helpers from `/src/utils`
- **Performance patterns** - useCallback, useMemo, React.memo
- **Error handling** - Proper loading/error states
- **Code quality** - Run `npm run lint` before commits

## Quick Links

- **Main Docs**: [../README.md](../README.md)
- **Architecture**: [../architecture/overview.md](../architecture/overview.md)
- **API Routes**: [../api/routes.md](../api/routes.md)
- **Database**: [../database/README.md](../database/README.md)
