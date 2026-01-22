# Sync Status Tracking

## Problem
The current implementation uses `marketplace_items.updatedAt` to determine sync health, which is problematic because:
- This timestamp only updates when marketplace events occur (list, buy, cancel)
- If there's no marketplace activity for days/weeks, the timestamp becomes stale
- This makes a perfectly healthy system appear "stale" or "delayed"

Example: If no NFTs are listed/sold for 7 days, sync shows "166h ago" even though the system is working fine.

## Current Solution
The health API now supports two modes:

### 1. Production Mode: sync_status Collection (Recommended)
Create a dedicated `sync_status` collection to track actual sync operations:

```typescript
// Collection: sync_status
{
    service: 'marketplace_events',
    lastSyncAt: ISODate("2024-01-15T10:30:00Z"),
    lastBlockProcessed: 12345678,
    totalEventsProcessed: 1250,
    lastEventType: 'ItemListed',
    status: 'running',
    error: null
}
```

### 2. Fallback Mode: Marketplace Activity
If `sync_status` doesn't exist, falls back to marketplace activity with lenient thresholds:
- **Delayed**: No activity for >2 hours
- **Stale**: No activity for >24 hours
- **No Activity**: System might be healthy, just no marketplace events

## Implementation

### Step 1: Update NFT Sync Service
Modify the event sync service to track its status:

```typescript
// src/services/nft-sync/index.ts
async function updateSyncStatus(db: Db, eventType: string, blockNumber: number) {
    await db.collection('sync_status').updateOne(
        { service: 'marketplace_events' },
        {
            $set: {
                service: 'marketplace_events',
                lastSyncAt: new Date(),
                lastBlockProcessed: blockNumber,
                lastEventType: eventType,
                status: 'running',
                error: null
            },
            $inc: { totalEventsProcessed: 1 }
        },
        { upsert: true }
    );
}

// Call after processing each batch:
await updateSyncStatus(db, 'ItemListed', latestBlock);
```

### Step 2: MongoDB Index
Create index for fast lookups:

```javascript
db.sync_status.createIndex({ service: 1 }, { unique: true })
```

### Step 3: Initial Document
Create the initial status document:

```javascript
db.sync_status.insertOne({
    service: 'marketplace_events',
    lastSyncAt: new Date(),
    lastBlockProcessed: 0,
    totalEventsProcessed: 0,
    lastEventType: null,
    status: 'initialized',
    error: null
})
```

## Status Interpretation

### With sync_status Collection
- **Synced**: Last sync within 5 minutes
- **Delayed**: Last sync 5-15 minutes ago
- **Stale**: Last sync >15 minutes ago

### Without sync_status (Fallback)
- **No Activity**: No marketplace events for <2 hours (yellow warning, likely OK)
- **Delayed**: No marketplace events for 2-24 hours (yellow warning)
- **Stale**: No marketplace events for >24 hours (red error, might indicate problem)

## UI Representation

### Status Badges
- **Synced** (Green): ✅ System actively processing events
- **No Activity** (Yellow): ⚠️ No recent marketplace events (might be normal)
- **Delayed** (Yellow): ⚠️ Sync might be slow or no recent activity
- **Stale** (Red): ❌ Sync service likely has issues

### Detail Labels
```typescript
// With sync_status:
"Last sync: 2 min ago"
"Block: 12345678"
"Events: 1,250 processed"

// Without sync_status (fallback):
"Last activity: 166h ago"
"(Marketplace activity based)"
```

## Testing

### Test Scenario 1: Active System
1. Deploy with sync_status tracking
2. List an NFT
3. Check health API: Should show "synced" with <1 min timestamp

### Test Scenario 2: Idle System
1. Don't perform any marketplace actions for 1 hour
2. Check health API with sync_status: Should show "delayed" or "stale"
3. Check health API without sync_status: Should show "no_activity" (yellow, not red)

### Test Scenario 3: Broken Sync
1. Stop the sync service
2. Wait 20 minutes
3. Health API should show "stale" (red) with sync_status

## Migration Path

### Phase 1: Immediate (Current State)
- ✅ Health API supports both modes
- ✅ Falls back to marketplace activity if sync_status doesn't exist
- ✅ Uses lenient thresholds to avoid false alarms

### Phase 2: Production Enhancement
1. Add sync_status tracking to NFT sync service
2. Create MongoDB index
3. Initialize document on first run
4. Update after each sync batch

### Phase 3: Advanced Monitoring
- Track sync duration (performance monitoring)
- Store error logs in sync_status
- Add per-event-type counters
- Implement alerting for stale syncs

## Recommendation
Implement sync_status tracking as soon as possible. Current fallback mode works but:
- Can't distinguish between "no activity" and "sync broken"
- Uses lenient thresholds that might miss actual issues
- Provides less useful debugging information

With proper tracking, you'll have accurate real-time sync health monitoring.
