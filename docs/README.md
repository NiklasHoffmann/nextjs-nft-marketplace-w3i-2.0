# 📚 Documentation Index

Welcome to the NFT Marketplace 2.0 documentation!

## � Documentation Structure

### **[📡 API Documentation](./api/)**
API routes, authentication, and middleware.
- [API Routes Reference](./api/routes.md) - Complete endpoint documentation
- [Admin Authentication](./api/authentication.md) - Signature-based auth system

### **[🗄️ Database Documentation](./database/)**
MongoDB setup, troubleshooting, and schemas.
- [Quick Fix Guide](./database/quick-fix.md) - Fast solutions for common issues
- [Troubleshooting](./database/troubleshooting.md) - Comprehensive problem solving
- [Database Schemas](./database/schemas/) - JSON schema definitions

### **[⚙️ Development](./development/)**
Setup guides and development workflows.
- [Setup Guide](./development/setup.md) - Environment setup and installation
- [Environment Variables](./development/environment.md) - Required configuration

### **[🏗️ Architecture](./architecture/)**
System architecture, features, and design patterns.
- [Architecture Overview](./architecture/overview.md) - System design and patterns
- [Features Documentation](./architecture/features.md) - Feature implementation guide
- [Caching System](./architecture/caching.md) - Cache invalidation strategies
- [Event System](./architecture/events.md) - Real-time event handling
- [Dynamic Fees](./architecture/fees.md) - Fee calculation system
- [Utility Functions](./architecture/utilities.md) - Utility functions audit

### **[🔌 Integrations](./integrations/)**
Third-party service integrations.
- [TheGraph Setup](./integrations/thegraph-setup.md) - Graph node configuration
- [TheGraph Subscriptions](./integrations/thegraph-subscriptions.md) - Real-time data
- [Exchange Rates](./integrations/exchange-rates.md) - Currency conversion API

### **[📝 Changelog](./CHANGELOG.md)**
Version history, changes, and fixes

## 🎯 Quick Start Guides

### **New Developer?**
1. Start with [Development Setup](./development/setup.md)
2. Configure [Environment Variables](./development/environment.md)
3. Review [Architecture Overview](./architecture/overview.md)

### **Understanding the System?**
1. Read [Architecture Overview](./architecture/overview.md)
2. Check [Features Documentation](./architecture/features.md)
3. Review [API Routes](./api/routes.md)

### **API Integration?**
1. Check [API Routes Reference](./api/routes.md)
2. Review [Admin Authentication](./api/authentication.md)
3. See [Database Schemas](./database/schemas/)

### **MongoDB Issues?**
1. Try [Quick Fix Guide](./database/quick-fix.md) (2 minutes)
2. Check [Troubleshooting Guide](./database/troubleshooting.md)
3. Review [Database README](./database/README.md)

## 🏗️ Project Structure

```
docs/
├── README.md                            # This file - Navigation hub
│
├── api/                                 # API Documentation
│   ├── README.md                       # API overview
│   ├── routes.md                       # Complete API reference
│   └── authentication.md               # Admin auth system
│
├── database/                            # Database Documentation
│   ├── README.md                       # Database overview
│   ├── quick-fix.md                    # Fast solutions
│   ├── troubleshooting.md              # Problem solving
│   └── schemas/                        # JSON schemas
│       ├── mongodb-collections.json
│       ├── nft-data-schema.json
│       ├── nft-display-fields.json
│       └── data-source-mapping.json
│
├── development/                         # Development Documentation
│   ├── README.md                       # Development overview
│   ├── setup.md                        # Setup guide
│   └── environment.md                  # Environment variables
│
├── architecture/                        # Architecture Documentation
│   ├── README.md                       # Architecture overview
│   ├── overview.md                     # System architecture
│   ├── features.md                     # Features guide
│   ├── caching.md                      # Cache system
│   ├── events.md                       # Event system
│   ├── fees.md                         # Fee calculation
│   └── utilities.md                    # Utility functions
│
├── integrations/                        # External Integrations
│   ├── README.md                       # Integrations overview
│   ├── thegraph-setup.md              # TheGraph configuration
│   ├── thegraph-subscriptions.md      # Real-time data
│   └── exchange-rates.md              # Currency API
│
└── CHANGELOG.md                         # Version history
```

## 🔍 Finding Information

| **Topic** | **Document** |
|-----------|-------------|
| **API Endpoints** | [api/routes.md](./api/routes.md) |
| **Admin Authentication** | [api/authentication.md](./api/authentication.md) |
| **System Architecture** | [architecture/overview.md](./architecture/overview.md) |
| **Features Guide** | [architecture/features.md](./architecture/features.md) |
| **Database Setup** | [database/README.md](./database/README.md) |
| **MongoDB Issues** | [database/quick-fix.md](./database/quick-fix.md) |
| **Development Setup** | [development/setup.md](./development/setup.md) |
| **Environment Config** | [development/environment.md](./development/environment.md) |
| **TheGraph Setup** | [integrations/thegraph-setup.md](./integrations/thegraph-setup.md) |
| **Currency Exchange** | [integrations/exchange-rates.md](./integrations/exchange-rates.md) |
| **Cache System** | [architecture/caching.md](./architecture/caching.md) |
| **Event System** | [architecture/events.md](./architecture/events.md) |
| **Recent Changes** | [CHANGELOG.md](./CHANGELOG.md) |

## 📝 Contributing to Docs

When adding new features or making changes:

1. Update relevant documentation files
2. Keep examples up-to-date
3. Include code snippets where helpful
4. Link related documentation
5. Update this index if adding new docs

---

**Last Updated**: January 19, 2026
