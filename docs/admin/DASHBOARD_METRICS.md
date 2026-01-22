# Dashboard Metrics - Zusätzliche Metriken

Diese Datei sammelt Ideen für zusätzliche Dashboard-Metriken, die später implementiert werden können.

## Status: Aktuell Implementiert ✅

### Basis-Metriken (Row 1)
- ✅ **Total NFTs** - Alle jemals bezogenen NFTs (nft_metadata)
- ✅ **Active Listings** - Aktuell gelistete NFTs (marketplace_items: status='listed')
- ✅ **Total Volume** - Gesamtvolumen aller Verkäufe in ETH (marketplace_items: status='sold')
- ✅ **Total Users** - Unique Wallets aus 6 Quellen (marketplace + interactions)

### System Status
- ✅ **Blockchain Connection** - Wallet-Status
- ✅ **Database** - MongoDB Connection
- ✅ **Subgraph** - Sync-Status
- ✅ **Pending Listings** - Anzahl pending listings
- ✅ **Cancelled Listings** - Anzahl cancelled listings

### Recent Activity
- ✅ **Recent Sales** - Letzte 5 Verkäufe mit Details

---

## Vorschläge für Zusätzliche Metriken 🎯

### Performance Metriken

#### 💰 Average Sale Price
```typescript
// Durchschnittlicher Verkaufspreis aller Sales
const avgSalePrice = await db.collection('marketplace_items').aggregate([
    { $match: { status: 'sold' } },
    { $group: { _id: null, avgPrice: { $avg: { $toDouble: "$price" } } } }
]).toArray();
```
**Display**: "Ø 0.45 ETH" in separater Card oder unter Total Volume

#### 💎 Highest Sale
```typescript
// Teuerster Verkauf ever
const highestSale = await db.collection('marketplace_items')
    .find({ status: 'sold' })
    .sort({ price: -1 })
    .limit(1)
    .toArray();
```
**Display**: "🏆 2.5 ETH" mit NFT-Details on hover

#### 📉 Floor Price
```typescript
// Günstigster aktuell gelisteter NFT
const floorPrice = await db.collection('marketplace_items')
    .find({ status: 'listed' })
    .sort({ price: 1 })
    .limit(1)
    .toArray();
```
**Display**: "📉 0.05 ETH" neben Active Listings

#### ✅ Success Rate
```typescript
// Verkaufte vs Abgebrochene Listings (%)
const sold = await db.collection('marketplace_items').countDocuments({ status: 'sold' });
const cancelled = await db.collection('marketplace_items').countDocuments({ status: 'cancelled' });
const successRate = (sold / (sold + cancelled)) * 100;
```
**Display**: "✅ 78% Success" als Badge oder Progress Bar

---

### Aktivitäts-Trends

#### 🔥 Sales Today
```typescript
// Verkäufe der letzten 24 Stunden
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const salesToday = await db.collection('marketplace_items').countDocuments({
    status: 'sold',
    updatedAt: { $gte: oneDayAgo }
});
```
**Display**: "🔥 12 heute" unter Total Volume

#### 📈 Sales This Week
```typescript
// Verkäufe der letzten 7 Tage
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const salesWeek = await db.collection('marketplace_items').countDocuments({
    status: 'sold',
    updatedAt: { $gte: sevenDaysAgo }
});
```
**Display**: "📈 45 diese Woche" Trend-Indicator

#### 🆕 New Listings Today
```typescript
// Neue Listings der letzten 24 Stunden
const newListingsToday = await db.collection('marketplace_items').countDocuments({
    status: 'listed',
    createdAt: { $gte: oneDayAgo }
});
```
**Display**: "🆕 8 neue Listings" unter Active Listings

#### 📊 Volume Trend (7d vs 30d)
```typescript
// Volume-Vergleich 7 Tage vs 30 Tage
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const volume7d = await db.collection('marketplace_items').aggregate([
    { $match: { status: 'sold', updatedAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$price" } } } }
]).toArray();
```
**Display**: Chart oder "↗️ +25% vs letzte Woche"

---

### Top Performer

#### 🏆 Most Active Collection
```typescript
// Collection mit meisten Sales oder höchstem Volume
const topCollection = await db.collection('marketplace_items').aggregate([
    { $match: { status: 'sold' } },
    { $group: { 
        _id: '$nftAddress',
        sales: { $sum: 1 },
        volume: { $sum: { $toDouble: "$price" } }
    }},
    { $sort: { volume: -1 } },
    { $limit: 1 }
]).toArray();
```
**Display**: "🏆 CryptoPunks - 15.5 ETH" in Top Performers Card

#### 👤 Top Seller
```typescript
// User mit höchstem Verkaufsvolumen
const topSeller = await db.collection('marketplace_items').aggregate([
    { $match: { status: 'sold' } },
    { $group: { 
        _id: '$seller',
        sales: { $sum: 1 },
        volume: { $sum: { $toDouble: "$price" } }
    }},
    { $sort: { volume: -1 } },
    { $limit: 1 }
]).toArray();
```
**Display**: "👤 0x1234...5678 - 8.2 ETH" in Top Sellers Section

#### ⭐ Most Popular NFT
```typescript
// NFT mit meisten Likes oder Views
const popularNFT = await db.collection('nft_stats').aggregate([
    { $sort: { likeCount: -1 } },
    { $limit: 1 }
]).toArray();
```
**Display**: "⭐ Token #1234 - 156 Likes" mit Thumbnail

---

### Engagement Metriken

#### ❤️ Total Likes
```typescript
// Summe aller NFT-Likes
const totalLikes = await db.collection('user_likes').countDocuments();
```
**Display**: "❤️ 1,234 Likes" in Engagement Card

#### ⭐ Total Ratings
```typescript
// Anzahl aller Bewertungen
const totalRatings = await db.collection('user_ratings').countDocuments();
```
**Display**: "⭐ 567 Bewertungen"

#### 👁️ Total Views
```typescript
// Summe aller View Counts (falls implementiert)
const totalViews = await db.collection('nft_stats').aggregate([
    { $group: { _id: null, total: { $sum: "$viewCount" } } }
]).toArray();
```
**Display**: "👁️ 45,678 Views"

#### 📌 Watchlist Items
```typescript
// Anzahl Items auf allen Watchlists
const watchlistItems = await db.collection('user_watchlist').countDocuments();
```
**Display**: "📌 892 auf Watchlists"

---

### Collection Stats

#### 🎨 Total Collections
```typescript
// Anzahl unique NFT Collections
const totalCollections = await db.collection('marketplace_items')
    .distinct('nftAddress').length;
```
**Display**: "🎨 24 Collections" in Collections Card

#### 📦 Active Collections
```typescript
// Collections mit mindestens 1 aktiven Listing
const activeCollections = await db.collection('marketplace_items').aggregate([
    { $match: { status: 'listed' } },
    { $group: { _id: '$nftAddress' } },
    { $count: 'total' }
]).toArray();
```
**Display**: "📦 18 aktive Collections"

---

### Health Indicators

#### ⏱️ Average Time to Sale
```typescript
// Durchschnittliche Zeit von Listing bis Verkauf
const avgTimeToSale = await db.collection('marketplace_items').aggregate([
    { $match: { status: 'sold' } },
    { $project: { 
        duration: { 
            $subtract: [
                { $toDate: "$updatedAt" },
                { $toDate: "$createdAt" }
            ]
        }
    }},
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
]).toArray();
// Convert to days
const avgDays = avgDuration / (1000 * 60 * 60 * 24);
```
**Display**: "⏱️ Ø 3.5 Tage bis Verkauf"

#### 🕰️ Stale Listings
```typescript
// Listings älter als 30 Tage
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const staleListings = await db.collection('marketplace_items').countDocuments({
    status: 'listed',
    createdAt: { $lt: thirtyDaysAgo }
});
```
**Display**: "🕰️ 12 Listings >30 Tage" mit Warnung

#### 💰 ETH Balance Flow
```typescript
// Total Volume In vs Out (wenn Fee-Tracking vorhanden)
// Incoming: Total Sales Volume
// Outgoing: Seller Payments
// Marketplace Fee: Difference
```
**Display**: Chart mit In/Out Flow

---

## Empfohlene Priorität 🎯

### Phase 1 - Essential (nächste Implementierung)
1. **Average Sale Price** - Wichtig für Markt-Gesundheit
2. **Highest Sale** - Showcase für Erfolge
3. **Success Rate** - Performance-Indikator
4. **Sales Today/Week** - Aktivitäts-Trend

### Phase 2 - Engagement
5. **Total Likes/Ratings/Watchlist** - Community-Engagement
6. **Most Popular NFT** - Social Proof
7. **Total Collections** - Marktplatz-Größe

### Phase 3 - Advanced Analytics
8. **Top Collection/Seller** - Leaderboards
9. **Average Time to Sale** - Efficiency-Metrik
10. **Volume Trends** - Charts & Vergleiche

### Phase 4 - Health Monitoring
11. **Stale Listings** - Cleanup-Indicator
12. **Floor Price Trends** - Markt-Bewegungen
13. **ETH Flow Analysis** - Financial Health

---

## UI Layout Vorschlag

```
┌─────────────────────────────────────────────────────────────┐
│  Total NFTs    Active Listings   Total Volume    Total Users │
│  1,234         45                12.5 ETH        89          │
│  alle NFTs     gelistet          456 Sales       wallets     │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Avg Sale Price   Highest Sale   Floor Price   Success Rate   │
│  0.45 ETH         2.5 ETH        0.05 ETH      78%           │
│  durchschnitt     best sale      günstigste    sold/cancelled │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  Sales Trends        │  │  Top Performers      │
│  🔥 12 heute        │  │  🏆 CryptoPunks      │
│  📈 45 diese Woche  │  │  👤 0x1234...        │
│  📊 +25% vs letzte  │  │  ⭐ Token #1234      │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  Engagement          │  │  System Status       │
│  ❤️ 1,234 Likes    │  │  ✅ Blockchain      │
│  ⭐ 567 Ratings     │  │  ✅ Database        │
│  📌 892 Watchlist   │  │  ✅ Subgraph        │
└──────────────────────┘  └──────────────────────┘
```

---

## Implementierungs-Notizen

- Alle Metriken sollten gecacht werden (60s TTL)
- Heavy Aggregations in Background Jobs auslagern
- Real-time Updates via WebSocket optional
- Mobile-responsive Grid Layout
- Loading States für jeden Metrik-Block
- Error Handling mit Fallback-Werten

---

**Letzte Aktualisierung**: 22. Januar 2026
**Status**: Sammlung für zukünftige Features
