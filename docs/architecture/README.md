# Architecture Documentation

System architecture, features, and design patterns.

## Contents

### [Roles & Permissions](./ROLES_AND_PERMISSIONS.md)
Alle Akteure, Session-Scopes und die Permission-Matrix (App- und Chain-Ebene).

### [Architecture Overview](./overview.md)
Complete system architecture and design patterns.

**Topics:**
- Tech stack (Next.js, TypeScript, Web3, MongoDB)
- Context-based state management
- Custom hooks
- Component architecture
- Data flow
- Performance optimizations
- Error handling

### [Features Documentation](./features.md)
Comprehensive feature guide.

**Topics:**
- NFT display & browsing
- Image optimization
- Marketplace functionality
- User interactions
- Admin features
- Smart contract integration
- IPFS integration

### [Caching System](./caching.md)
Cache invalidation and data synchronization.

**Topics:**
- Multi-layer caching strategy
- Cache invalidation triggers
- Event-driven updates
- Performance monitoring
- Cache management

### [Event System](./events.md)
Real-time event system.

**Topics:**
- Custom events (NFTStatsUpdateEvent)
- Cross-component communication
- Event listeners
- Performance considerations

### [Dynamic Fees](./fees.md)
Fee calculation system.

**Topics:**
- Platform fees
- Royalty fees
- Gas estimation
- Fee display

### [Utility Functions](./utilities.md)
Utility functions audit and documentation.

**Topics:**
- NFT helpers
- Formatters
- Validation
- Type utilities

## Architecture Highlights

### **Hybrid Metadata System**
- **DB-first loading** - Instant ~50ms response
- **Blockchain fallback** - Direct contract + IPFS
- **Smart sync** - Discovery-only from Alchemy (90% cost reduction)
- **Ownership tracking** - Full transfer history

### **API Infrastructure**
- **apiHandler Pattern** - 42+ standardized handlers
- **Middleware System** - Auth, validation, error handling
- **Type-Safe** - Zod schemas for validation
- **Performance** - Multi-layer caching, automatic logging

### **Component Library**
- **BaseCard** - Standardized cards (383 LOC)
- **BaseModal** - Modal infrastructure (150 LOC)
- **LoadingState** - Consistent loading (80 LOC)
- **EmptyState** - Empty states (100 LOC)
- **FormField** - Reusable forms (100 LOC)

## Quick Links

- **Main Docs**: [../README.md](../README.md)
- **API Routes**: [../api/routes.md](../api/routes.md)
- **Development**: [../development/setup.md](../development/setup.md)
- **Database**: [../database/README.md](../database/README.md)
