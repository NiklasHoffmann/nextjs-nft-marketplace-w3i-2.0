# CSP Review

This project uses a Content Security Policy (CSP) defined in `next.config.ts` headers.

## Current Policy

Two CSP modes are available:

- Relaxed (default): allows `unsafe-inline` and `unsafe-eval` for Web3 tooling compatibility.
- Strict: removes `unsafe-eval` and disallows inline scripts.

The mode is selected via `CSP_MODE`:

- `CSP_MODE=relaxed` (default)
- `CSP_MODE=strict`

## Reporting (Optional)

You can enable report-only mode and reporting endpoints:

- `CSP_REPORT_ONLY=true` sets `Content-Security-Policy-Report-Only`.
- `CSP_REPORT_URI=<https://your-report-endpoint>` sets reporting headers.

This is useful to detect blocked resources before enforcing strict CSP in production.

## Recommendation

- Use `CSP_REPORT_ONLY=true` in staging to collect violations.
- Switch to `CSP_MODE=strict` in production if all critical flows pass without violations.
