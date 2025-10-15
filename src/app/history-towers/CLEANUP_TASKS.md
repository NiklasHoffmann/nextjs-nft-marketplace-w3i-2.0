# History Towers - Cleanup Tasks

## Ungenutzte Dateien (zu entfernen)

### 1. `components/01-HistoryJumper.tsx` (958 Zeilen)
- **Status**: Alte Version, nicht verwendet
- **Aktion**: Löschen
- **Grund**: `HistoryJumper.tsx` (1071 Zeilen) ist die aktuelle Version

### 2. `components/01-IcyTowers.tsx` (447 Zeilen)  
- **Status**: Alte/Prototype Version
- **Aktion**: Löschen
- **Grund**: Prototype oder alternative Implementation, nicht verwendet

## Cleanup-Schritte

```bash
# 1. Prüfe ob Dateien wirklich nicht verwendet werden
grep -r "01-HistoryJumper" src/
grep -r "01-IcyTowers" src/

# 2. Lösche die Dateien (wenn nicht verwendet)
rm src/app/history-towers/components/01-HistoryJumper.tsx
rm src/app/history-towers/components/01-IcyTowers.tsx

# 3. Teste das Spiel
npm run dev
# Navigate to /history-towers and test
```

## Dateien-Vergleich

| Datei | Zeilen | Status | Verwendet |
|-------|--------|--------|-----------|
| `HistoryJumper.tsx` | 1071 | ✅ Aktiv | ✅ Ja (in index.ts) |
| `01-HistoryJumper.tsx` | 958 | ⚠️ Alt | ❌ Nein |
| `01-IcyTowers.tsx` | 447 | ⚠️ Prototype | ❌ Nein |

## Nach dem Cleanup

**Verbleibende Komponenten:**
```
components/
├── HistoryJumper.tsx       # Hauptspiel (1071 Zeilen)
├── HighscoreDialog.tsx     # Score-Dialog
├── HighscoreTable.tsx      # Leaderboard
└── index.ts                # Exports (nur HistoryJumper, HighscoreDialog, HighscoreTable)
```

## Sicherheits-Check

Vor dem Löschen sicherstellen:
- [ ] `index.ts` exportiert NICHT `01-HistoryJumper` oder `01-IcyTowers`
- [ ] Keine Imports in anderen Dateien
- [ ] `HistoryJumper.tsx` funktioniert einwandfrei
- [ ] Backup erstellt (Git commit)

## Ausführung

```bash
# Manuell löschen oder:
cd src/app/history-towers/components
rm 01-HistoryJumper.tsx 01-IcyTowers.tsx

# Git commit
git add -A
git commit -m "cleanup: Remove unused legacy game components (01-HistoryJumper, 01-IcyTowers)"
```
