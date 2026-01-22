# API Documentation

Complete API reference and authentication guides.

## Contents

### [API Routes Reference](./routes.md)
Complete documentation of all API endpoints, request/response formats, and usage examples.

**Topics:**
- Authentication endpoints
- NFT data endpoints
- Admin endpoints (protected)
- Marketplace endpoints
- User endpoints (protected)
- Wallet endpoints
- Collections endpoints
- Request/response formats
- Error handling
- Caching strategies

### [Admin Authentication](./authentication.md)
Signature-based admin authentication system.

**Topics:**
- Authentication flow (challenge-response)
- Wallet signature verification
- Session management (24h cookies)
- Security features
- Protected routes with `withAdmin` middleware
- API usage examples
- Troubleshooting

## Quick Links

- **Main Docs**: [../README.md](../README.md)
- **Architecture**: [../architecture/overview.md](../architecture/overview.md)
- **Development**: [../development/setup.md](../development/setup.md)

## API Infrastructure

All API routes use the standardized `apiHandler` pattern with:
- ✅ Automatic error handling
- ✅ Middleware support (auth, validation)
- ✅ Type-safe request/response
- ✅ Zod schema validation
- ✅ Request logging
- ✅ CORS support

See [routes.md](./routes.md) for complete API reference.
