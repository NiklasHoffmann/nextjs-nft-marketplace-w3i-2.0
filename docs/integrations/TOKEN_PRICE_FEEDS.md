# Token Price Feeds

Multi-currency price conversion system for NFT marketplace listings with support for real tokens and mock testing tokens.

## Overview

The system displays prices in their native token (ETH, WETH, USDC, MERC20, etc.) with automatic USD conversion where available.

## Supported Tokens

### Real Tokens (Production)

| Token | Symbol | USD Conversion | Source |
|-------|--------|----------------|--------|
| Ether | ETH | ✅ Live | Coinbase/CryptoCompare API |
| Wrapped Ether | WETH | ✅ Live | Coinbase/CryptoCompare API |
| USD Coin | USDC | ✅ Fixed | $1.00 (stablecoin) |
| Dai Stablecoin | DAI | ✅ Fixed | $1.00 (stablecoin) |
| Tether USD | USDT | ✅ Fixed | $1.00 (stablecoin) |
| Wrapped Bitcoin | WBTC | ✅ Live | Coinbase BTC/USD API |

### Mock Tokens (Testing Only)

Mock tokens are only available on Hardhat (31337) and Sepolia (11155111) for development/testing.

| Token | Symbol | USD Rate | Purpose |
|-------|--------|----------|---------|
| Mock ERC20 | MERC20 | $1,850 | Generic ERC20 token testing |
| Mock WBTC | MWBTC | $45,000 | High-value token testing |
| Mock EURS | MEURS | €1.09 | Low-decimal token testing (2 decimals) |
| Mock USDT | MUSDT | $1.00 | USDT-like behavior testing (6 decimals) |

**Note:** Mock token rates are static and do NOT reflect real market prices.

## Architecture

### CurrencyContext

Location: `src/contexts/CurrencyContext.tsx`

#### Key Functions

```typescript
// Convert token amount to USD
convertTokenToUSD(tokenAmount: number, tokenSymbol: string): Promise<number>

// Convert ETH to selected fiat currency
convertFromETH(ethPrice: number): Promise<number>

// Format price with currency symbol
formatPrice(price: number): string
```

#### Cache Management

- **Duration**: 30 minutes
- **Storage**: localStorage + in-memory Map
- **Strategy**: Request deduplication (prevents parallel duplicate calls)
- **Fallback**: Default rates if API fails

### NFTCardPrice Component

Location: `src/components/nft/NFTCard/NFTCardPrice.tsx`

#### Features

- Automatic token symbol resolution (chainId-aware)
- USD conversion display
- Loading states
- Fallback to "X.XX TOKEN" when no USD rate available
- Sell/Swap indicator

#### Display Logic

```typescript
// ETH listing
0.0025 ETH
˜ $8.75

// MERC20 listing
2.5 MERC20
˜ $4,625.00

// Unknown token (no USD rate)
1.0 UNKNOWN
UNKNOWN Token
```

## Price Fetch Flow

```
1. User visits marketplace
   ↓
2. NFTCardPrice receives price + currency address
   ↓
3. getCurrencySymbolByAddress(chainId, address) → "MERC20"
   ↓
4. convertTokenToUSD(2.5, "MERC20") → checks cache
   ↓
5a. Cache hit (< 30min) → return cached rate
5b. Cache miss → fetchTokenRate("MERC20")
   ↓
6. Mock token? → return $1,850
   Real token? → fetch from API
   ↓
7. Display: "2.5 MERC20" + "˜ $4,625.00"
```

## API Endpoints

### Coinbase Exchange Rates

**Endpoint**: `https://api.coinbase.com/v2/exchange-rates?currency={CURRENCY}`

**Supported**: ETH, WETH, BTC (for WBTC)

**Response**:
```json
{
  "data": {
    "currency": "ETH",
    "rates": {
      "USD": "3500.00",
      "EUR": "3200.00"
    }
  }
}
```

### CryptoCompare (Fallback)

**Endpoint**: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH&tsyms=USD`

**Response**:
```json
{
  "ETH": {
    "USD": 3500.00
  }
}
```

## Adding New Tokens

### 1. Add to Token Config

**File**: `src/config/tokens.ts`

```typescript
export const TOKENS: NetworkTokens = {
  "11155111": { // Sepolia
    NEW_TOKEN: {
      address: "0x...",
      symbol: "NEWT",
      name: "New Token",
      decimals: 18
    }
  }
}
```

### 2. Add Price Feed

**File**: `src/contexts/CurrencyContext.tsx`

```typescript
private async fetchTokenRate(tokenSymbol: string): Promise<number> {
  // For mock tokens
  const mockRates: { [key: string]: number } = {
    'NEWT': 100.00, // $100 per token
  };
  
  // For real tokens
  if (tokenSymbol === 'NEWT') {
    const response = await fetch('https://api.example.com/price/NEWT');
    const data = await response.json();
    return data.usd;
  }
}
```

### 3. Test Display

1. Create test listing with new token
2. Verify symbol displays correctly
3. Check USD conversion shows up
4. Test on multiple chains (if applicable)

## Testing

### Manual Test

```bash
# 1. Start dev server
npm run dev

# 2. Create listing with MERC20 token
# 3. Check marketplace display shows:
#    - "X.XX MERC20" (token amount + symbol)
#    - "˜ $X,XXX.XX" (USD equivalent)

# 4. Verify MongoDB storage
node scripts/dev/verify-price-and-currency.js
```

### Expected MongoDB Data

```javascript
{
  price: "2500000000000000000", // 2.5 tokens in Wei
  currency: "0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e", // MERC20 address
  status: "LISTED"
}
```

### Expected Frontend Display

```
NFT Card:
  2.5 MERC20
  ˜ $4,625.00
  [Sell Indicator]
```

## Rate Limit Considerations

### Current Limits

- **Coinbase**: ~10 requests/second (no auth required)
- **CryptoCompare**: ~100,000 requests/month (free tier)

### Optimizations

1. **30-minute cache**: Reduces API calls by ~95%
2. **Request deduplication**: Multiple simultaneous requests share one API call
3. **localStorage persistence**: Survives page reloads
4. **Stablecoin hardcoding**: USDC/DAI/USDT always return $1.00 (no API call)
5. **Mock tokens**: Static rates (no API call)

### Rate Limit Safety

The system is designed to stay well under rate limits:

- Average marketplace page: ~10 unique tokens
- With 30min cache: 1 API call per token every 30 minutes
- Daily calls: 10 tokens × 48 intervals = **480 calls/day** (well under limits)

## Error Handling

### API Failures

```typescript
try {
  const rate = await fetchTokenRate(tokenSymbol);
  return rate;
} catch (error) {
  // Fallback logic
  if (isStablecoin(tokenSymbol)) return 1.00;
  if (isMockToken(tokenSymbol)) return getMockRate(tokenSymbol);
  return 0; // Show "TOKEN Token" without USD
}
```

### Display Fallbacks

1. API fails → cache used (if available)
2. Cache expired + API fails → default rates
3. Unknown token → show "X.XX TOKEN" without USD conversion
4. Network offline → localStorage cache still works

## Production Checklist

Before deploying to production:

- [ ] Remove mock tokens from `tokens.ts` (or set `includeMockTokens: false`)
- [ ] Verify API keys (if using authenticated endpoints)
- [ ] Test rate limit handling under load
- [ ] Confirm cache persistence across deployments
- [ ] Monitor API error rates in logs
- [ ] Set up alerts for exchange rate fetch failures

## Related Files

- `src/contexts/CurrencyContext.tsx` - Price conversion logic
- `src/components/nft/NFTCard/NFTCardPrice.tsx` - Display component
- `src/config/tokens.ts` - Token configuration
- `src/hooks/nfts/useNFTInsights.ts` - NFT metadata enrichment
- `scripts/dev/verify-price-and-currency.js` - Database verification

## Future Improvements

### Short Term

- [ ] Add Chainlink price feeds (on-chain, decentralized)
- [ ] Support more stablecoins (USDC.e, BUSD, FRAX)
- [ ] Add price chart history (7d/30d trends)

### Long Term

- [ ] Multi-currency listing support (list in USD, buy in ETH)
- [ ] Dynamic conversion at checkout (use current rate vs listing rate)
- [ ] Price alerts (notify when token reaches target price)
- [ ] Historical conversion tracking (show profit/loss in USD)

## FAQ

### Why mock tokens?

Mock tokens simulate real ERC20 behavior without requiring mainnet tokens. They're essential for:
- Testing different decimal precisions (8, 6, 2)
- Simulating high-value tokens (WBTC)
- Development without spending real ETH

### Why not use Chainlink?

Current system uses off-chain APIs (Coinbase, CryptoCompare) for:
- **Speed**: No blockchain calls required
- **Cost**: Free (vs gas fees for Chainlink)
- **Flexibility**: Easy to add new tokens
- **Caching**: 30-minute cache reduces load

Future versions may integrate Chainlink for decentralized, tamper-proof price feeds.

### What if exchange rate API is down?

Fallback strategy:
1. Use cached rate (< 30min old)
2. Use default hardcoded rates
3. Show token amount without USD conversion
4. Log error for monitoring

### How accurate are mock token rates?

Mock token rates are **NOT accurate** - they're static test values:
- MERC20: $1,850 (arbitrary)
- MWBTC: $45,000 (simulates Bitcoin value)
- MEURS: €1.09 (simulates Euro peg)
- MUSDT: $1.00 (simulates Tether)

**Do NOT use mock tokens in production.**

## Monitoring

### Key Metrics

- Cache hit rate (should be >90%)
- API error rate (should be <1%)
- Average conversion time (<100ms from cache)
- Failed conversions per day

### Logging

```typescript
devLog.info('currency', `Token rate fetched: ${tokenSymbol} = $${rate}`);
devLog.error('currency', `API error for ${tokenSymbol}:`, error);
devLog.debug('currency', `Cache hit for ${tokenSymbol}_USD`);
```

### Dashboard Ideas

- Real-time exchange rate charts
- API health status
- Cache effectiveness metrics
- Token usage distribution (which tokens are most listed?)
