# /sell Route Structure

## Seitenstruktur

### 1. `/sell` - NFT Auswahl & Formular
**Datei:** `SellPage.tsx` → `page.tsx`
**Komponenten:**
- `SellHeader` - Header mit Progress Cards (Whitelist ✓, Approval ✓, Approved ✓)
- `NFTSearchFilter` - Suchleiste
- `NFTUserSelector` - Einzelauswahl (Single Mode)
- `BatchNFTSelector` - Mehrfachauswahl (Batch Mode)
- `UnifiedListingForm` - Listing-Formular (Single Mode)
- `BatchPricingForm` - Preis-Konfiguration (Batch Mode)
- `EmptyState` - Leerzustand
- `ErrorDisplay` - Fehleranzeige

### 2. `/sell/check-listing` - Vorschau
**Datei:** `check-listing/page.tsx`
**Komponenten:**
- `SellHeader` - Header mit Progress Cards (Status: Approved ✓)
- `TransactionPreview` - Listing-Vorschau (Single)
- `BatchTransactionPreview` - Listing-Vorschau (Batch)

### 3. `/sell/listing` - Transaktion
**Datei:** `listing/page.tsx`
**Komponenten:**
- `SellHeader` - Header mit Progress Cards (Status: Signing/Pending)
- `ListingProgressInline` - Transaktionsfortschritt

### 4. `/sell/success` - Erfolg
**Datei:** `success/page.tsx`
**Komponenten:**
- `SellHeader` - Header mit Progress Cards (Alle ✓)
- Erfolgsanzeige mit Transaction Hash

## Progress Steps (Stats Cards)

**5 Schritte im Header:**
1. 🔍 **Whitelist** - Collection freigegeben
2. ✓ **Approval** - NFT Zugriff genehmigt  
3. ✅ **Approved** - Genehmigung bestätigt
4. ✍️ **Signing** - Transaktion signieren
5. ⏳ **Pending** - Blockchain-Bestätigung

**Statusanzeige:**
- Grau: Ausstehend
- Blau + Pulsierend: Aktiv
- Grün: Abgeschlossen

## Komponenten-Übersicht

### Header & Navigation
- `SellHeader.tsx` - Unified Header mit Progress Tracking
- ~~`PageHeader.tsx`~~ - ❌ ENTFERNT (ersetzt durch SellHeader)

### NFT Auswahl
- `NFTUserSelector.tsx` - Einzelauswahl mit Grid
- `NFTSearchFilter.tsx` - Such- und Filterkomponente
- `BatchNFTSelector.tsx` - Mehrfachauswahl mit Checkboxen

### Formulare
- `UnifiedListingForm.tsx` - Haupt-Listing-Formular (Single)
- `BatchListingForm.tsx` - Batch-Listing-Formular
- `BatchPricingForm.tsx` - Preis-Konfiguration für Batch

### Vorschau & Progress
- `TransactionPreview.tsx` - Listing-Vorschau (Single)
- `BatchTransactionPreview.tsx` - Listing-Vorschau (Batch)
- `ListingProgressInline.tsx` - Transaktionsfortschritt

### Feedback & Dialoge
- `EmptyState.tsx` - Leerzustand
- `ErrorDisplay.tsx` - Fehleranzeige
- `ApprovalDialog.tsx` - Approval-Dialog
- `WhitelistWarning.tsx` - Whitelist-Warnung
- `BatchListingInfoBanner.tsx` - Info-Banner

### Veraltete Dateien (GELÖSCHT)
- ~~`SellPage.OLD.tsx`~~ - ❌ ENTFERNT
- ~~`PageHeader.tsx`~~ - ❌ ENTFERNT
- ~~`ListingProgressOverlay.tsx`~~ - ⚠️ Nicht verwendet?

## Zurück-Navigation

- `/sell` → `/wallet`
- `/sell/check-listing` → `/sell`
- `/sell/listing` → `/sell/check-listing`
- `/sell/success` → `/sell`

## Hooks & Contexts

**Hooks:** `hooks/`
- `useUserNFTs` - NFT-Daten laden
- `useListingForm` - Formular-State

**Contexts:** `contexts/`
- `ListingFlowContext` - Flow-State Management

## Utilities

**Utils:** `utils/`
- Helper-Funktionen für Listing-Logik

**Types:** `types/`
- TypeScript-Definitionen
