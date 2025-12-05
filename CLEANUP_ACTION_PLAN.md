# NFT Marketplace - Aktueller Aufräumplan (Stand: November 2024)

## 🔍 Aktuelle Analyse-Ergebnisse

### Projekt-Status:
- **Framework**: Next.js 15.5.2 mit TypeScript
- **Datenbank**: MongoDB (primär) + TheGraph (Sync-Service)
- **Besonderheit**: Keine V1/V2 Duplikate gefunden (alter CLEANUP_PLAN ist veraltet)

## 📦 Phase 1: Ungenutzte Dependencies entfernen

### Definitiv ungenutzt (sofort entfernen):
```bash
npm uninstall ws pino-pretty
```
- `ws`: Nicht verwendet (graphql-ws hat eigene WebSocket-Implementation)
- `pino-pretty`: Keine Verwendung im Code gefunden

### Möglicherweise ungenutzt (Prüfung empfohlen):
```bash
# Testing-Setup (nur 1 Test-Datei gefunden!)
npm uninstall --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

# Oder behalte sie für zukünftige Tests
```

## 📁 Phase 2: Dokumentation aufräumen

### Root-Verzeichnis (13+ .md Dateien):
```bash
# Erstelle bessere Struktur
mkdir -p docs/refactoring
mkdir -p docs/implementation
mkdir -p docs/archive

# Verschiebe Refactoring-Docs
mv MARKETPLACE_REFACTOR_*.md docs/refactoring/
mv REFACTORING_*.md docs/refactoring/
mv MARKETPLACE_MIGRATION_GUIDE.md docs/refactoring/

# Verschiebe Status-Docs
mv IMPLEMENTATION_STATUS.md docs/implementation/
mv DEBUG_STATS.md docs/implementation/
mv stats_changes.txt docs/implementation/

# Veraltete Docs
mv CLEANUP_PLAN.md docs/archive/  # Der alte Plan
```

## 🧹 Phase 3: Scripts aufräumen

### Temporäre Scripts:
```bash
# Archiviere temp-refactor Scripts
mkdir -p scripts/archive/temp-refactors
mv scripts/temp-refactor-*.js scripts/archive/temp-refactors/

# Check-Scripts behalten (nützlich für Debugging)
# migrate-Scripts behalten (evtl. noch nicht alle ausgeführt)
```

### Scripts-Ordner ist bereits gut organisiert:
- `/archive` - Alte Scripts ✅
- `/dev` - Development Scripts ✅
- `/lib` - Shared Libraries ✅
- `/maintenance` - Wartungs-Scripts ✅

## 🚨 Phase 4: Console.logs entfernen

### Kritische Debug-Logs in Production:
- `src/hooks/marketplace/useMarketplaceV2.ts` - Mehrere console.logs
- `src/utils/features/admin-access.ts` - Admin-Logs
- 30+ weitere console.* Statements gefunden

**Empfehlung**: Verwende bereits vorhandenen `devLog` utility!

## 🗑️ Phase 5: Sofort zu löschende Dateien

```bash
# Logs und Build-Artefakte
rm sync-service-debug.log
rm tsconfig.tsbuildinfo

# .gitignore aktualisieren
echo "
# Logs
*.log
sync-service-debug.log

# Build artifacts
tsconfig.tsbuildinfo
.next/

# Temp files
temp-*
*.tmp
*.temp
" >> .gitignore
```

## ✅ Phase 6: Code-Qualität

### Legacy-Code aufräumen:
- 20+ "Legacy" Referenzen gefunden (hauptsächlich Typ-Konvertierungen)
- Namespace `@/types/core/core-nft-legacy` wird noch verwendet
- Legacy-Funktionen in `admin-access.ts` für Backwards-Compatibility

### Empfehlung:
1. Legacy-Types schrittweise migrieren
2. Alte Konvertierungs-Funktionen nach erfolgreicher Migration entfernen

## 📊 Erwartete Verbesserungen:

- **Bundle Size**: ~5-10% kleiner (durch entfernte Dependencies)
- **Build Zeit**: Minimal schneller
- **Übersichtlichkeit**: Deutlich besser durch aufgeräumte Docs
- **Wartbarkeit**: Verbessert durch weniger Legacy-Code

## 🎯 Sofort-Aktionen:

```bash
# 1. Git Backup
git add . && git commit -m "Pre-cleanup backup"

# 2. Dependencies aufräumen
npm uninstall ws pino-pretty

# 3. Logs löschen
rm sync-service-debug.log tsconfig.tsbuildinfo

# 4. Docs organisieren
mkdir -p docs/{refactoring,implementation,archive}
# ... verschiebe Dateien wie oben beschrieben
```

## ⚠️ Wichtige Hinweise:

1. **GraphQL/Apollo wird noch aktiv genutzt** - NICHT entfernen!
2. **TheGraph Sync-Service läuft noch** - Wichtig für Echtzeit-Updates
3. **Keine V1/V2 Marketplace-Duplikate gefunden** - Alter CLEANUP_PLAN ist überholt
4. **MongoDB ist primäre Datenbank** - TheGraph nur für Sync