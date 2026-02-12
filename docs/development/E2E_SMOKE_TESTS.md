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
