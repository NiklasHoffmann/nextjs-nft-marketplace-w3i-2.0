# E2E Smoke Tests

This project uses Playwright for end-to-end smoke tests.

## Setup

1. Install dependencies

```
npm install
```

2. Start the app

```
npm run dev
```

3. Run Playwright tests

```
npm run test:e2e
```

## Configuration

- Base URL can be overridden with `PLAYWRIGHT_BASE_URL`.
- In CI, retries are enabled automatically.

## Included Smoke Tests

- Home page loads.
- Admin login page loads.

## 1inch Swap Sanity Suite

Neue manuelle-wallet-freundliche Playwright-Suite:

- `tests/e2e/oneinch-swap.sanity.spec.ts`

### Run

```bash
npm run test:e2e -- tests/e2e/oneinch-swap.sanity.spec.ts
```

### Required Environment Variables

BuyNow URLs:

- `E2E_ONEINCH_ETH_TO_TOKEN_BUYNOW_URL`
- `E2E_ONEINCH_TOKEN_TO_ETH_BUYNOW_URL`
- `E2E_ONEINCH_TOKEN_TO_TOKEN_BUYNOW_URL`

Cart URLs:

- `E2E_ONEINCH_ETH_TO_TOKEN_CART_URL`
- `E2E_ONEINCH_TOKEN_TO_ETH_CART_URL`
- `E2E_ONEINCH_TOKEN_TO_TOKEN_CART_URL`

Optional symbols (defaults in Klammern):

- `E2E_ONEINCH_ETH_TO_TOKEN_SOURCE` (`ETH`), `E2E_ONEINCH_ETH_TO_TOKEN_DEST` (`USDC`)
- `E2E_ONEINCH_TOKEN_TO_ETH_SOURCE` (`USDC`), `E2E_ONEINCH_TOKEN_TO_ETH_DEST` (`ETH`)
- `E2E_ONEINCH_TOKEN_TO_TOKEN_SOURCE` (`DAI`), `E2E_ONEINCH_TOKEN_TO_TOKEN_DEST` (`USDT`)

Wenn eine URL fehlt, wird der jeweilige Test mit klarer Skip-Meldung übersprungen.
