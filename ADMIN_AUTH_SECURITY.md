# Sichere Admin-Authentifizierung mit Wallet-Signatur

## Übersicht

Das Admin-System verwendet jetzt eine **sichere Signatur-basierte Authentifizierung**, die verhindert, dass Adressen vorgetäuscht werden können.

## Wie es funktioniert

### 1. **Challenge-Response-Authentifizierung**

```
User → GET /api/auth/challenge → Server
       ← Challenge Message (Nonce + Timestamp)
       
User signs message with wallet → POST /api/auth/verify → Server verifies signature
                                ← Session Cookie (24h gültig)
```

### 2. **Sicherheitsmerkmale**

✅ **Signatur-Verifikation**: Nur der echte Wallet-Besitzer kann die Message signieren  
✅ **Zeitbasierte Challenges**: Jede Challenge ist nur 5 Minuten gültig  
✅ **Einmalige Nonce**: Verhindert Replay-Attacken  
✅ **HttpOnly-Cookies**: Session-Token ist vor JavaScript-Zugriff geschützt  
✅ **HMAC-signierte JWTs**: Token können nicht gefälscht werden  

### 3. **Ablauf aus User-Sicht**

1. User verbindet Wallet
2. AdminGuard erkennt Admin-Wallet
3. Button "Sign Message to Authenticate" erscheint
4. User klickt → Wallet öffnet sich → Message wird signiert
5. Server verifiziert Signatur
6. Session-Cookie wird gesetzt (24h gültig)
7. User ist authentifiziert

## API-Endpunkte

### GET `/api/auth/challenge`
Generiert eine Challenge-Message zum Signieren.

**Response:**
```json
{
  "message": "Sign this message to authenticate as admin.\n\nNonce: abc123...\nTimestamp: 1234567890",
  "nonce": "abc123...",
  "timestamp": 1234567890
}
```

### POST `/api/auth/verify`
Verifiziert die Signatur und erstellt eine Session.

**Request:**
```json
{
  "address": "0x...",
  "signature": "0x...",
  "message": "Sign this message...",
  "nonce": "abc123...",
  "timestamp": 1234567890
}
```

**Response (Success):**
```json
{
  "success": true,
  "address": "0x...",
  "isAdmin": true
}
```

### GET `/api/auth/session`
Prüft ob eine gültige Session existiert.

**Response:**
```json
{
  "isAuthenticated": true,
  "address": "0x...",
  "isAdmin": true
}
```

### POST `/api/auth/logout`
Beendet die Session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Konfiguration

### Umgebungsvariablen

```env
# .env.local
JWT_SECRET=your-very-secure-random-secret-key-here
NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES=0xYourAddress1,0xYourAddress2
NEXT_PUBLIC_APP_LOCK_ENABLED=false
```

⚠️ **Wichtig**: Generieren Sie einen starken `JWT_SECRET` für Production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Verwendung

### AdminGuard-Komponente

```tsx
import { AdminGuard } from '@/components/08-auth/AdminGuard';

// Schützt komplette Seite
export default function AdminPage() {
  return (
    <AdminGuard requireAdmin={true}>
      <div>Admin Content</div>
    </AdminGuard>
  );
}
```

### Properties

- `requireAdmin` (boolean): Erzwingt Admin-Authentifizierung
- `fallbackRoute` (string): Redirect-Ziel bei fehlender Berechtigung
- `children`: Geschützter Content

## Sicherheits-Features im Detail

### 1. Signature Verification (viem)
```typescript
const isValid = await verifyMessage({
  address: address as `0x${string}`,
  message,
  signature: signature as `0x${string}`
});
```
Nutzt die kryptografische Signatur-Verifikation von Ethereum.

### 2. Time-Based Challenges
```typescript
const age = Date.now() - timestamp;
if (age > 5 * 60 * 1000) {
  return { error: 'Challenge expired' };
}
```
Challenges sind nur 5 Minuten gültig.

### 3. HMAC-Signed JWT
```typescript
const signature = crypto
  .createHmac('sha256', JWT_SECRET)
  .update(`${header}.${body}`)
  .digest('base64url');
```
Token können nicht ohne Secret gefälscht werden.

### 4. HttpOnly Cookies
```typescript
cookieStore.set('admin-session', token, {
  httpOnly: true,  // Kein JavaScript-Zugriff
  secure: true,    // Nur HTTPS (Production)
  sameSite: 'strict'
});
```

## Warum ist das sicher?

### ❌ Alte Methode (unsicher):
```typescript
// Nur Adress-Check - kann gefälscht werden!
if (address === ADMIN_ADDRESS) {
  // User könnte falsche Adresse senden
}
```

### ✅ Neue Methode (sicher):
```typescript
// 1. Server sendet Challenge
const challenge = generateChallenge();

// 2. User signiert mit privatem Schlüssel
const signature = await wallet.signMessage(challenge);

// 3. Server verifiziert kryptografisch
const isValid = verifySignature(address, message, signature);
// Nur der echte Wallet-Besitzer kann gültige Signatur erstellen!
```

## Session-Management

- **Dauer**: 24 Stunden
- **Speicherung**: HttpOnly-Cookie (serverseitig)
- **Erneuerung**: Automatisch beim nächsten Check
- **Logout**: Manuell über `/api/auth/logout`

## Testing

### Lokales Testing

1. Fügen Sie Ihre Wallet-Adresse in `.env.local` hinzu:
```env
NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES=0xYourTestAddress
```

2. Starten Sie den Dev-Server:
```bash
npm run dev
```

3. Besuchen Sie eine geschützte Seite
4. Signieren Sie die Message in Ihrer Wallet
5. Sie sind nun authentifiziert!

### Production Deployment

1. Setzen Sie einen starken `JWT_SECRET`
2. Aktivieren Sie HTTPS (für `secure` Cookies)
3. Konfigurieren Sie Admin-Adressen
4. Optional: Aktivieren Sie App-weite Sperre mit `NEXT_PUBLIC_APP_LOCK_ENABLED=true`

## Fehlerbehandlung

Der AdminGuard zeigt automatisch:
- ❌ "Access Restricted" für nicht-autorisierte Wallets
- 🔐 "Authentication Required" für Admin-Wallets ohne Session
- 🔄 Loading-States während der Verifikation
- ⚠️ Fehlermeldungen bei Signatur-Problemen

## Migration vom alten System

Das alte System ohne Signatur-Verifikation ist weiterhin kompatibel für Nicht-Admin-Bereiche. Die Signatur wird nur für Admin-authentifizierte Bereiche benötigt.

**Keine Breaking Changes** - Bestehender Code funktioniert weiter!

## Troubleshooting

### "Challenge expired"
- User hat zu lange gewartet (>5 Min)
- Lösung: Neu laden und schneller signieren

### "Invalid signature"
- Falsche Message signiert
- Wallet-Fehler
- Lösung: Nochmal versuchen

### "Not an admin address"
- Adresse nicht in `NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES`
- Lösung: Adresse in .env.local hinzufügen

## Weitere Verbesserungen (Optional)

- [ ] Rate Limiting für `/api/auth/verify`
- [ ] Session-Refresh-Mechanismus
- [ ] Multi-Signature Support
- [ ] IP-basierte Zusatzprüfungen
- [ ] Audit-Logging aller Auth-Events

---

**Status**: ✅ Production-Ready  
**Sicherheitslevel**: 🔒 Hoch  
**Letzte Aktualisierung**: 2025-10-13
