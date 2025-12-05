# Marketplace V2 - Aufräum-Checkliste

## ✅ Erledigt

### 1. V2 Architektur
- [x] `/marketplace-v2` Route erstellt
- [x] `useMarketplaceV2` Hook erstellt (MongoDB Backend)
- [x] `useCollectionsV2` Hook erstellt
- [x] `ActiveItemsListV2` Component erstellt
- [x] `CollectionsTableV2` Component erstellt
- [x] `/api/marketplace/items` Route (MongoDB)
- [x] `/api/marketplace/collections` Route (MongoDB)
- [x] Link auf Root-Seite hinzugefügt

### 2. Bug Fixes
- [x] Infinite loop in useMarketplaceV2 gefixt
- [x] IPFS image loading gefixt
- [x] React key duplicates gefixt (listingId)
- [x] MongoDB price type migration (String → Number)
- [x] Stable pagination mit secondary sort (listingId)

### 3. Datenbank
- [x] MongoDB field types überprüft
- [x] Price migration durchgeführt
- [x] Top-level listingId hinzugefügt

---

## 🧹 Aufräum-Bedarf

### A. Verwirrende Duplikate

**Problem:** Wir haben jetzt 2 Versionen von vielen Komponenten/Hooks:

#### Components:
- `ActiveItemsList.tsx` (V1 - TheGraph)
- `ActiveItemsListV2.tsx` (V2 - MongoDB) ← KEEP
- `CollectionsTable.tsx` (V1 - TheGraph)
- `CollectionsTableV2.tsx` (V2 - MongoDB) ← KEEP

#### Hooks:
- `useActiveItems` (V1 - TheGraph via nft-hooks-optimized.ts)
- `useMarketplaceV2` (V2 - MongoDB) ← KEEP
- `useAllCollections` (V1 - TheGraph)
- `useCollectionsV2` (V2 - MongoDB) ← KEEP

#### Routes:
- `/marketplace` (V1 - nutzt V1 Components)
- `/marketplace-v2` (V2 - nutzt V2 Components) ← KEEP

### B. Vorschläge für Aufräumen

#### Option 1: Umbenennung (Recommended)
```
V1 → Legacy (behalten für Kompatibilität):
- ActiveItemsList.tsx → ActiveItemsListLegacy.tsx
- CollectionsTable.tsx → CollectionsTableLegacy.tsx
- /marketplace → /marketplace-legacy

V2 → Main (wird das neue Default):
- ActiveItemsListV2.tsx → ActiveItemsList.tsx
- CollectionsTableV2.tsx → CollectionsTable.tsx
- /marketplace-v2 → /marketplace
```

#### Option 2: Parallel behalten (Aktuell)
- Beide Versionen parallel laufen lassen
- V1 für TheGraph-basierte Features
- V2 für MongoDB-Features
- User kann wählen welche Version

#### Option 3: V1 löschen (Radikal)
- Alle V1 Components/Hooks löschen
- Nur V2 behalten
- Breaking change für bestehende Features

---

## 📁 Datei-Struktur Vorschlag

### Empfohlene Struktur:
```
src/
├── components/
│   └── marketplace/
│       ├── ActiveItemsList.tsx       (V2 - MongoDB)
│       ├── CollectionsTable.tsx      (V2 - MongoDB)
│       ├── NFTScrollList.tsx         (Shared)
│       ├── NFTFilterBar.tsx          (Shared)
│       └── legacy/                   (Optional: V1 Components)
│           ├── ActiveItemsListLegacy.tsx
│           └── CollectionsTableLegacy.tsx
│
├── hooks/
│   ├── marketplace/
│   │   ├── useMarketplaceV2.ts       (V2 - MongoDB)
│   │   └── useCollectionsV2.ts       (V2 - MongoDB)
│   └── nfts/
│       ├── nft-hooks-optimized.ts    (V1 - TheGraph)
│       └── useActiveItems.ts         (V1 - kann deprecated werden)
│
└── app/
    ├── marketplace/                  (V2 - MongoDB)
    │   └── page.tsx
    └── marketplace-legacy/           (Optional: V1 - TheGraph)
        └── page.tsx
```

---

## 🎯 Empfohlene Nächste Schritte

### Sofort (Kritisch):
1. **Entscheidung treffen:** Welche Option (1, 2, oder 3)?
2. **Console Logs entfernen:** In useMarketplaceV2.ts die Debug-Logs entfernen
3. **TypeScript Warnings:** Alle ungenutzte Imports aufräumen

### Kurzfristig:
4. **Dokumentation:** README updaten mit V2 Info
5. **Tests:** V2 Components testen
6. **Migration Plan:** Wenn V1 → V2 Migration geplant

### Mittelfristig:
7. **Performance:** MongoDB Indexes für oft genutzte Queries
8. **Features:** Fehlende Features von V1 nach V2 portieren
9. **Refactoring:** Gemeinsamen Code in shared utilities

---

## 🤔 Fragen für dich:

1. **Möchtest du V1 (TheGraph) komplett durch V2 (MongoDB) ersetzen?**
   - Ja → Option 1 (Umbenennung)
   - Nein → Option 2 (Parallel behalten)

2. **Gibt es Features in V1 die noch nicht in V2 sind?**

3. **Sollen wir die Debug-Logs in useMarketplaceV2 entfernen?**

---

## 💡 Nächster Schritt Vorschlag:

Lass uns **Option 1** machen:
1. V2 wird zum neuen Standard
2. V1 in `/legacy` Ordner verschieben
3. Alle Components/Routes umbenennen
4. Debug-Logs entfernen
5. Dokumentation aktualisieren

Was meinst du? Welche Option bevorzugst du?
