# Project Quality Checklist

This checklist tracks best-practice hardening for stability, security, and operational readiness.

## Baseline (Local)

- [x] Lint script configured and clean
- [x] Typecheck script configured and clean
- [x] Unit tests configured and clean
- [x] Environment checks available (`scripts/check-env.js`)
- [x] Security headers configured in `next.config.ts`

## CI/CD

- [x] CI pipeline (lint, typecheck, test, build)
- [x] CI artifacts or reports (test coverage, build stats)
- [ ] Release/versioning workflow documented

## Security & Hardening

- [x] API rate limiting / abuse protection
- [x] CSP reviewed for production (minimize unsafe-eval/inline)
- [x] Cookie/session flags verified in production
- [x] Dependency audit in CI

## Observability

- [x] Centralized error tracking (e.g., Sentry)
- [x] Structured production logging
- [x] Health/metrics dashboard and alerts

## Reliability

- [ ] Background jobs retry/backoff and alerting
- [ ] External dependency failover strategy documented
- [ ] Backups and restore plan documented

## Data Integrity

- [ ] Index strategy documented and applied
- [ ] Migration strategy documented and tested

## QA

- [x] E2E smoke tests for critical flows
- [ ] Performance budgets or monitoring
