# 📋 Marketplace TODO - Zukünftige Features

> **Status:** Geplant für spätere Entwicklung  
> **Priorität:** Nach Core-Features und Spiel-Optimierung  
> **Erstellt:** 12. November 2025

---

## 🎯 Phase 1: Sell/Trade Integration (ZUKUNFT)

### 1.1 Smart Contract Integration für Sell Page
- [ ] `SellTradePage.tsx` - Integration mit `useMarketplaceListing` Hook
- [ ] NFT Approval Flow implementieren (ERC721 `setApprovalForAll`)
- [ ] Echte Transaction Handling statt Mock-Daten
- [ ] Loading States & User Feedback
- [ ] Success/Error Messages mit Toast Notifications
- [ ] Redirect nach erfolgreicher Listung zu `/marketplace/my-listings`

### 1.2 Wallet NFTs Integration
- [ ] `NFTUserSelector.tsx` - Replace Mock Data mit `useWalletNFTs(address)`
- [ ] Loading States während NFT Fetch
- [ ] Empty State Component wenn User keine NFTs besitzt
- [ ] Filter: "Already Listed" vs "Not Listed"
- [ ] Refresh Button für NFT Liste

### 1.3 Transaction Preview
- [ ] `TransactionPreview.tsx` - Echte Contract-Calls
- [ ] Gas Estimation anzeigen
- [ ] Transaction Confirmation Modal
- [ ] MetaMask Integration testen
- [ ] Error Handling bei abgelehnten Transaktionen

### 1.4 Fee Calculation
- [ ] Marketplace Fee vom Contract abfragen (on-chain)
- [ ] Royalty Info vom NFT Contract holen
- [ ] Dynamic Fee Breakdown basierend auf Chain
- [ ] Estimated Gas Costs anzeigen

**Geschätzter Aufwand:** 1-2 Tage

---

## 🛒 Phase 2: Marketplace Browse & Buy (ZUKUNFT)

### 2.1 Marketplace Landing Page
- [ ] Neue Route: `/marketplace` erstellen
- [ ] Layout mit Hero Section
- [ ] Featured Collections Carousel
- [ ] Trending NFTs Section
- [ ] New Listings Section
- [ ] Search Bar mit Auto-Complete

### 2.2 Buy Flow Implementation
- [ ] NFT Detail Page - "Buy Now" Button
- [ ] Purchase Modal mit `useMarketplacePurchase`
- [ ] Price Comparison (Floor Price, Last Sale)
- [ ] Transaction Confirmation Flow
- [ ] Success Page mit Receipt/Transaction Hash
- [ ] Add to Wallet Button (MetaMask)

### 2.3 Checkout System
- [ ] Dedicated Checkout Page: `/marketplace/buy/[listingId]`
- [ ] Payment Method Selection (ETH, WETH, etc.)
- [ ] Transaction Summary
- [ ] Terms & Conditions Checkbox
- [ ] Purchase Confirmation
- [ ] Email Receipt (optional)

**Geschätzter Aufwand:** 2-3 Tage

---

## 👤 Phase 3: User Dashboard (ZUKUNFT)

### 3.1 My Listings Management
- [ ] Route: `/marketplace/my-listings`
- [ ] List all user's active listings mit TheGraph
- [ ] Update Price Funktion (Modal)
- [ ] Cancel Listing Button mit Confirmation
- [ ] Sales History Tab
- [ ] Earnings Summary Card

### 3.2 Purchase History
- [ ] Route: `/marketplace/purchases`
- [ ] List all user's NFT purchases
- [ ] Transaction Details (Gas, Fees, etc.)
- [ ] Filter by Date/Collection
- [ ] Export to CSV Funktion
- [ ] Receipt Download

### 3.3 Offers System
- [ ] Smart Contract Funktion für Offers (falls vorhanden)
- [ ] Make Offer Modal (unter Asking Price)
- [ ] Accept/Reject Offers UI
- [ ] Offer Expiration Timer
- [ ] Counter-Offer Funktion
- [ ] Notification System (Email/Browser)

### 3.4 Watchlist
- [ ] Watchlist für Listings
- [ ] Price Alert Notifications
- [ ] Save Searches
- [ ] Collection Following

**Geschätzter Aufwand:** 3-4 Tage

---

## 🎨 Phase 4: UI/UX Improvements (ZUKUNFT)

### 4.1 Komponenten-Refactoring
- [ ] Shared `NFTGrid` Komponente erstellen
- [ ] Reusable `FilterSidebar` für alle Marketplace-Listen
- [ ] Standardized Loading States (Skeleton Components)
- [ ] Error Boundary Components
- [ ] Toast Notification System
- [ ] Modal System vereinheitlichen

### 4.2 Performance Optimierungen
- [ ] Virtual Scrolling für große NFT Listen (react-window)
- [ ] Optimistic UI Updates bei Listings
- [ ] Cache-Strategie für TheGraph Queries optimieren
- [ ] Image Lazy Loading verbessern (Priority Loading)
- [ ] Code Splitting für Marketplace Routes
- [ ] Service Worker für Offline-Funktionalität

### 4.3 Mobile Responsiveness
- [ ] Mobile-optimized Filter (Bottom Sheet)
- [ ] Touch-friendly NFT Cards (Swipe Gestures?)
- [ ] Mobile Navigation optimieren
- [ ] PWA Features (Add to Home Screen)
- [ ] Mobile-optimized Forms
- [ ] Responsive Grid Layouts testen

### 4.4 Accessibility (a11y)
- [ ] Keyboard Navigation für alle Flows
- [ ] Screen Reader Support
- [ ] ARIA Labels für interaktive Elemente
- [ ] Focus Management in Modals
- [ ] Color Contrast überprüfen (WCAG AA)
- [ ] Alt-Texte für alle NFT Images

**Geschätzter Aufwand:** 2-3 Tage

---

## 🔧 Phase 5: Advanced Features (SPÄTER)

### 5.1 Collection Pages
- [ ] Route: `/marketplace/collections/[address]`
- [ ] Collection Overview (Floor Price, Volume, etc.)
- [ ] All NFTs in Collection anzeigen
- [ ] Collection Stats & Analytics
- [ ] Collection Description & Links
- [ ] Similar Collections Recommendations

### 5.2 Advanced Filtering
- [ ] Price Range Slider
- [ ] Rarity Filter (Common, Rare, etc.)
- [ ] Attribute Filters (Traits)
- [ ] Recently Listed/Sold Toggle
- [ ] Sort by: Price, Rarity, Recent
- [ ] Save Filter Presets

### 5.3 Analytics Dashboard
- [ ] Personal Trading Stats
- [ ] Portfolio Value Tracking
- [ ] Profit/Loss Calculator
- [ ] Market Trends & Insights
- [ ] Gas Tracker
- [ ] Best Time to Buy/Sell

### 5.4 Social Features
- [ ] User Profiles
- [ ] Following System
- [ ] Activity Feed
- [ ] Comments on Listings
- [ ] Share Listings (Social Media)
- [ ] Reputation System

**Geschätzter Aufwand:** 5+ Tage

---

## 🚀 API & Backend Erweiterungen (ZUKUNFT)

### API Routes
- [ ] `/api/marketplace/offers` - Offer Management
- [ ] `/api/marketplace/user-listings` - User's Listings
- [ ] `/api/marketplace/stats` - Marketplace Statistics
- [ ] `/api/marketplace/collections/[address]` - Collection Data
- [ ] `/api/notifications` - User Notifications
- [ ] `/api/user/watchlist` - Watchlist Management

### TheGraph Queries
- [ ] User Listings Query optimieren
- [ ] Sales History Query
- [ ] Collection Stats Query
- [ ] Offer Events Query (falls im Contract)
- [ ] Volume & Floor Price Calculations

### Database (MongoDB)
- [ ] User Watchlist Collection
- [ ] Saved Searches Collection
- [ ] User Notifications Collection
- [ ] Activity Log Collection

**Geschätzter Aufwand:** 3-4 Tage

---

## 🧪 Testing & Quality (ZUKUNFT)

### Unit Tests
- [ ] Hook Tests (useMarketplaceListing, etc.)
- [ ] Component Tests (Forms, Modals)
- [ ] Utility Function Tests
- [ ] API Route Tests

### Integration Tests
- [ ] Complete Buy Flow Test
- [ ] Complete Sell Flow Test
- [ ] Wallet Connection Tests
- [ ] Transaction Error Handling Tests

### E2E Tests
- [ ] Cypress/Playwright Setup
- [ ] Critical User Journeys testen
- [ ] Mobile Testing
- [ ] Cross-Browser Testing

**Geschätzter Aufwand:** 2-3 Tage

---

## 📚 Dokumentation (ZUKUNFT)

- [ ] User Guide für Marketplace
- [ ] Developer Docs für Hooks
- [ ] API Documentation (OpenAPI/Swagger)
- [ ] Troubleshooting Guide
- [ ] FAQ Section
- [ ] Video Tutorials

**Geschätzter Aufwand:** 1-2 Tage

---

## 🎯 Prioritäten-Matrix

| Phase | Priorität | Abhängigkeiten | Geschätzter Aufwand |
|-------|-----------|----------------|---------------------|
| Phase 1 | 🔴 Hoch | Keine | 1-2 Tage |
| Phase 2 | 🟠 Mittel-Hoch | Phase 1 | 2-3 Tage |
| Phase 3 | 🟡 Mittel | Phase 1, 2 | 3-4 Tage |
| Phase 4 | 🟢 Niedrig | Phase 1, 2, 3 | 2-3 Tage |
| Phase 5 | 🔵 Optional | Phase 1, 2, 3 | 5+ Tage |

**Gesamt-Aufwand:** ~15-20 Arbeitstage (3-4 Wochen)

---

## 🎮 Hinweis: Game-First Approach

**Aktueller Stand:**
- ✅ Spiel (History Towers) ist der Hauptfokus
- ✅ User landet auf `/history-towers` (gewollt!)
- ✅ Marketplace-Features sind "nice to have"

**Strategie:**
1. **Jetzt:** Spiel optimieren & polieren
2. **Später:** Marketplace schrittweise ausbauen
3. **Vision:** Beides als starke Features kombinieren

**Game-Marketplace Synergien (Zukunft):**
- [ ] NFT Rewards im Spiel verdienen
- [ ] Spiel-Items als NFTs auf Marketplace verkaufen
- [ ] Leaderboard NFTs
- [ ] Tournament Prize NFTs
- [ ] In-Game Marketplace Integration

---

## 📝 Notes

- Diese TODO ist ein **Langzeit-Plan**
- Nicht alle Features müssen sofort umgesetzt werden
- Priorisierung kann sich ändern basierend auf User-Feedback
- Marketplace sollte Spiel-Entwicklung nicht blockieren
- Schrittweise Implementation bevorzugt

---

**Nächster Schritt:** Fokus auf aktuellen Refactor (keine neuen Features!) ✅
