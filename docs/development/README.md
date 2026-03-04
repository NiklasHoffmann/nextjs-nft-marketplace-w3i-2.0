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

### [Scaling & Load Test Checklist](./SCALING_LOAD_TEST_CHECKLIST.md)

Konkrete Lasttest-Runbook mit Zielwerten für API-Latenz, Redis, SSE und Failover.

**Topics:**

- Health-Precheck (Redis/SSE)
- Lastszenarien (Marketplace, Wallet, Realtime)
- Pass/Fail-Kriterien
- Schnell-Diagnose bei Engpässen

### [1inch Swap E2E Sanity](./ONEINCH_SWAP_E2E_SANITY.md)

Kurzer manueller Testplan für ETH→Token, Token→ETH und Token→Token in `/cart` und Buy-Now-Modal.

**Topics:**

- BuyNowModal Flow Checks
- Cart Flow Checks
- Approval/Swap Reihenfolge
- Edge Cases (invalid amount, rejected tx)

## Quick Start

```bash
# Clone repository
git clone https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0.git
cd nextjs-nft-marketplace-w3i-2.0

# Install dependencies
npm install

# Copy environment file
cp .env.local.template .env.local

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
- **Logging policy** - Use `devLog` for app logging; avoid direct `console.*` except in `dev-log.ts` and `globals.ts`
- **Performance patterns** - useCallback, useMemo, React.memo
- **Error handling** - Proper loading/error states
- **Code quality** - Run `npm run lint` before commits

### Logging Policy

- Prefer `devLog` from `@/utils` for all runtime logs.
- Reserve direct `console.*` usage for the internal logging wrapper in `dev-log.ts` and BigInt-safe overrides in `globals.ts`.
- Keep log payloads structured (objects) for easier filtering and avoid logging secrets or PII.

## Quick Links

- **Main Docs**: [../README.md](../README.md)
- **Architecture**: [../architecture/overview.md](../architecture/overview.md)
- **API Routes**: [../api/routes.md](../api/routes.md)
- **Database**: [../database/README.md](../database/README.md)
