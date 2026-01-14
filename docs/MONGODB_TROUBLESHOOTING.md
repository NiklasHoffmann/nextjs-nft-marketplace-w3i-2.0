# MongoDB Verbindungsprobleme beheben

## Problem: API error 500 / ReplicaSetNoPrimary

### Häufigste Ursache: IP-Whitelist Problem

Wenn du diesen Fehler siehst:
```
type: 'ReplicaSetNoPrimary'
SSL alert number 80
```

**Das bedeutet: Deine IP-Adresse ist nicht in MongoDB Atlas freigegeben!**

## ✅ Schnelle Lösung

### 1. Diagnose ausführen
```bash
npm run diagnose:mongodb
```

Dieses Tool zeigt dir:
- ✅ Deine aktuelle IP-Adresse
- ✅ Ob die Verbindung funktioniert
- ❌ Genaue Fehlermeldung mit Lösungsvorschlägen

### 2. IP in MongoDB Atlas hinzufügen

1. Öffne [MongoDB Atlas](https://cloud.mongodb.com)
2. Wähle dein Projekt
3. Klicke auf **"Network Access"** im linken Menü
4. Klicke auf **"Add IP Address"**
5. Wähle eine Option:
   - **Add Current IP Address** (empfohlen für Production)
   - **Allow Access from Anywhere** (`0.0.0.0/0`) - nur für Development!

### 3. Warte 1-2 Minuten
MongoDB Atlas braucht kurz, um die Änderung zu aktivieren.

### 4. Teste erneut
```bash
npm run diagnose:mongodb
```

## Weitere mögliche Fehler

### Authentication Failed
- ✅ Überprüfe `MONGODB_URI` in `.env.local`
- ✅ Stelle sicher, dass Sonderzeichen im Passwort URL-encoded sind
- ✅ Überprüfe Database User in MongoDB Atlas

### Connection Timeout
- ✅ IP-Adresse in Whitelist? (häufigster Fall)
- ✅ MongoDB Atlas Cluster pausiert?
- ✅ Firewall blockiert Port 27017?

## Fehler in der Konsole

Die Fehlermeldungen in den Server-Logs sind jetzt deutlicher:

```
🚫 MONGODB VERBINDUNGSFEHLER - IP WHITELIST PRÜFEN!

1. https://cloud.mongodb.com → Network Access
2. Add IP Address → Aktuelle IP hinzufügen
```

## Wichtige Hinweise

### Dynamische IP-Adressen
Wenn du von zu Hause arbeitest und dein Internet-Provider dir dynamische IPs gibt:
- Du musst die IP regelmäßig aktualisieren
- ODER verwende `0.0.0.0/0` für Development (unsicher für Production!)

### VPN / Home Office
Wenn du zwischen verschiedenen Standorten wechselst:
- Füge alle IPs hinzu (Büro, Home Office, etc.)
- ODER verwende `0.0.0.0/0` für Development

### Production
Für Production-Umgebungen:
- ✅ Verwende spezifische IP-Adressen
- ❌ NICHT `0.0.0.0/0` verwenden (Sicherheitsrisiko!)

## Code-Verbesserungen

Die folgenden Dateien wurden verbessert:

### `src/lib/mongodb.ts`
- ✅ Bessere Connection-Timeouts
- ✅ `MongoConnectionError` mit hilfreichen Fehlermeldungen
- ✅ Automatische Erkennung von IP-Whitelist-Problemen

### `src/app/api/collections/route.ts`
- ✅ Spezifische Fehlerbehandlung für MongoDB-Fehler
- ✅ Klare deutsche Fehlermeldungen in den Logs

### `scripts/diagnose-mongodb.mjs`
- ✅ Neues Diagnose-Tool
- ✅ Zeigt aktuelle IP
- ✅ Testet Verbindung
- ✅ Gibt konkrete Lösungsvorschläge

## NPM Scripts

```bash
# MongoDB-Verbindung testen
npm run diagnose:mongodb

# Development Server starten
npm run dev

# Marketplace-Daten synchronisieren
npm run sync:marketplace
```

## Support

Bei weiteren Problemen:
1. Führe `npm run diagnose:mongodb` aus
2. Schicke die Ausgabe mit
3. Überprüfe die Server-Logs (Konsole wo `npm run dev` läuft)
