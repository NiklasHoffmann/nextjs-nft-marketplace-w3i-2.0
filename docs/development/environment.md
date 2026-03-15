# Environment Variables Guide

## Required Environment Variables

### Real-Time WebSocket Events

For the real-time marketplace events system to work, you need WebSocket URLs:

```env
# Client-side WebSocket URLs (required for real-time events)
NEXT_PUBLIC_ALCHEMY_URL_WSS=wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_INFURA_URL_WSS=wss://sepolia.infura.io/ws/v3/YOUR_API_KEY
```

**Why NEXT_PUBLIC_?**
- The EventListener service runs in the **browser (client-side)**
- Next.js only exposes environment variables starting with `NEXT_PUBLIC_` to the browser
- Server-only variables (without `NEXT_PUBLIC_`) are not accessible in client code

### Complete .env.local Template

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB=database_name

# Server-side RPC URLs
JSON_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ALCHEMY_URL_WSS=wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
INFURA_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
INFURA_URL_WSS=wss://sepolia.infura.io/ws/v3/YOUR_API_KEY

# Client-side RPC URLs
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Client-side WebSocket URLs (REQUIRED for real-time events)
NEXT_PUBLIC_ALCHEMY_URL_WSS=wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_INFURA_URL_WSS=wss://sepolia.infura.io/ws/v3/YOUR_API_KEY

# API Keys
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
GOOGLE_API_KEY=your_google_api_key
JWT_SECRET=your_long_random_secret

# Exchange Rate APIs
NEXT_PUBLIC_COINBASE_API_URL=https://api.coinbase.com/v2/exchange-rates
NEXT_PUBLIC_CRYPTOCOMPARE_API_URL=https://min-api.cryptocompare.com/data/pricemulti
NEXT_PUBLIC_EXCHANGE_RATE_CACHE_HOURS=24
NEXT_PUBLIC_EXCHANGE_RATE_UPDATE_INTERVAL_HOURS=6
NEXT_PUBLIC_CURRENCY_DEBUG_MODE=true

# Admin Access Control
NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES=0xAddress1,0xAddress2
NEXT_PUBLIC_INSIGHTS_READ_ONLY_MODE=false
NEXT_PUBLIC_APP_LOCK_ENABLED=false
```

## Troubleshooting

### "WebSocket URL not configured" Error

This error occurs when the real-time events system cannot find a WebSocket URL.

**Solution:**
1. Add `NEXT_PUBLIC_ALCHEMY_URL_WSS` or `NEXT_PUBLIC_INFURA_URL_WSS` to your `.env.local`
2. Make sure the variable starts with `NEXT_PUBLIC_` (required for client-side access)
3. Restart your dev server: `Ctrl+C` then `npm run dev`

### WebSocket Connection Failed

Check:
- ✅ URL format: `wss://` (not `https://`)
- ✅ API key is valid and has WebSocket access enabled
- ✅ Network allows WebSocket connections (corporate firewalls may block)
- ✅ Provider (Alchemy/Infura) has not rate-limited you

### How to Get WebSocket URLs

**Alchemy:**
1. Go to https://dashboard.alchemy.com
2. Create/select your app
3. Copy the WebSocket URL (starts with `wss://`)

**Infura:**
1. Go to https://infura.io/dashboard
2. Create/select your project
3. WebSocket endpoint format: `wss://sepolia.infura.io/ws/v3/YOUR_PROJECT_ID`

## Production Deployment

When deploying to production (Vercel, Railway, etc.):

1. **Add all environment variables** in the deployment platform's settings
2. **Double-check `NEXT_PUBLIC_` prefix** for client-side variables
3. **Use production RPC URLs** (not development/testnet)
4. **Keep server-only secrets** without `NEXT_PUBLIC_` prefix

## Security Notes

⚠️ **Never commit `.env.local` to git**
- Contains sensitive API keys and secrets
- Already in `.gitignore` by default

✅ **Client-side variables (`NEXT_PUBLIC_`) are public**
- Visible in browser's JavaScript
- Anyone can see them in network requests
- Restrict API keys in provider dashboard (by domain/IP)

❌ **Server-side secrets must stay server-side**
- MongoDB URI, JWT Secret, Google API Key
- Never add `NEXT_PUBLIC_` prefix to these
- Only accessible in API routes and server components

## Runtime Role Split (Web + Worker)

If Coolify's Nixpacks integration fails while parsing the generated plan,
switch the service to Dockerfile-based deployment and use the repository's
root Dockerfile instead. The Docker image honors `APP_RUNTIME_ROLE` and can
run as either `web` or `worker`.

To keep full functionality on weaker servers without overloading the web process,
run the app in split mode:

### 1) Web process (serves HTTP only)

Set:

```env
APP_RUNTIME_ROLE=web
```

Run:

```bash
npm run start:web
```

### 2) Worker process (background services)

Set:

```env
APP_RUNTIME_ROLE=worker
```

Run:

```bash
npm run worker:start
```

This keeps all sync functionality (WebSocket listener, Graph fallback, stats sync,
insights sync, cache prewarm), but moves heavy work off the web instance.

## Background Service Tuning (Optional)

Use these env vars to tune load for smaller servers:

```env
# Disable optional startup jobs (worker-safe toggles)
BACKGROUND_ENABLE_INDEX_SETUP=true
BACKGROUND_ENABLE_MARKETPLACE_PREWARM=true
BACKGROUND_ENABLE_IMAGE_PREWARM=true

# Graph fallback polling window (ms)
GRAPH_SYNC_MIN_INTERVAL_MS=300000
GRAPH_SYNC_MAX_INTERVAL_MS=900000

# Stats sync cadence and throughput
STATS_SYNC_INTERVAL_MS=300000
STATS_SYNC_BATCH_SIZE=50

# Insights sync cadence and throughput
INSIGHTS_SYNC_INTERVAL_MS=1800000
INSIGHTS_SYNC_BATCH_SIZE=100
```
