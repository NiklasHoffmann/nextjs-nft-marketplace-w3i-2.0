# 🗜️ Image Compression & Cache Management

## Implementierte Features

### ✅ WebP Compression
- **Automatisch**: Alle neuen IPFS-Bilder werden als WebP mit 85% Qualität gespeichert
- **Einsparung**: ~70-85% Reduktion der Dateigröße
- **Performance**: ~2.3 MB → ~300-500 KB pro Bild
- **Compatibility**: Alle modernen Browser unterstützen WebP

### ✅ Smart Cache Management
- **Max Size**: 500 MB Cache-Limit
- **TTL**: 90 Tage für gespeicherte Bilder
- **Auto-Cleanup**: Wird automatisch bei 90% Auslastung ausgelöst
- **LRU Strategy**: Löscht am wenigsten genutzte/älteste Bilder zuerst

### ✅ Metadata Tracking
- **Access Stats**: Zählt wie oft jedes Bild abgerufen wird
- **Compression Ratio**: Trackt Einsparungen pro Bild
- **Last Access**: LRU-basierte Priorisierung
- **File Age**: Automatisches Cleanup nach 90 Tagen

## API Endpoints

### GET /api/nft/image/[hash]
Lädt und cached IPFS-Bilder mit automatischer Compression.

**Beispiel:**
```bash
http://localhost:3000/api/nft/image/QmXxx...
```

**Response Headers:**
- `X-Cache-Status`: `HIT` (cached) oder `MISS` (neu geladen)
- `X-Cache-Format`: `webp`, `legacy`, oder `original`
- `X-Compression-Ratio`: Prozentuale Einsparung (bei MISS)
- `X-Original-Size`: Originalgröße in Bytes
- `X-Compressed-Size`: Komprimierte Größe in Bytes

### GET /api/nft/image/stats
Zeigt Cache-Statistiken an.

**Beispiel:**
```bash
curl http://localhost:3000/api/nft/image/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 62,
    "totalSizeMB": 35.42,
    "maxSizeMB": 500,
    "usagePercent": 7.1,
    "averageCompressionRatio": 78.5,
    "lastCleanup": "2026-02-06T...",
    "topFiles": [
      {
        "hash": "QmXxx...",
        "sizeKB": 456.23,
        "originalSizeKB": 2134.56,
        "compressionRatio": 78.6,
        "accessCount": 142,
        "lastAccess": "2026-02-06T...",
        "ageHours": 24.5,
        "format": "webp"
      }
    ]
  }
}
```

### DELETE /api/nft/image/[hash] (Admin only)
Löscht einzelne Bilder aus dem Cache.

**Beispiel:**
```bash
curl -X DELETE http://localhost:3000/api/nft/image/QmXxx...
```

### DELETE /api/nft/image/all (Admin only)
Löscht den kompletten Cache.

**Beispiel:**
```bash
curl -X DELETE http://localhost:3000/api/nft/image/all
```

## Automatisches Cleanup

Das System führt automatisch Cleanup durch wenn:
1. **Cache-Größe** > 450 MB (90% von 500 MB)
2. **Beim Speichern** neuer Bilder wird automatisch geprüft
3. **Strategie**: 
   - Löscht Dateien älter als 90 Tage
   - Danach: LRU (Least Recently Used) bis Target erreicht
   - Target: 70% der Max-Größe (350 MB)

## Performance Metriken

### Vor Compression (aktuell)
- 62 Dateien
- ~145 MB total
- ~2.3 MB durchschnittlich pro Bild

### Nach Compression (erwartet)
- 62 Dateien  
- **~35-45 MB total** (70-75% Einsparung)
- **~500-700 KB** durchschnittlich pro Bild

### Bei 1000 NFTs
- **Ohne Compression**: ~2.3 GB
- **Mit Compression**: ~500-700 MB ✅
- **Cleanup**: Automatisch bei >450 MB

## Migration Bestehender Bilder

Die alten unkomprimierten Bilder bleiben funktionsfähig:
1. Neue Requests werden als WebP komprimiert gespeichert
2. Alte Dateien werden beim nächsten Request automatisch ersetzt
3. Oder: Manuelles Löschen des Caches → alle Bilder werden neu komprimiert

**Komplette Cache-Neuerstellung:**
```bash
# Lösche alle alten Bilder (werden automatisch neu geladen & komprimiert)
curl -X DELETE http://localhost:3000/api/nft/image/all
```

## Monitoring

**Cache Stats abrufen:**
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/nft/image/stats" | 
  Select-Object -ExpandProperty Content | 
  ConvertFrom-Json | 
  ConvertTo-Json -Depth 10

# Oder via Browser
http://localhost:3000/api/nft/image/stats
```

## Technische Details

### Compression Settings
```typescript
sharp(buffer)
  .webp({ 
    quality: 85,  // Good balance quality/size
    effort: 4     // Compression effort (0-6, higher = better compression)
  })
```

### Cache Structure
```
public/cached-nft-images/
  ├── .cache-metadata.json    (Tracking stats)
  ├── QmXxx....webp           (New compressed format)
  └── QmYyy...                (Legacy uncompressed)
```

### Metadata Schema
```typescript
{
  "files": {
    "QmXxx.webp": {
      "hash": "QmXxx...",
      "size": 456789,              // Compressed size
      "originalSize": 2134567,     // Original size
      "compressionRatio": 78.6,    // % saved
      "accessCount": 142,          // Access frequency
      "lastAccess": 1234567890,    // Unix timestamp
      "created": 1234567890,       // Unix timestamp
      "format": "webp"
    }
  },
  "totalSize": 37294857,
  "lastCleanup": 1234567890
}
```

## Vorteile

1. **70-85% Speicher-Einsparung** 💾
2. **Schnellere Ladezeiten** (kleinere Dateien) ⚡
3. **Automatisches Management** (kein manuelles Eingreifen) 🤖
4. **Bandwidth-Einsparung** (für Server & User) 📉
5. **Skalierbar** auf 1000+ NFTs 📈
6. **Production-Ready** mit Monitoring 🚀

## Next Steps (Optional)

### CDN Integration
Für noch bessere Performance:
- Vercel Edge Functions
- Cloudflare R2 Storage
- Cloudinary/imgix für advanced Image-Optimierung

### AVIF Support
Noch bessere Compression (10-20% mehr):
```typescript
.avif({ quality: 80, effort: 4 })
```
> ⚠️ Browser Support: ~93% (Chrome, Edge, Firefox, Opera)

### Progressive Loading
Für sehr große Bilder:
- Blur placeholder (sharp.resize → base64)
- Progressive JPEG/WebP
- Lazy loading mit intersection observer (already implemented)
