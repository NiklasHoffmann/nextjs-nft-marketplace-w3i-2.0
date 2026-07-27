## Known issues / in-progress

- `@ts-ignore` is used for `NextRequest` extensions (`userAddress`, `isAdmin`) in auth/validation middleware and several API routes — a typed request wrapper would remove the need for this.
- Admin auth automated tests are still pending (see `docs/api/authentication.md`).
- `src/app/history-towers/__tests__/README.md` tracks remaining test suites for that feature (a game/gamification module under `src/app/history-towers/`).
