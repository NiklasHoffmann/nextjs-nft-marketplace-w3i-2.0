# NFT Marketplace mit Optimiertem Caching System

## 🚀 Überblick
Ein hochperformantes Next.js NFT Marketplace mit serverseitigem und clientseitigem Caching für optimale Benutzererfahrung.

## ✨ Hauptfeatures
- **Dual-Layer Caching**: Server-side LRU Cache + Client-side React Query
- **Optimierte Bildladung**: Next.js Image Optimization mit IPFS-Support
- **Web3 Integration**: Viem für Blockchain-Interaktionen
- **Wallet Integration**: RainbowKit für nahtlose Wallet-Verbindungen
- **Performance First**: Stale-while-revalidate, Lazy Loading, Error Fallbacks

## 🏗️ Architektur

### Caching-System
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side    │    │   Blockchain    │
│                 │    │                  │    │                 │
│ React Query     │◄──►│ LRU Cache        │◄──►│ Viem Client     │
│ - 15min stale   │    │ - 1000 items     │    │ - ERC721 calls  │
│ - 30min GC      │    │ - 30min TTL      │    │ - Timeout: 10s  │
│ - Map cache     │    │ - Image cache    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Komponenten-Hierarchie
```
NFTCardWithMetadata
├── useNFTMetadataOptimized (Hook)
│   ├── React Query (Client Cache)
│   └── /api/nft-metadata (Server API)
│       ├── LRU Cache (Server Cache)
│       └── /api/web3/tokenURI (Blockchain API)
└── OptimizedNFTImage (Component)
    ├── Next.js Image
    ├── Loading States
    └── Error Fallbacks
```

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

### 3. Development Server
```bash
npm run dev
```

### 4. Teste das System
- Öffne: `http://localhost:3000/api/test`
- Überprüfe Caching: Erste Anfrage vs. zweite Anfrage

## 📊 Performance Features

### 1. Erste Anfrage (Cold Cache)
```
User Request → Client Cache Miss → Server Cache Miss → Blockchain Call → Cache Store → Response
~2-5 Sekunden
```

### 2. Zweite Anfrage (Warm Server Cache)
```
User Request → Client Cache Miss → Server Cache Hit → Response
~50-100ms
```

### 3. Dritte Anfrage (Warm Client Cache)
```
User Request → Client Cache Hit → Instant Response
~1-5ms
```

---

**Erstellt mit ❤️ für optimale NFT Marketplace Performance**
