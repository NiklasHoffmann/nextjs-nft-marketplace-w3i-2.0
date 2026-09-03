# Roles & Permissions

Zentrale Definition aller Akteure im W3I Marketplace, wie sie technisch bestimmt
werden und welche Rechte sie haben. Vorher war das über 15+ Dateien implizit verteilt.

Verwandte Dokumente: [authentication.md](../api/authentication.md) (Signatur-/Session-Flow),
[routes.md](../api/routes.md) (API-Oberfläche), [MULTISIG_WALLET_INTEGRATION.md](../admin/MULTISIG_WALLET_INTEGRATION.md).

---

## 1. Rollenübersicht

| Rolle | Ebene | Wie bestimmt | Quelle |
|---|---|---|---|
| **Visitor** | App | keine Authentifizierung | – |
| **User** (Wallet-Inhaber) | App | `user-session` Cookie nach Signatur-Challenge | `src/lib/auth/user-session.ts` |
| **Admin** | App | Adress-Whitelist **+** Signatur **+** `admin-session` Cookie | `src/config/admin.ts`, `src/lib/auth/admin-session.ts` |
| **Seller** | Chain | ist `listing.seller` des jeweiligen Listings | Marketplace-Contract |
| **Buyer** | Chain | offen, oder per Buyer-Whitelist des Listings | Marketplace-Contract |
| **MultiSig Owner** | Chain | on-chain `getOwners()` des MultiSig-Contracts | `src/hooks/admin/useAdminMode.ts` |
| **Diamond Owner** | Chain | `owner()` des Diamond-Contracts (EOA **oder** MultiSig) | `AdminMode` in `src/types/multisig/multisig-wallet.ts` |
| **Worker / Service** | Prozess | `APP_RUNTIME_ROLE=worker`, kein HTTP-Zugriff | `src/lib/init-services.ts` |

App-Ebene = von diesem Next.js-Backend durchgesetzt.
Chain-Ebene = vom Smart Contract durchgesetzt; das Frontend spiegelt sie nur.

---

## 2. Session-Scopes

Beide Sessions sind HMAC-SHA256-signierte Tokens (`JWT_SECRET`) in einem
`httpOnly`-Cookie. Der `scope`-Claim isoliert sie voneinander — ein User-Token
kann nicht als Admin-Token wiederverwendet werden und umgekehrt.

| | User-Session | Admin-Session |
|---|---|---|
| Cookie | `user-session` | `admin-session` |
| Scope-Claim | `user` | `admin` |
| Challenge | `GET /api/auth/challenge?scope=user` | `GET /api/auth/challenge` |
| Verify | `POST /api/auth/verify` mit `scope: 'user'` | `POST /api/auth/verify` |
| Adress-Prüfung | jede gültige Wallet | muss in `ADMIN_ADDRESSES` sein |
| TTL | 24 h | 24 h |
| Revocation-Registry | nein (keine erhöhten Rechte) | ja, JTI in `admin_config` |
| Grants | `withAuth` | `withAuth` **und** `withAdmin` |

Implementierung: `src/lib/auth/session-token.ts` (gemeinsame Signatur/Verifikation),
`src/lib/auth/admin-challenge-store.ts` (Nonce-Store, scope-gebundene Nachricht).

### Admin-Adressen

`ADMIN_ADDRESSES` in `src/config/admin.ts` wird zusammengesetzt aus:

1. `NEXT_PUBLIC_MULTISIG_OWNER_ADDRESSES` — primär, Spiegel der on-chain MultiSig-Owner
2. `NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES` — Break-Glass/Service-Wallets
3. `NEXT_PUBLIC_ADMIN_ADDRESSES` — Legacy-Fallback, nur wenn (1) leer ist
4. MongoDB `admin_config.additional_admin_addresses` — zur Laufzeit ergänzbar (`src/lib/auth/admin-access.ts`)

---

## 3. Permission-Matrix (App-Ebene)

| Endpoint / Bereich | Visitor | User | Admin | Durchsetzung |
|---|:---:|:---:|:---:|---|
| `GET /api/marketplace/**` | ✅ | ✅ | ✅ | – |
| `GET /api/nft/**` (öffentlich) | ✅ | ✅ | ✅ | – |
| `GET /api/collections/**` | ✅ | ✅ | ✅ | – |
| `GET /api/auth/challenge`, `/session` | ✅ | ✅ | ✅ | – |
| `GET /api/cart` | ❌ | eigene | eigene | `withAuth` + Adressvergleich |
| `POST` / `DELETE /api/cart` | ❌ | eigene | eigene | `withAuth` + Adressvergleich |
| `GET`/`POST`/`PUT /api/user/interactions` | ❌ | eigene | eigene | `withAuth` + Adressvergleich |
| `GET /api/user/nfts` | ❌ | eigene | eigene | `withAuth` + Adressvergleich |
| `POST /api/user/nfts/sync` | ❌ | eigene | eigene | `withAuth` (Adresse aus Session) |
| `/admin/*` (Seiten) | ❌ | ❌ | ✅ | `middleware.ts` (Edge) |
| `/api/admin/**` | ❌ | ❌ | ✅ | `withAdmin` |
| `/api/nft/admin/**` | ❌ | ❌ | ✅ | `withAdmin` |

„eigene" = Zugriff nur auf Daten der eigenen, per Session verifizierten Wallet-Adresse.
Jede dieser Routen vergleicht den Query-/Body-Parameter mit `request.userAddress` und
wirft sonst `ForbiddenError`.

---

## 4. Permission-Matrix (Chain-Ebene)

| Operation | Seller | Buyer | Diamond Owner | MultiSig Owner |
|---|:---:|:---:|:---:|:---:|
| Listing erstellen (whitelisted Collection) | ✅ | ✅ | ✅ | ✅ |
| Listing aktualisieren / stornieren | eigene | ❌ | ❌ | ❌ |
| Buyer-Whitelist eines Listings pflegen | eigene | ❌ | ❌ | ❌ |
| Kaufen | ✅ | ✅¹ | ✅ | ✅ |
| Collection-Whitelist ändern | ❌ | ❌ | ✅ | via Proposal |
| Innovation-Fee setzen | ❌ | ❌ | ✅ | via Proposal |
| Pause / Unpause | ❌ | ❌ | ✅ | via Proposal |
| Erlaubte Währungen ändern | ❌ | ❌ | ✅ | via Proposal |
| `diamondCut` (Upgrade) | ❌ | ❌ | ✅ | via Proposal |
| Ownership übertragen | ❌ | ❌ | ✅ | via Proposal |

¹ Nur wenn `buyerWhitelistEnabled === false` oder die Adresse in `allowedBuyers` steht.

„via Proposal" = wenn der Diamond dem MultiSig gehört (`AdminMode.MULTISIG`), laufen
alle Owner-Operationen über eine MultiSig-Transaktion mit Confirmation-Threshold.
Der Admin-Login der App ist dafür **nicht** ausreichend — die Wallet muss zusätzlich
on-chain Owner sein.

### AdminMode

| Modus | Bedeutung | Direktes Admin-Interface nutzbar |
|---|---|---|
| `SINGLE_OWNER` | EOA besitzt den Diamond | ja, wenn verbundene Wallet = Owner |
| `MULTISIG` | MultiSig besitzt den Diamond | nein, nur über Proposals |
| `TRANSITIONING` | Ownership-Transfer läuft | nein |

---

## 5. Grenzen des Modells

- **App-Admin ≠ Chain-Owner.** Ein App-Admin sieht das Dashboard, kann aber keine
  Contract-Operation ausführen, ohne on-chain berechtigt zu sein.
- **User-Sessions sind nicht widerrufbar.** Sie tragen keine erhöhten Rechte und
  laufen nach 24 h aus. Für Sperren wäre ein Registry-Eintrag analog zu
  `admin-session-registry.ts` nötig.
- **Der Worker hat keine HTTP-Identität.** Er greift direkt auf MongoDB und
  TheGraph zu und geht nicht durch die API-Middleware.
- **Seller/Buyer sind keine App-Rollen.** Sie existieren nur als Felder eines
  Listings; die App leitet daraus lediglich die UI ab.
