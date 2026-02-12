# Sentry Error Tracking

This project uses Sentry for centralized error tracking.

## Setup

Add the DSNs to your environment:

- `SENTRY_DSN` for server and edge runtime
- `NEXT_PUBLIC_SENTRY_DSN` for the browser

Optional build-time values for source map upload:

- `SENTRY_ORG`
- `SENTRY_PROJECT`

## Configuration Files

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

## Notes

- Source maps are hidden in production builds.
- Error capture in the client error boundary now uses the Sentry SDK directly.
