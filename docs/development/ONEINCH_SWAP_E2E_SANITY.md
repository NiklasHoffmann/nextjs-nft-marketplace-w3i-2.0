# 1inch Swap E2E Sanity Plan

Kurzplan zur manuellen Verifikation der drei Kernpfade in beiden UI-Flows:
- Buy Now Modal (`/nft/[contractAddress]/[tokenId]`)
- Cart Checkout (`/cart`)

## Ziel

Sicherstellen, dass folgende Swap-Richtungen funktionieren:
1. ETH -> Token (z. B. ETH -> USDC)
2. Token -> ETH (z. B. USDC -> ETH)
3. Token -> Token (z. B. DAI -> USDT)

## Voraussetzungen

- Wallet verbunden
- Testwallet mit kleinen Beträgen in ETH + mindestens 2 ERC20 Tokens
- `ONEINCH_API_KEY` auf Server gesetzt
- App läuft lokal oder in Staging

## Generelle Prüfkriterien (für alle Cases)

- 1inch Quote lädt für gewählte Source/Destination
- Bei ERC20-Source erscheint ggf. Approval-Step und ist ausführbar
- Swap-Transaktion kann signiert und bestätigt werden
- Nach Bestätigung werden Balances/Defizite neu geladen
- Purchase-Flow bleibt danach ausführbar (Approve + Buy)
- Keine uncaught Errors in Browser-Konsole

---

## Case A: ETH -> Token (ETH -> USDC)

### Buy Now Modal
1. NFT mit Token-Preis (z. B. USDC) öffnen.
2. Im 1inch-Block `Source Token = ETH` setzen.
3. Source Amount + Slippage setzen, Swap ausführen.
4. Erwartung: Kein ERC20-Source-Approval nötig, Swap erfolgreich, Defizit sinkt/ist 0.
5. Danach (falls nötig) Marketplace-Token-Approval durchführen und Kauf abschließen.

### Cart
1. Cart mit mindestens einem USDC-gepreisten Item öffnen.
2. Für USDC-Zeile `Source Token = ETH` wählen.
3. Swap durchführen.
4. Erwartung: Swap success, Status auf "Done", Batch-Purchase-Button freigebbar.

---

## Case B: Token -> ETH (USDC -> ETH)

### Buy Now Modal
1. NFT mit ETH-Preis öffnen.
2. `Source Token = USDC` wählen.
3. Falls verlangt: 1inch Source Approval ausführen.
4. Swap ausführen.
5. Erwartung: ETH-Balance steigt, ETH-Defizit sinkt/ist 0, Kauf möglich.

### Cart
1. Cart mit mindestens einem ETH-gepreisten Item öffnen.
2. Für ETH-Zeile `Source Token = USDC` wählen.
3. 1inch Approval (falls nötig) + Swap ausführen.
4. Erwartung: ETH-Zeile wird "Ready" und Checkout blockiert nicht mehr wegen Swap.

---

## Case C: Token -> Token (DAI -> USDT)

### Buy Now Modal
1. NFT mit USDT-Preis öffnen.
2. `Source Token = DAI` wählen.
3. 1inch Approval (falls nötig) + Swap ausführen.
4. Erwartung: USDT-Defizit sinkt/ist 0, danach normaler Purchase-Flow.

### Cart
1. Cart mit mindestens einem USDT-gepreisten Item öffnen.
2. Für USDT-Zeile `Source Token = DAI` wählen.
3. Approval (falls nötig) + Swap ausführen.
4. Erwartung: Zeile wird "Ready", Batch-Flow kann starten.

---

## Negativ-/Edge-Checks

- Source == Destination: Swap-Button ist blockiert oder zeigt klare Fehlermeldung.
- Ungültiger Betrag (`0` oder leer): Validierungsfehler sichtbar.
- Slippage > 50 oder <= 0: Validierungsfehler sichtbar.
- User lehnt Approval oder Swap in Wallet ab: UI bleibt stabil, verständliche Fehlermeldung.

## Definition of Done

- Alle 3 Richtungen in beiden Flows einmal erfolgreich durchgespielt
- Keine Blocker in Approval/Swap/Purchase-Reihenfolge
- Keine kritischen Frontend-Errors in Console
