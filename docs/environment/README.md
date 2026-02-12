# Environment Configuration Guide

## 📁 File Structure

```
├── .env                        # ✅ Team defaults (committed)
├── .env.local                  # 🔒 Your secrets (NEVER commit!)
├── .env.production.local       # 🔒 Production secrets (NEVER commit!)
├── .env.local.template         # 📋 Development template
├── .env.production.template    # 📋 Production template
└── docs/environment/
    └── ENV_VARIABLES.md        # 📖 Complete documentation
```

## 🚀 Quick Start

### For Development

```bash
# 1. Copy template
cp .env.local.template .env.local

# 2. Fill in your secrets
# Edit .env.local with your API keys

# 3. Start development server
npm run dev
```

### For Production

```bash
# 1. Copy production template
cp .env.production.template .env.production.local

# 2. Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Configure production APIs
# Edit .env.production.local with production values

# 4. Deploy
npm run build && npm run start
```

## 🔐 Security Rules

### ✅ DO:

- Keep `.env.local` and `.env.production.local` in `.gitignore`
- Use templates (`.template` files) for documentation
- Commit `.env` for team-wide defaults (no secrets!)
- Rotate secrets regularly
- Use separate keys for dev/prod

### ❌ DON'T:

- Never commit files ending in `.local`
- Never hard-code secrets in source files
- Never share API keys via chat/email
- Never use same secrets for dev and production

## 📊 Priority Order

Next.js loads environment files in this order (later ones override earlier):

1. `.env` (lowest priority)
2. `.env.local`
3. `.env.production` or `.env.development`
4. `.env.production.local` or `.env.development.local` (highest priority)

## 🔍 Variable Types

### Server-Side (Private)

```bash
# No NEXT_PUBLIC_ prefix
MONGODB_URI=...
JWT_SECRET=...
ALCHEMY_URL=...
```

- Only accessible in API routes and server components
- NEVER exposed to browser
- Perfect for secrets
- Required for admin session signing; auth routes return 500 when missing

### Client-Side (Public)

```bash
# NEXT_PUBLIC_ prefix required
NEXT_PUBLIC_MARKETPLACE_ADDRESS=...
NEXT_PUBLIC_ALCHEMY_API_KEY=...
```

- Exposed to browser (visible in Network tab)
- Must have rate limits configured
- Use for non-sensitive config only

## 📖 Documentation

See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for:

- Complete variable reference
- Security best practices
- Troubleshooting guide
- Provider setup instructions

## 🆘 Common Issues

### "MongoDB connection failed"

```bash
# Check your connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI"
```

### "RPC rate limit exceeded"

- Verify API key has quota
- Check usage in provider dashboard
- Consider upgrading plan

### "Environment variable not loading"

```bash
# Restart dev server after .env changes
npm run dev

# Verify variable is set
echo $NEXT_PUBLIC_YOUR_VAR

# Check it's not typo'd in code
grep -r "NEXT_PUBLIC_YOUR_VAR" src/
```

## 🔄 Updating Environment

### Add New Variable

1. **Add to templates:**
   - `.env.local.template` (dev)
   - `.env.production.template` (prod)

2. **Document in:**
   - `docs/environment/ENV_VARIABLES.md`
   - Add description, type, example

3. **Update your local file:**

   ```bash
   # Add to .env.local
   MY_NEW_VAR=value
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Remove Deprecated Variable

1. **Remove from templates**
2. **Add to "Deprecated" section in docs**
3. **Keep for 1 version** (migration period)
4. **Remove completely** after migration

## 🎯 Checklist for Deployment

Before deploying to production:

- [ ] All secrets are production-grade (64+ chars)
- [ ] API keys have rate limits configured
- [ ] Database has backups enabled
- [ ] Admin addresses are verified
- [ ] All `NEXT_PUBLIC_` vars reviewed (no secrets!)
- [ ] Subgraph URLs point to production
- [ ] Smart contract addresses verified on Etherscan
- [ ] Monitoring/alerting configured

## 🛠️ Development Tools

### Generate Strong Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Validate Environment

```bash
# Check all required vars are set
npm run env:check

# Production env check
npm run env:check:prod

# Or manually:
node -e "
  const required = ['MONGODB_URI', 'JWT_SECRET', ...];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length) {
    console.error('Missing:', missing);
    process.exit(1);
  }
"
```

### List All Variables

```bash
# Show all NEXT_PUBLIC_ variables
env | grep NEXT_PUBLIC_

# Show all variables
printenv | sort
```

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Alchemy Dashboard](https://dashboard.alchemy.com)
- [Infura Dashboard](https://infura.io/dashboard)
- [WalletConnect Cloud](https://cloud.walletconnect.com)
- [MongoDB Atlas](https://cloud.mongodb.com)

---

**Last Updated:** 2026-01-22  
**Maintainer:** Development Team
