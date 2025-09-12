# Exchange Rate API Documentation

## Overview
The application now uses multiple exchange rate APIs with intelligent fallback and automatic caching for reliable ETH to fiat currency conversions.

## API Hierarchy
1. **Primary**: Coinbase Exchange Rates API
2. **Fallback**: CryptoCompare API  
3. **Emergency**: Cached rates from localStorage
4. **Last Resort**: Hardcoded default rates

## APIs Used

### 1. Coinbase Exchange Rates API
- **URL**: `https://api.coinbase.com/v2/exchange-rates?currency=ETH`
- **Advantages**: High reliability, accurate rates, comprehensive currency support
- **Rate Limits**: Generous for public use
- **Response Format**:
```json
{
  "data": {
    "currency": "ETH",
    "rates": {
      "USD": "3500.12",
      "EUR": "3200.45",
      "GBP": "2800.67"
    }
  }
}
```

### 2. CryptoCompare API
- **URL**: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH&tsyms=USD,EUR,GBP,JPY,CHF,CAD`
- **Advantages**: Fast response, multiple currencies in single request
- **Rate Limits**: 100,000 calls/month for free tier
- **Response Format**:
```json
{
  "ETH": {
    "USD": 3500.12,
    "EUR": 3200.45,
    "GBP": 2800.67
  }
}
```

## Caching System

### Automatic Updates
- **Frequency**: Every 6 hours
- **Trigger**: Page load + background interval
- **Storage**: localStorage with expiry timestamps

### Cache Management
- **Key**: `eth_exchange_rates_fallback`
- **Expiry Key**: `eth_exchange_rates_expiry`
- **TTL**: 24 hours
- **Auto-refresh**: When cache expires

### Manual Refresh
Use the `refreshExchangeRates()` function from CurrencyContext:
```typescript
const { refreshExchangeRates } = useCurrency();
await refreshExchangeRates();
```

## Supported Currencies
- USD: US Dollar
- EUR: Euro  
- GBP: British Pound
- JPY: Japanese Yen
- CHF: Swiss Franc
- CAD: Canadian Dollar

## Error Handling
1. **API Failure**: Automatically try next API in hierarchy
2. **Network Issues**: Use cached rates if available
3. **Cache Miss**: Fall back to hardcoded rates
4. **Invalid Response**: Log error and continue with fallback

## Debug Features
- Console logging for all API calls
- Cache status indicators
- Manual refresh button (in DEBUG_MODE)
- Detailed conversion logs

## Configuration
```typescript
// Update intervals
const FALLBACK_EXPIRY_HOURS = 24; // Cache expiry
const AUTO_UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// API timeout (handled by fetch default)
const API_TIMEOUT = 10000; // 10 seconds
```

## Usage Examples

### Basic Conversion
```typescript
const { convertedPrice } = useETHPrice(1.5); // Convert 1.5 ETH
```

### Manual Cache Management
```typescript
const { getCacheInfo, refreshExchangeRates } = useCurrency();

// Check cache status
const cacheInfo = getCacheInfo();
console.log(cacheInfo.status); // "Fresh (12h left)" | "Expired" | "No cache"

// Force refresh
await refreshExchangeRates();
```

### Debug Information
Enable DEBUG_MODE in wallet page to see:
- Real-time API status
- Cache expiry information  
- Manual refresh controls
- Detailed rate information

## Performance Optimizations
- **Request Batching**: Multiple currencies per API call
- **Rate Limiting**: 200ms delay between currency updates
- **Caching**: Persistent localStorage cache
- **Smart Fallbacks**: Intelligent API selection
- **Background Updates**: Non-blocking rate refreshes

## Production Considerations
- Set `DEBUG_MODE = false` to hide debug information
- Monitor API usage for rate limits
- Consider upgrading to paid API tiers for higher limits
- Implement error monitoring for API failures