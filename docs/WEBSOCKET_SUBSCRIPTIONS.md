# WebSocket Subscriptions Setup

## Current Status

✅ **Script Updated**: Supports both subscription and polling modes
❌ **TheGraph Studio**: Does NOT support WebSocket subscriptions on hosted service
⏱️  **Current Mode**: Polling (30 seconds) - Working fine

## Why No Subscriptions Yet?

TheGraph Studio's **hosted service** does NOT support WebSocket subscriptions:
- ❌ `wss://api.studio.thegraph.com/...` - Not available
- ✅ `https://api.studio.thegraph.com/...` - HTTP only (polling)

## How to Enable Real-Time Subscriptions

### Option 1: Self-Hosted Graph Node (Recommended for Production)

**Setup**:
1. Deploy your own Graph Node
2. Index your subgraph locally
3. Enable WebSocket subscriptions

**Benefits**:
- ✅ Real-time updates (instant)
- ✅ No polling overhead
- ✅ Full control over infrastructure
- ✅ No rate limits

**Setup Guide**: https://thegraph.com/docs/en/operating-graph-node/

### Option 2: Decentralized Network (Future)

TheGraph's **Decentralized Network** supports subscriptions:
- Requires migration to mainnet
- Requires GRT tokens for indexing
- Production-ready option

**Migration Guide**: https://thegraph.com/docs/en/network/

### Option 3: Keep Polling (Current - Works Fine!)

**Current Setup**:
- ✅ Polls every 30 seconds
- ✅ Reliable and tested
- ✅ No additional infrastructure
- ✅ Sufficient for most use cases

## Configuration

### Environment Variables

```bash
# Required (Currently Active)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../marketplace-subgraph/...

# Optional (For Future Self-Hosted Node)
NEXT_PUBLIC_SUBGRAPH_WS_URL=ws://localhost:8001/subgraphs/name/your-subgraph
```

### Script Behavior

The sync script automatically detects which mode to use:

```
If NEXT_PUBLIC_SUBGRAPH_WS_URL is set:
  └─ Try WebSocket subscriptions
     └─ If fails → Fallback to polling

If NEXT_PUBLIC_SUBGRAPH_WS_URL not set:
  └─ Use polling mode (current)
```

## Testing Subscriptions (Local Development)

### 1. Run Local Graph Node

```bash
# Clone Graph Node
git clone https://github.com/graphprotocol/graph-node

# Start with Docker
cd graph-node/docker
./setup.sh

# Start services
docker-compose up
```

### 2. Deploy Subgraph Locally

```bash
# In your subgraph project
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 your-subgraph
```

### 3. Update .env.local

```bash
# Local Graph Node WebSocket
NEXT_PUBLIC_SUBGRAPH_WS_URL=ws://localhost:8001/subgraphs/name/your-subgraph
```

### 4. Run Sync Script

```bash
node scripts/sync-marketplace-data.js
```

You should see:
```
🔧 Sync Configuration:
  - HTTP Endpoint: https://api.studio.thegraph.com/...
  - WebSocket: ws://localhost:8001/...
  - Mode: 🔔 Subscriptions (real-time)

✅ WebSocket connected
👂 Listening for marketplace events...
```

## Subscription Query

When WebSocket is available, the script subscribes to:

```graphql
subscription OnItemsChanged {
  itemListeds(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
    id
    listingId
    nftAddress
    tokenId
    seller
    price
    desiredNftAddress
    desiredTokenId
    blockTimestamp
  }
  itemBoughts(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
    id
    listingId
    nftAddress
    tokenId
    buyer
    blockTimestamp
  }
  itemCanceleds(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
    id
    listingId
    nftAddress
    tokenId
    blockTimestamp
  }
}
```

## Performance Comparison

### Polling (Current)
- ⏱️ Updates every 30 seconds
- 🔄 Full sync each time
- 📊 ~60 seconds delay worst case
- ✅ Works with TheGraph Studio
- ✅ No additional infrastructure

### Subscriptions (With Self-Hosted Node)
- ⚡ Instant updates (< 1 second)
- 🎯 Only changed items synced
- 📊 Real-time marketplace state
- ⚠️ Requires Graph Node
- ⚠️ Additional infrastructure

## Current Recommendation

**Keep polling for now** - It works well and requires no additional setup:

✅ 30-second updates are fast enough for marketplace
✅ Reliable with TheGraph Studio
✅ No infrastructure overhead
✅ Proven in production

**Consider subscriptions later** when:
- You need < 5 second real-time updates
- You're running high-volume marketplace
- You want to self-host for full control

## Monitoring

### Check Current Mode

Script logs on startup:
```bash
🔧 Sync Configuration:
  - HTTP Endpoint: https://api.studio.thegraph.com/...
  - WebSocket: Not configured (using polling)
  - Mode: ⏱️  Polling (30s interval)
```

### Verify Updates

```bash
# Watch sync logs
node scripts/sync-marketplace-data.js

# Check MongoDB last update
db.marketplace_items.find().sort({lastUpdated: -1}).limit(1)
```

## Troubleshooting

### "Subscription mode failed"
- Normal! TheGraph Studio doesn't support WebSocket
- Script automatically falls back to polling
- No action needed

### Want faster updates?
- Reduce `POLLING_INTERVAL` in script (currently 30000ms)
- Be aware of rate limits on TheGraph Studio
- Consider self-hosting for unlimited requests

## Related Documentation

- **[MARKETPLACE_SYNC.md](../docs/MARKETPLACE_SYNC.md)** - Complete sync documentation
- **[TheGraph Docs](https://thegraph.com/docs/)** - Official documentation
- **[Graph Node Setup](https://github.com/graphprotocol/graph-node)** - Self-hosting guide

## Summary

✅ **Script Ready**: Supports both modes (polling + subscriptions)
⏱️  **Current**: Polling mode (30s) - works great!
🔮 **Future**: Can enable subscriptions with self-hosted Graph Node
📊 **Status**: Production ready as-is
