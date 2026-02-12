# Structured Logging

This project uses a structured logger for production and a pretty console format in development.

## Logger

- Implementation: `src/lib/logger.ts`
- Library: `pino` with `pino-pretty` in non-production
- Level: `LOG_LEVEL` env var (defaults to `info` in prod, `debug` in dev)

## Usage

```ts
import { logger } from "@/lib/logger";

logger.info({ module: "sync", count: 42 }, "sync completed");
logger.error({ module: "sync", error }, "sync failed");
```

## API Logging

`apiHandler` logs request start and end with structured fields:

- method
- path
- status
- durationMs

## Recommendation

- Use `logger` for server-side logs.
- Keep client-side logs behind `devLog` for development only.
