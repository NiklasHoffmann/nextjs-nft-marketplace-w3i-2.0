# Session Cookie Review

Admin sessions use the `admin-session` cookie. Flags are set explicitly on create and logout.

## Current Flags

- `httpOnly`: true
- `secure`: true in production, false in development
- `sameSite`: lax
- `path`: /
- `maxAge`: 24h (set on creation), 0 on logout

## Notes

- `sameSite=lax` is used to support redirect-based flows from the admin login page.
- If you deploy behind a custom domain or subdomain, you may add a `domain` attribute explicitly.

## Recommendation

- Keep `secure=true` in production.
- Consider `sameSite=strict` only if admin login flow does not rely on redirects.
