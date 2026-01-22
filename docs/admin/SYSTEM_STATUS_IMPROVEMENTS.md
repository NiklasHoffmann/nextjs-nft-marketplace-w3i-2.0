# System Status - Verbesserungsvorschläge

## Aktuelle Implementierung

### ✅ Korrekte Status-Checks
1. **Blockchain Connection** - Zeigt echten Wallet-Status via wagmi
2. **Database** - Zeigt ob MongoDB erreichbar (via API success)
3. **Pending Listings** - Live-Daten vom API
4. **Cancelled Listings** - Live-Daten vom API

### ⚠️ Probleme
- **Subgraph**: Hardcoded "Synced" - nicht dynamisch!

---

## Vorschläge für Zusätzliche System Status Checks

### 1. Subgraph Sync Status (KRITISCH) 🔥
**Problem**: Aktuell immer "Synced" - keine echte Überprüfung

**Lösung A - TheGraph Health Check**:
```typescript
// API Route: /api/admin/system/health
const healthEndpoint = `https://api.thegraph.com/index-node/graphql`;
const query = `{
  indexingStatusForCurrentVersion(subgraphName: "w3ideation/nft-marketplace") {
    synced
    health
    fatalError {
      message
    }
    chains {
      network
      latestBlock {
        number
      }
      chainHeadBlock {
        number
      }
    }
  }
}`;

// Response zeigt:
// - synced: true/false
// - health: "healthy", "unhealthy", "failed"
// - Block lag: chainHeadBlock - latestBlock
```

**Lösung B - Letzter Sync Check**:
```typescript
// Check ob marketplace_items collection kürzlich aktualisiert wurde
const lastSync = await db.collection('marketplace_items')
    .find({})
    .sort({ updatedAt: -1 })
    .limit(1)
    .toArray();

const minutesSinceLastSync = (Date.now() - new Date(lastSync[0].updatedAt)) / 60000;

// Status:
// < 5 min: "Synced" (green)
// 5-15 min: "Delayed" (yellow)
// > 15 min: "Stale" (red)
```

**Display**: 
- ✅ "Synced (Block 12345, <1 min ago)"
- ⚠️ "Delayed (5 min behind)"
- ❌ "Error: Sync failed"

---

### 2. NFT Sync Service Status
```typescript
// Check ob background sync läuft
const syncStatus = await fetch('/api/admin/sync/status');
// Returns: { running: true, lastRun: timestamp, nextRun: timestamp }
```

**Display**: "✅ Running (last: 2 min ago)"

---

### 3. IPFS Gateway Health
```typescript
// Test IPFS gateway response time
const ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
];

const testHash = 'QmTest...';
const start = Date.now();
const response = await fetch(`${gateway}${testHash}`, { timeout: 5000 });
const latency = Date.now() - start;

// Status:
// < 2s: "Fast" (green)
// 2-5s: "Slow" (yellow)
// > 5s: "Timeout" (red)
```

**Display**: "✅ IPFS Gateway (1.2s)"

---

### 4. Contract Owner Status
```typescript
// Check ob Admin noch Contract Owner ist
const diamondAddress = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS;
const owner = await publicClient.readContract({
    address: diamondAddress,
    abi: diamondABI,
    functionName: 'owner'
});

const isOwner = owner.toLowerCase() === address?.toLowerCase();
```

**Display**: 
- ✅ "Contract Owner" (green)
- ⚠️ "Ownership Transferred" (yellow)
- ℹ️ "MultiSig Active" (blue)

---

### 5. Fee Collection Status
```typescript
// Check Innovation Fee Wallet Balance
const feeWallet = process.env.NEXT_PUBLIC_FEE_WALLET;
const balance = await publicClient.getBalance({ address: feeWallet });

// Check last fee collection
const lastFeeCollection = await db.collection('marketplace_items')
    .find({ status: 'sold' })
    .sort({ updatedAt: -1 })
    .limit(1)
    .toArray();
```

**Display**: "💰 Fee Wallet: 1.25 ETH (last collection: 2h ago)"

---

### 6. Rate Limiting Status
```typescript
// Zeige Rate Limit Usage (falls implementiert)
const rateLimitStats = {
    current: 120, // requests in window
    limit: 1000,  // max requests
    window: '1h'
};

const usage = (current / limit * 100).toFixed(0);
```

**Display**: "📊 API Rate: 12% (120/1000 req/h)"

---

### 7. Cache Health
```typescript
// Check Memory Cache Usage
const cacheStats = {
    entries: 450,
    hitRate: 0.85, // 85% hit rate
    memoryMB: 24
};
```

**Display**: "💾 Cache: 85% hit rate, 450 entries"

---

### 8. Blockchain Network
```typescript
// Zeige aktuelles Network (Mainnet/Sepolia)
const chainId = await publicClient.getChainId();
const networkName = chainId === 1 ? 'Mainnet' : chainId === 11155111 ? 'Sepolia' : 'Unknown';
```

**Display**: "🌐 Network: Sepolia"

---

### 9. Last Error Log
```typescript
// Zeige letzten kritischen Fehler
const lastError = await db.collection('error_logs')
    .find({ severity: 'critical' })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray();
```

**Display**: 
- ✅ "No recent errors"
- ⚠️ "Warning: IPFS timeout 5min ago"
- ❌ "Error: MongoDB connection failed"

---

### 10. Uptime
```typescript
// Server uptime
const uptime = process.uptime(); // seconds
const hours = Math.floor(uptime / 3600);
const days = Math.floor(hours / 24);
```

**Display**: "⏱️ Uptime: 5d 12h"

---

## Empfohlene Priorität 🎯

### Phase 1 - Kritische Status Checks (JETZT)
1. ✅ **Subgraph Sync Status** - Dynamischer Check statt hardcoded
2. ✅ **Contract Owner Status** - Wichtig für Admin-Funktionen
3. ✅ **Network Display** - Zeige welches Network aktiv ist

### Phase 2 - Service Monitoring
4. **NFT Sync Service** - Background Job Status
5. **IPFS Gateway Health** - Metadata Verfügbarkeit
6. **Last Error Log** - Quick Debug Info

### Phase 3 - Performance Monitoring
7. **Rate Limiting** - API Usage
8. **Cache Health** - Performance Metrics
9. **Fee Collection** - Financial Health

### Phase 4 - Nice-to-Have
10. **Uptime** - System Reliability
11. **Memory Usage** - Resource Monitoring
12. **API Response Times** - Performance Tracking

---

## UI Layout Vorschlag

```typescript
<div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
    <div className="space-y-3">
        
        {/* Core Services */}
        <div className="pb-2 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 mb-2">CORE SERVICES</div>
            
            <StatusRow 
                label="Blockchain Connection"
                status="Connected"
                color="green"
                detail="Mainnet"
            />
            
            <StatusRow 
                label="Database"
                status="Online"
                color="green"
                detail="< 50ms"
            />
            
            <StatusRow 
                label="Subgraph Sync"
                status="Synced"
                color="green"
                detail="Block 12345 (<1 min)"
            />
        </div>

        {/* Admin Status */}
        <div className="pb-2 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 mb-2">ADMIN STATUS</div>
            
            <StatusRow 
                label="Contract Ownership"
                status="Owner"
                color="blue"
                detail="0x1234...5678"
            />
            
            <StatusRow 
                label="MultiSig Mode"
                status="Active"
                color="green"
                detail="2/3 required"
            />
        </div>

        {/* Marketplace Health */}
        <div className="pb-2">
            <div className="text-xs font-semibold text-gray-500 mb-2">MARKETPLACE</div>
            
            <StatusRow 
                label="Pending Listings"
                count={12}
                color="yellow"
            />
            
            <StatusRow 
                label="Cancelled Listings"
                count={45}
                color="gray"
            />
            
            <StatusRow 
                label="Stale Listings"
                count={8}
                color="orange"
                detail=">30 days"
            />
        </div>

        {/* Services */}
        <div>
            <div className="text-xs font-semibold text-gray-500 mb-2">SERVICES</div>
            
            <StatusRow 
                label="NFT Sync"
                status="Running"
                color="green"
                detail="Last: 2 min ago"
            />
            
            <StatusRow 
                label="IPFS Gateway"
                status="Fast"
                color="green"
                detail="1.2s latency"
            />
            
            <StatusRow 
                label="Cache"
                status="Healthy"
                color="green"
                detail="85% hit rate"
            />
        </div>
    </div>
</div>
```

---

## Component Vorschlag

```typescript
interface StatusRowProps {
    label: string;
    status?: string;
    count?: number;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange';
    detail?: string;
}

function StatusRow({ label, status, count, color, detail }: StatusRowProps) {
    const colorClasses = {
        green: 'bg-green-100 text-green-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        red: 'bg-red-100 text-red-700',
        blue: 'bg-blue-100 text-blue-700',
        gray: 'bg-gray-100 text-gray-700',
        orange: 'bg-orange-100 text-orange-700'
    };

    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
                {detail && (
                    <span className="text-xs text-gray-400">{detail}</span>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded ${colorClasses[color]}`}>
                    {status || count}
                </span>
            </div>
        </div>
    );
}
```

---

## API Route für Health Check

```typescript
// /api/admin/system/health

export async function GET(req: NextRequest) {
    const db = await getDatabase();
    
    // 1. Subgraph Status
    const subgraphHealth = await checkSubgraphHealth();
    
    // 2. Database latency
    const dbStart = Date.now();
    await db.collection('marketplace_items').findOne({});
    const dbLatency = Date.now() - dbStart;
    
    // 3. Contract Owner
    const contractOwner = await checkContractOwner();
    
    // 4. IPFS Gateway
    const ipfsHealth = await checkIPFSGateway();
    
    // 5. Last Sync
    const lastSync = await getLastSyncTime();
    
    return NextResponse.json({
        success: true,
        data: {
            database: {
                status: 'online',
                latency: dbLatency
            },
            subgraph: subgraphHealth,
            contract: contractOwner,
            ipfs: ipfsHealth,
            lastSync: lastSync
        }
    });
}
```

---

**Letzte Aktualisierung**: 22. Januar 2026
**Status**: Analyse & Vorschläge
