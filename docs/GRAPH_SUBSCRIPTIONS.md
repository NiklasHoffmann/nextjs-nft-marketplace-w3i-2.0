# GraphQL Subscriptions Setup

How to enable real-time data sync using GraphQL subscriptions instead of polling.

## 🎯 Overview

By default, the sync script uses **polling** (HTTP requests every 30 seconds). With subscriptions enabled, it uses **WebSocket connections** for real-time updates when new NFTs are listed.

### Polling vs Subscriptions

| Mode | Method | Latency | Pros | Cons |
|------|--------|---------|------|------|
| **Polling** | HTTP POST every 30s | 30s delay | Works everywhere, simple | Delayed updates, wasteful |
| **Subscriptions** | WebSocket | Real-time | Instant updates, efficient | Requires WebSocket support |

## 📋 Prerequisites

### 1. Install Dependencies

```bash
npm install graphql-ws ws
```

### 2. Check TheGraph Support

**Hosted Service**:
- ❌ Does NOT support subscriptions
- Use polling mode

**Self-Hosted Graph Node**:
- ✅ Supports subscriptions
- WebSocket endpoint: `ws://your-graph-node:8001/`

**Subgraph Studio**:
- ⚠️ Check documentation (varies by plan)

### 3. Environment Variables

Add to `.env.local`:

```bash
# Enable subscriptions
USE_GRAPH_SUBSCRIPTIONS=true

# WebSocket URL (if using self-hosted Graph Node)
NEXT_PUBLIC_SUBGRAPH_WS_URL=ws://localhost:8001/subgraphs/name/your-subgraph

# Or for remote Graph Node
NEXT_PUBLIC_SUBGRAPH_WS_URL=wss://your-graph-node.com/subgraphs/name/your-subgraph
```

## 🔧 Configuration

### Complete .env.local Example

```bash
# GraphQL HTTP endpoint (polling)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/12345/marketplace-subgraph/version/latest

# GraphQL WebSocket endpoint (subscriptions)
NEXT_PUBLIC_SUBGRAPH_WS_URL=ws://localhost:8001/subgraphs/name/marketplace

# Enable subscriptions
USE_GRAPH_SUBSCRIPTIONS=true

# MongoDB
MONGODB_URI=mongodb+srv://...

# Alchemy RPC
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## 🚀 Usage

### With Subscriptions Enabled

```bash
node scripts/sync-marketplace-data.js
```

**Output**:
```
🚀 NFT Marketplace Sync gestartet...

📡 Subscription mode enabled
   Initial sync + real-time updates via WebSocket

🔌 Setting up GraphQL subscription...
   WebSocket URL: ws://localhost:8001/subgraphs/name/marketplace
✅ WebSocket connected
✅ Subscription active - listening for new listings

🔔 New listing event received!
   NFT: 0x123.../42
   Price: 1000000000000000 Wei
   Seller: 0xabc...
🔄 Syncing single NFT: 0x123.../42
   ✅ Updated existing NFT
```

### Polling Mode (Default)

If subscriptions are disabled or fail:

```bash
node scripts/sync-marketplace-data.js
```

**Output**:
```
🚀 NFT Marketplace Sync gestartet...

📊 Polling mode (default)
   To enable subscriptions:
   1. Install: npm install graphql-ws ws
   2. Set NEXT_PUBLIC_SUBGRAPH_WS_URL in .env.local
   3. Set USE_GRAPH_SUBSCRIPTIONS=true in .env.local

[Runs once and exits]
```

## 🔄 How It Works

### Subscription Mode Flow

```
1. Initial Sync
   ├─ Fetch all existing items from TheGraph (HTTP)
   ├─ Update MongoDB with current state
   └─ Complete

2. Setup WebSocket Subscription
   ├─ Connect to SUBGRAPH_WS_URL
   ├─ Subscribe to itemListeds events
   └─ Listen for new events

3. Real-Time Updates
   ├─ New listing event received
   ├─ Fetch contract data for specific NFT
   ├─ Fetch IPFS metadata
   ├─ Fetch insights from MongoDB
   ├─ Update/Insert in marketplace_items
   └─ Ready for next event
```

### GraphQL Subscription Query

```graphql
subscription OnItemListed {
  itemListeds(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
    id
    listingId
    nftAddress
    tokenId
    seller
    buyer
    price
    desiredNftAddress
    desiredTokenId
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

## 🏗️ Self-Hosted Graph Node Setup

To use subscriptions, you need a self-hosted Graph Node.

### 1. Run Graph Node Locally

```bash
# Clone Graph Node
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker

# Configure for Sepolia
# Edit docker-compose.yml:
# - Set ethereum: 'sepolia:https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'

# Start services
docker-compose up
```

### 2. Deploy Your Subgraph

```bash
# In your subgraph directory
npm install -g @graphprotocol/graph-cli

# Create subgraph
graph create --node http://localhost:8020/ your-username/marketplace

# Deploy
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 your-username/marketplace
```

### 3. WebSocket Endpoints

```bash
# HTTP (polling)
http://localhost:8000/subgraphs/name/your-username/marketplace

# WebSocket (subscriptions)
ws://localhost:8001/subgraphs/name/your-username/marketplace
```

### 4. Update Environment

```bash
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/your-username/marketplace
NEXT_PUBLIC_SUBGRAPH_WS_URL=ws://localhost:8001/subgraphs/name/your-username/marketplace
USE_GRAPH_SUBSCRIPTIONS=true
```

## 🔍 Verification

### Test WebSocket Connection

```javascript
// test-subscription.js
const { createClient } = require('graphql-ws');
const WebSocket = require('ws');

const client = createClient({
  url: 'ws://localhost:8001/subgraphs/name/marketplace',
  webSocketImpl: WebSocket,
});

client.subscribe(
  {
    query: `
      subscription {
        itemListeds(first: 1) {
          id
          nftAddress
          tokenId
        }
      }
    `,
  },
  {
    next: (data) => console.log('Received:', data),
    error: (error) => console.error('Error:', error),
    complete: () => console.log('Complete'),
  }
);
```

Run:
```bash
node test-subscription.js
```

## 📊 Performance Comparison

### Polling (30s interval)

```
New listing occurs at 00:00:00
Next poll at 00:00:30
Update seen after: 30 seconds ❌
```

### Subscriptions (WebSocket)

```
New listing occurs at 00:00:00
Event received at 00:00:00.2
Update seen after: 0.2 seconds ✅
```

**Result**: ~150x faster updates with subscriptions!

## 🐛 Troubleshooting

### WebSocket Connection Failed

```
❌ WebSocket error: connect ECONNREFUSED
```

**Solution**:
- Check if Graph Node is running: `docker ps`
- Verify WebSocket port (usually 8001)
- Check firewall settings
- Try `ws://` instead of `wss://` for local

### Subscription Not Receiving Events

```
✅ WebSocket connected
[No events received]
```

**Solution**:
- Verify subgraph is synced: Check Graph Node logs
- Test with a new listing on the marketplace
- Check subscription query matches your schema

### Fallback to Polling

```
⚠️  Could not setup subscription: Cannot find module 'graphql-ws'
   Falling back to polling...
```

**Solution**:
```bash
npm install graphql-ws ws
```

### Invalid WebSocket URL

```
❌ WebSocket error: Invalid URL
```

**Solution**:
- Use `ws://` for local (not `http://`)
- Use `wss://` for remote with SSL
- Include full path: `ws://localhost:8001/subgraphs/name/marketplace`

## 🔐 Production Considerations

### Security

For production WebSocket connections:

```bash
# Use WSS (WebSocket Secure)
NEXT_PUBLIC_SUBGRAPH_WS_URL=wss://graph-node.yourdomain.com/subgraphs/name/marketplace

# Add authentication if needed
# (depends on your Graph Node setup)
```

### Monitoring

```javascript
// Add monitoring in setupSubscription()
wsClient.on('connected', () => {
  console.log('✅ WebSocket connected');
  // Log to monitoring service
});

wsClient.on('closed', () => {
  console.log('⚠️  WebSocket closed');
  // Alert monitoring
});

wsClient.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  // Send to error tracking (Sentry, etc.)
});
```

### Auto-Reconnect

The `graphql-ws` client automatically reconnects:

```javascript
{
  retryAttempts: 5,        // Retry up to 5 times
  keepAlive: 10000,        // Keep-alive ping every 10s
  connectionAckWaitTimeout: 5000  // Wait 5s for connection ack
}
```

## 📚 Resources

- **graphql-ws**: https://github.com/enisdenjo/graphql-ws
- **Graph Node**: https://github.com/graphprotocol/graph-node
- **TheGraph Docs**: https://thegraph.com/docs/en/

## 🎯 Summary

### Enable Subscriptions:

1. ✅ Install: `npm install graphql-ws ws`
2. ✅ Setup self-hosted Graph Node
3. ✅ Set `NEXT_PUBLIC_SUBGRAPH_WS_URL` in `.env.local`
4. ✅ Set `USE_GRAPH_SUBSCRIPTIONS=true`
5. ✅ Run script: `node scripts/sync-marketplace-data.js`

### Benefits:

- ⚡ Real-time updates (instant vs 30s delay)
- 💾 Less bandwidth (only changes, not full polls)
- 🔋 More efficient (server pushes, not client pulls)
- 🎯 Better UX (users see new listings immediately)

### Trade-offs:

- 🔧 More complex setup (need Graph Node)
- 💰 May require hosting costs
- 🔌 WebSocket connection management

**Recommendation**: Use subscriptions if you need real-time updates and can self-host Graph Node. Otherwise, polling is sufficient for most use cases.
