# MongoDB Verbindung - Quick Reference

## ⚡ Schnell-Diagnose

```bash
npm run diagnose:mongodb
```

## ❌ Fehler: "API error: 500 Internal Server Error"

### Ursache
```
type: 'ReplicaSetNoPrimary'
SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

**= IP-Adresse nicht in MongoDB Atlas Whitelist!**

### Lösung (2 Minuten)

1. **Diagnose ausführen** (zeigt deine IP):
   ```bash
   npm run diagnose:mongodb
   ```

2. **IP freigeben**:
   - https://cloud.mongodb.com
   - Network Access → Add IP Address
   - Aktuelle IP hinzufügen ODER `0.0.0.0/0` (nur Development!)

3. **1-2 Minuten warten**, dann:
   ```bash
   npm run diagnose:mongodb  # Teste erneut
   npm run dev               # Starte Server
   ```

## 📖 Ausführliche Dokumentation

Siehe [docs/MONGODB_TROUBLESHOOTING.md](./MONGODB_TROUBLESHOOTING.md)

## ✅ Verbesserte Fehlermeldungen

In den Server-Logs (Konsole) siehst du jetzt:

```
🚫 MONGODB VERBINDUNGSFEHLER - IP WHITELIST PRÜFEN!

1. https://cloud.mongodb.com → Network Access
2. Add IP Address → Aktuelle IP hinzufügen
```

Statt nur:
```
Error: API error: 500 Internal Server Error
```
