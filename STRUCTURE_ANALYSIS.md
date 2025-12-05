# 🔍 Strukturanalyse - Ungenutzte/Veraltete Dateien

## Analysierte Bereiche:

### 1. Legacy-Code gefunden ✅
- **`src/types/core/core-nft-legacy.ts`** - Explizit als @deprecated markiert
  - Wird noch von 2 Dateien importiert
- **`src/utils/api/nft-aggregation.ts`** - Enthält Legacy-Konvertierungsfunktionen
- **`src/utils/features/admin-access.ts`** - 7 deprecated Funktionen
- **`src/types/events.ts`** - Legacy Event-Typen

### 2. Veraltete Referenzen ✅
- **ActiveItemsList** - Wird nur in Kommentaren/Types erwähnt, keine echte Komponente
- **CollectionsTable** - Wird nur in Kommentaren erwähnt, existiert nicht mehr
- **NFTContext** - Wurde deprecated (siehe docs/NFTCONTEXT_DEPRECATION.md)
  - Viele Referenzen in Kommentaren und legacy types
- **04-nft-detail** - Alte Ordnerreferenz in `src/components/index.ts`

### 3. Test-Infrastruktur ✅
- Nur 1 Test-Datei: `src/app/history-towers/__tests__/TowerPhysicsEngine.test.ts`
- Testing-Dependencies installiert aber kaum genutzt
- Vitest config existiert aber wird nicht genutzt

### 4. Spezielle Features ✅
- **history-towers** - Separates Spiel, wird aktiv genutzt (in Navbar verlinkt)
- **`/api/game`** - API Routes für das Spiel

## Konkrete Aufräum-Kandidaten:

### 1. Ungenutzte Dependencies
```bash
# Testing-Setup wird nur für 1 Test-Datei genutzt
npm uninstall --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Legacy Type Dateien
- `src/types/core/core-nft-legacy.ts` - Komplett deprecated
  - Von 2 Dateien importiert: utils/performance/context.ts, utils/api/nft-aggregation.ts
  - Diese Importe müssen erst migriert werden

### 3. Veraltete Kommentare/Referenzen bereinigen
- ✅ `src/components/index.ts` - "04-nft-detail" Referenz entfernt
- ✅ `src/components/ui/ScrollButtons.tsx` - Falsche Component-Referenzen korrigiert
- `src/utils/marketplace/nft-converters.ts` - ActiveItemsList Referenz
- `src/types/marketplace/marketplace-ui.ts` - ActiveItemsList Props & Referenzen

### 4. Deprecated Funktionen
- `src/utils/features/admin-access.ts` - 7 deprecated Funktionen
  - Werden vermutlich noch für Backwards-Compatibility gebraucht

### 5. Nicht-existierende Context Referenzen
- Viele Referenzen zu `NFTContext` in Kommentaren
- NFTContext wurde deprecated aber Referenzen sind noch überall

## Empfohlene Reihenfolge:

1. ✅ **Testing-Dependencies entfernt** (152 packages gespart!)
2. ✅ **Veraltete Kommentare bereinigt** 
3. **Legacy-Types Migration** (als nächstes)
4. **Deprecated Functions Review**

## Status: Teilweise aufgeräumt

### ✅ Bereits erledigt:
- Testing-Framework komplett entfernt (152 packages!)
- vitest.config.ts gelöscht
- Falsche Component-Referenzen korrigiert
- ActiveItemsList Referenzen aktualisiert
- **Legacy-Code komplett entfernt:**
  - ✅ core-nft-legacy.ts gelöscht (238 Zeilen)
  - ✅ performance/context.ts gelöscht
  - ✅ Legacy-Konvertierungsfunktionen entfernt
  - ✅ Alle Legacy-Type Importe bereinigt

### ⏳ Noch zu erledigen:

#### Legacy Type Migration - Detaillierte Analyse:

**1. `src/utils/performance/context.ts`**
- Importiert: NFTData, NFTLoadingState, NFTErrorState, NFTCache
- Exportiert mehrere Funktionen die NICHT verwendet werden:
  - createEmptyNFTData
  - createEmptyLoadingState
  - createEmptyErrorState
  - calculateCacheStats
  - filterCacheByAge
- **Empfehlung**: Komplette Datei kann gelöscht werden!

**2. `src/utils/api/nft-aggregation.ts`**
- Importiert: NFTData, NFTCardData (nur für Legacy-Konvertierung)
- Exportiert 2 ungenutzte Legacy-Konvertierungsfunktionen:
  - convertLegacyNFTData
  - convertLegacyCardData
- **Empfehlung**: Legacy-Imports und Funktionen entfernen

**3. `src/types/core/core-nft-legacy.ts`**
- Komplett als @deprecated markiert
- **Empfehlung**: Kann gelöscht werden nach Bereinigung der obigen Dateien

#### Weitere Aufgaben:
- NFTContext Referenzen in Kommentaren entfernen
- Deprecated admin-access Funktionen prüfen