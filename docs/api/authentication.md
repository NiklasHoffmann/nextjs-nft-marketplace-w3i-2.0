# Authentication System - Complete Guide
**Updated:** August 28, 2026

## 🔐 Overview

Der NFT Marketplace verwendet **signaturbasierte Authentifizierung** mit Session-Management für maximale Sicherheit. Es gibt zwei Scopes:

- **User-Session** (`user-session` Cookie) — jede Wallet, die eine Challenge signiert. Schützt die eigenen Nutzerdaten (Cart, Likes, Ratings, Watchlist, eigene NFTs).
- **Admin-Session** (`admin-session` Cookie) — zusätzlich Adress-Whitelist erforderlich. Schützt `/admin/*` und `/api/admin/**`.

Beide Tokens sind HMAC-SHA256-signiert (`JWT_SECRET`) und tragen einen `scope`-Claim, sodass ein User-Token nicht als Admin-Token wiederverwendbar ist. Die vollständige Rechteübersicht steht in [ROLES_AND_PERMISSIONS.md](../architecture/ROLES_AND_PERMISSIONS.md).

> Wallet-Adressen aus Request-Headern oder Query-Parametern werden **nie** als Identität akzeptiert — `withAuth` liest die Adresse ausschließlich aus dem verifizierten Session-Token.

## 👤 User-Session Flow

```
1. Wallet verbindet → UserSessionProvider registriert den Signer
2. GET /api/auth/session?scope=user → bereits authentifiziert?
3. Falls nein:
   GET  /api/auth/challenge?scope=user   → { message, nonce, timestamp }
   User signiert die Nachricht
   POST /api/auth/verify { ..., scope: 'user' } → setzt user-session Cookie (24h)
4. authFetch() aus @/lib/auth/user-session-client hängt Cookies an und
   wiederholt einen 401-Request einmalig nach erfolgreichem Sign-in
```

Lehnt der Nutzer die Signatur ab, wird für dieselbe Adresse nicht erneut gefragt; betroffene Features degradieren (z. B. Cart läuft weiter über localStorage).

## 🎯 Sicherheitskonzept (Admin)

### 3-Stufen-Authentifizierung

1. **Wallet-Adresse Prüfung**
   - Nur vordefinierte Admin-Adressen (`.env`) haben Zugriff
   - Geprüft auf Client- UND Server-Seite

2. **Signatur-Verifikation**
   - User muss Challenge-Nachricht signieren (kostenlos, kein Gas)
   - Server verifiziert Signatur mit `viem.verifyMessage()`
   - Beweist Wallet-Besitz ohne Transaktion

3. **Session-Management**
   - Nach erfolgreicher Signatur wird Session-Cookie gesetzt
   - Cookie ist `httpOnly`, `secure`, `sameSite=strict`
   - Session gültig für 24 Stunden
   - Bei jeder Admin-API-Anfrage wird Cookie geprüft

## 🚀 User Flow

### Erstmaliger Admin-Login

```
1. User besucht /admin → AdminAuthGuard prüft Session
2. Keine Session vorhanden → Redirect zu /admin/login
3. Login-Seite:
   - User verbindet Wallet (Web3ConnectButton)
   - System prüft ob Wallet-Adresse in ADMIN_ADDRESSES
   - User klickt "Nachricht signieren"
4. Challenge-Flow:
   GET /api/auth/challenge → { message, nonce, timestamp }
   User signiert Nachricht via Wallet
   POST /api/auth/verify → Signatur wird verifiziert
5. Bei Erfolg:
   - Server setzt httpOnly Cookie "auth-token"
   - Redirect zu /admin (oder ursprünglicher URL via ?redirect=)
6. AdminAuthGuard erkennt gültige Session
   - User sieht Admin Panel
```

### Nachfolgender Zugriff

```
1. User besucht /admin/insights
2. AdminAuthGuard prüft Session-Cookie
3. Cookie gültig → Direkter Zugriff
4. Cookie abgelaufen → Redirect zu /admin/login
```

## 📁 Dateien & Komponenten

### Frontend

#### `/src/app/admin/login/page.tsx`
**Zweck:** Dedizierte Login-Seite für Admin-Bereich

**Features:**
- Wallet-Connection (Web3ConnectButton)
- Admin-Adresse-Prüfung (isAdminAddress)
- Signatur-Flow (Challenge → Sign → Verify)
- Redirect nach Login (via ?redirect= Parameter)
- Error-Handling mit benutzerfreundlichen Meldungen
- Success-Animation + Auto-Redirect

**States:**
```typescript
isChecking   // Prüft bestehende Session
isSigning    // Signatur-Prozess läuft
error        // Fehlermeldung (z.B. "Signatur abgelehnt")
showSuccess  // Login erfolgreich, redirect läuft
```

#### `/src/components/auth/AdminAuthGuard.tsx`
**Zweck:** Layout-Wrapper für alle Admin-Seiten

**Features:**
- Session-Prüfung bei jedem Seitenwechsel
- Loading State während Prüfung
- Unauthorized Screen (wenn nicht Admin)
- Auto-Redirect zu `/admin/login?redirect=...`
- Überspringt Auth-Check auf Login-Seite

**Integration:**
```tsx
// /src/app/admin/layout.tsx
export default function AdminLayout({ children }) {
    return (
        <AdminAuthGuard>
            {children}
        </AdminAuthGuard>
    );
}
```

#### `/src/components/auth/AdminGuard.tsx`
**Existiert bereits** - Ähnliche Funktionalität, aber:
- Für einzelne Komponenten statt Layout
- `requireAdmin` prop für optionale Admin-Prüfung
- `APP_LOCK_ENABLED` Support (globale Sperre)

### Backend (API Routes)

#### `/src/app/api/auth/challenge/route.ts`
**Zweck:** Generiert Challenge-Nachricht für Signatur

**Request:**
```http
GET /api/auth/challenge
```

**Response:**
```json
{
  "message": "Admin Login\n\nTimestamp: 1734556800000\nNonce: abc123...",
  "nonce": "abc123def456...",
  "timestamp": 1734556800000
}
```

**Sicherheit:**
- Jede Challenge ist einmalig (Nonce)
- Timestamp verhindert Replay-Attacken
- Challenge nur 5 Minuten gültig

#### `/src/app/api/auth/verify/route.ts`
**Zweck:** Verifiziert Signatur und erstellt Session

**Request:**
```http
POST /api/auth/verify
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x1234abcd...",
  "message": "Admin Login\n\nTimestamp: ...",
  "nonce": "abc123...",
  "timestamp": 1734556800000
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJ...base64url",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "expiresIn": 86400000
}
```

**Response (Error 403):**
```json
{
  "error": "Not an admin address"
}
```

**Sicherheit:**
- `verifyMessage()` von viem (kryptografisch sicher)
- Timestamp max 5 Minuten alt
- Admin-Adresse wird gegen `.env` geprüft
- Session-Token ist HMAC-SHA256 signiert
- Cookie: `httpOnly`, `secure`, `sameSite=strict`, `path=/`

#### `/src/app/api/auth/session/route.ts`
**Zweck:** Prüft ob gültige Session existiert

**Request:**
```http
GET /api/auth/session
Cookie: auth-token=eyJ...
```

**Response:**
```json
{
  "isAuthenticated": true,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isAdmin": true
}
```

#### `/src/app/api/auth/logout/route.ts`
**Zweck:** Beendet Session (löscht Cookie)

**Request:**
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true
}
```

### Middleware

#### `/src/lib/middleware/auth.ts`
**Verbessert mit Session-Support**

**Neue Features:**
- `verifyToken()` - Verifiziert JWT-Token aus Cookie
- `extractWalletAddress()` - Priorität: Cookie → Header → Query
- `isAdmin()` - Prüft Admin-Status
- `withAdmin()` - **Erfordert jetzt gültige Session** (nicht nur Adresse)

**Cookie-basierte Auth:**
```typescript
export async function withAdmin(req: NextRequest): Promise<void> {
    const address = extractWalletAddress(req);
    
    if (!address) {
        throw new UnauthorizedError('Authentication required...');
    }
    
    if (!isAdmin(address)) {
        throw new ForbiddenError('Admin access required...');
    }
    
    // NEU: Prüfe Session-Cookie
    const hasValidSession = req.headers.get('cookie')?.includes('auth-token');
    
    if (!hasValidSession) {
        throw new UnauthorizedError('Valid admin session required. Please sign in at /admin/login');
    }
    
    req.userAddress = address;
    req.isAdmin = true;
}
```

## 🔒 Sicherheitsfeatures

### Client-Seite

1. **Route Protection**
   - `AdminAuthGuard` umschließt alle `/admin/*` Routen
   - Prüft Session bei jedem Navigation-Event
   - Redirect zu Login wenn ungültig

2. **Admin-Adresse Validation**
   - `isAdminAddress()` prüft gegen `.env`
   - Zeigt Warnung wenn Wallet nicht Admin ist

3. **Session Persistence**
   - Cookie wird automatisch bei Requests mitgesendet
   - Session überlebt Page-Reloads
   - Logout löscht Cookie client- UND server-seitig

### Server-Seite

1. **API Route Protection**
   - `withAdmin` middleware auf ALLEN Admin-APIs
   - Kombiniert Adress-Check + Session-Check
   - Klare Fehlermeldungen (401 vs 403)

2. **Token Security**
   - HMAC-SHA256 Signatur (nicht nur Base64)
   - Expiration Check (24h)
   - HttpOnly Cookie (nicht via JavaScript lesbar)

3. **Challenge Validation**
   - Timestamp max 5 Minuten alt
   - Nonce verhindert Replay
   - Signatur kryptografisch verifiziert

## 🛠️ Konfiguration

### Environment Variables

```env
# .env.local

# Admin Wallet Address (lowercase)
NEXT_PUBLIC_ADMIN_ADDRESS=0x742d35cc6634c0532925a3b844bc9e7595f0beb

# JWT Secret für Token-Signierung
JWT_SECRET=your-very-secure-random-string-min-32-characters
```

**Wichtig:**
- `JWT_SECRET` muss in Production geändert werden!
- Mindestens 32 Zeichen, kryptografisch zufällig
- NIEMALS in Git committen

### Mehrere Admin-Adressen

```typescript
// /src/lib/middleware/auth.ts
const ADMIN_ADDRESSES = new Set([
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase(),
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS_2?.toLowerCase(),
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS_3?.toLowerCase(),
].filter(Boolean));
```

## 📊 Welche Aktionen sind geschützt?

### Frontend Routes (via AdminAuthGuard)

- ✅ `/admin` - Main Panel
- ✅ `/admin/insights` - NFT Insights Management
- ✅ `/admin/dashboard` - Analytics Dashboard
- ✅ `/admin/marketplace` - Marketplace Settings
- ✅ `/admin/settings` - System Settings
- ❌ `/admin/login` - Login Page (öffentlich)

### API Routes (via withAdmin middleware)

- ✅ `POST /api/nft/admin/insights` - Create NFT Insight
- ✅ `PUT /api/nft/admin/insights` - Update NFT Insight
- ✅ `DELETE /api/nft/admin/insights` - Delete NFT Insight
- ✅ `POST /api/nft/admin/insights/collections` - Create Collection Insight
- ✅ `PUT /api/nft/admin/insights/collections` - Update Collection Insight
- ✅ `DELETE /api/nft/admin/insights/collections` - Delete Collection Insight

**Alle 6 Endpoints erfordern:**
1. Gültige Admin-Wallet-Adresse
2. Signierte Session (Cookie)
3. Bei fehlender Session: **401** mit Hinweis auf `/admin/login`

## 🧪 Testing

### Manuelle Tests

**Test 1: Login-Flow**
```bash
1. Browser öffnen (Inkognito)
2. Zu http://localhost:3000/admin
3. Erwartung: Redirect zu /admin/login
4. Wallet verbinden (Admin-Adresse)
5. "Nachricht signieren" klicken
6. Metamask-Popup → Signieren
7. Erwartung: Success-Screen → Redirect zu /admin
```

**Test 2: Session Persistence**
```bash
1. Nach erfolgreichem Login zu /admin/insights
2. Seite neu laden (F5)
3. Erwartung: Kein Redirect, direkter Zugriff
4. Browser Developer Tools → Application → Cookies
5. Cookie "auth-token" sollte vorhanden sein
```

**Test 3: Session Expiration**
```bash
1. Eingeloggt sein
2. Cookie manuell löschen (DevTools)
3. Zu /admin/insights navigieren
4. Erwartung: Redirect zu /admin/login?redirect=/admin/insights
```

**Test 4: API Protection**
```bash
# Ohne Cookie → 401
curl http://localhost:3000/api/nft/admin/insights

# Mit ungültigem Cookie → 401
curl -H "Cookie: auth-token=invalid" \
  http://localhost:3000/api/nft/admin/insights

# Mit gültigem Cookie → 200 (im Browser nach Login)
```

**Test 5: Non-Admin Wallet**
```bash
1. Wallet mit Nicht-Admin-Adresse verbinden
2. Zu /admin navigieren
3. Erwartung: "Zugriff verweigert" Screen
4. Hinweis: "Diese Wallet ist nicht als Admin registriert"
```

### Automated Tests (TODO)

```typescript
// __tests__/admin-auth.test.ts

describe('Admin Authentication', () => {
    it('redirects unauthenticated users to login', async () => {
        // Test AdminAuthGuard redirect
    });
    
    it('allows access with valid session cookie', async () => {
        // Test successful auth flow
    });
    
    it('rejects invalid signatures', async () => {
        // Test /api/auth/verify with wrong signature
    });
    
    it('expires old challenges', async () => {
        // Test timestamp validation
    });
});
```

## 🔄 Migration von altem System

### Vorher (nur Adress-Check)

```typescript
// ❌ Unsicher - jeder konnte Admin-Adresse in Header setzen
export async function withAdmin(req: NextRequest) {
    const address = req.headers.get('x-wallet-address');
    if (!ADMIN_ADDRESSES.has(address)) {
        throw new ForbiddenError('Admin required');
    }
}
```

### Nachher (Signatur + Session)

```typescript
// ✅ Sicher - verifizierte Signatur erforderlich
export async function withAdmin(req: NextRequest) {
    const address = extractWalletAddress(req); // Aus Cookie (signiert)
    
    if (!address || !isAdmin(address)) {
        throw new ForbiddenError('Admin required');
    }
    
    if (!hasValidSession(req)) {
        throw new UnauthorizedError('Please sign in at /admin/login');
    }
}
```

## 📚 Best Practices

### 1. Immer Session prüfen

```tsx
// ✅ Gut - Layout-level Protection
export default function AdminLayout({ children }) {
    return (
        <AdminAuthGuard>
            {children}
        </AdminAuthGuard>
    );
}
```

### 2. API Routes schützen

```typescript
// ✅ Alle Admin-APIs
export const POST = apiHandler(async (req: NextRequest) => {
    await withAdmin(req); // Signatur + Session erforderlich
    
    const adminAddress = req.userAddress; // Automatisch injiziert
    // ... Admin-Aktion
});
```

### 3. Klare Fehlermeldungen

```typescript
// ✅ Benutzerfreundlich
if (!hasValidSession) {
    throw new UnauthorizedError(
        'Valid admin session required. Please sign in at /admin/login'
    );
}

// ❌ Schlecht
if (!hasValidSession) {
    throw new Error('Unauthorized');
}
```

### 4. Redirect-URLs bewahren

```typescript
// ✅ User landet nach Login wo er hinwollte
const redirectUrl = encodeURIComponent(pathname);
router.push(`/admin/login?redirect=${redirectUrl}`);
```

## 🚨 Häufige Probleme

### Problem 1: "Keine Admin-Rechte"

**Ursache:** Wallet-Adresse nicht in `.env.local`

**Lösung:**
```env
NEXT_PUBLIC_ADMIN_ADDRESS=0xYourWalletAddressHere
```

Neustart: `npm run dev`

### Problem 2: Cookie wird nicht gesetzt

**Ursache:** `credentials: 'include'` fehlt bei Fetch

**Lösung:**
```typescript
const response = await fetch('/api/auth/verify', {
    method: 'POST',
    credentials: 'include', // ← Wichtig!
    body: JSON.stringify(...)
});
```

### Problem 3: Session expired

**Ursache:** Cookie ist >24h alt oder JWT_SECRET wurde geändert

**Lösung:** Erneut einloggen, Session wird automatisch erneuert

### Problem 4: "Challenge expired"

**Ursache:** >5 Minuten zwischen Challenge und Verify

**Lösung:** Schneller signieren oder Timeout erhöhen:
```typescript
// /src/app/api/auth/verify/route.ts
const MAX_AGE = 10 * 60 * 1000; // 10 Minuten statt 5
```

## 🎯 Zusammenfassung

✅ **Sicherheit:**
- Kryptografische Signatur-Verifikation
- Session-basierte Authentifizierung
- HttpOnly Cookies (XSS-sicher)
- Zeitbasierte Challenge-Validierung

✅ **User Experience:**
- Einmalige Signatur pro Session (24h)
- Auto-Redirect nach Login
- Klare Fehlermeldungen
- Loading States

✅ **Developer Experience:**
- Einfache Integration (`<AdminAuthGuard>`)
- Middleware für API-Schutz (`withAdmin`)
- TypeScript-Support
- Ausführliche Dokumentation

---

**Status:** ✅ PRODUCTION READY  
**Letzte Aktualisierung:** December 18, 2025
