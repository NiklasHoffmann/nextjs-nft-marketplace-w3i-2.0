# 🎮 History Towers - Highscore System

## Übersicht

Das Highscore-System für History Towers speichert Spielergebnisse in einer MongoDB-Datenbank und zeigt sie in einem Leaderboard an.

## Features

✅ **Score Speicherung** - Nach jedem Game Over können Spieler ihren Score speichern  
✅ **Player Identification** - Mit Namen oder Wallet-Adresse  
✅ **Leaderboard** - Top 10 All-Time, Weekly und persönliche Scores  
✅ **Anti-Cheat** - Server-seitige Validierung und Rate Limiting  
✅ **Responsive Design** - Desktop und Mobile optimiert  
✅ **Privacy** - Wallet-Adresse ist optional  

## Datenstruktur

```typescript
interface GameScore {
  _id: string;
  score: number;                // Punktzahl
  level: number;                // Erreichtes Level
  platformsClimbed: number;     // Anzahl gekletterte Plattformen
  playerName?: string;          // Spielername (optional, max 20 Zeichen)
  walletAddress?: string;       // Wallet-Adresse (optional)
  createdAt: Date;              // Zeitstempel
}
```

## API Endpoints

### POST /api/game/scores
Speichert einen neuen Score.

**Request Body:**
```json
{
  "score": 15420,
  "level": 6,
  "platformsClimbed": 283,
  "playerName": "SpeedRunner",
  "walletAddress": "0x1234...5678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Congratulations! You achieved rank #3 on the leaderboard!",
  "score": { /* GameScore object */ },
  "isTopScore": true,
  "rank": 3
}
```

**Validierung:**
- Score: 0 - 10,000,000
- Level: 1 - 1000
- PlatformsClimbed: 0 - 100,000
- PlayerName: max 20 Zeichen (optional)
- WalletAddress: 0x + 40 hex chars (optional)
- Mindestens PlayerName ODER WalletAddress erforderlich

**Rate Limiting:**
- Max 10 Submissions pro Stunde pro IP/Wallet

### GET /api/game/scores
Holt Scores basierend auf Filter.

**Query Parameters:**
- `type`: 'top' (default) | 'week' | 'user'
- `address`: Wallet-Adresse (für type='user')
- `limit`: Anzahl Ergebnisse (default: 10)

**Beispiele:**
```bash
# Top 10 All-Time
GET /api/game/scores

# Top 10 This Week
GET /api/game/scores?type=week

# User's Scores
GET /api/game/scores?type=user&address=0x1234...
```

## Setup

### 1. MongoDB URI konfigurieren

Füge in `.env.local` hinzu:
```bash
MONGODB_URI=mongodb://localhost:27017/nft-marketplace
# ODER für MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

### 2. Indizes erstellen

Führe das Setup-Skript aus:
```bash
node src/scripts/setup-game-indexes.js
```

Dies erstellt folgende Indizes:
- `score_date_desc`: Für Top-Scores (score DESC, createdAt DESC)
- `wallet_score_desc`: Für User-Scores (walletAddress ASC, score DESC)
- `date_score_desc`: Für Weekly-Scores (createdAt DESC, score DESC)
- `player_name`: Für Namen-Suchen (playerName ASC, sparse)

### 3. Test-Daten hinzufügen (optional)

Für Entwicklung/Testing:
```bash
node src/scripts/add-test-scores.js
```

Dies fügt 12 Test-Scores mit verschiedenen Namen, Scores und Daten hinzu.

## Komponenten

### HighscoreDialog
Erscheint nach Game Over und ermöglicht Score-Speicherung.

**Props:**
```typescript
{
  score: number;
  level: number;
  platformsClimbed: number;
  walletAddress?: string;
  onClose: () => void;
  onSubmitSuccess?: (response: ScoreSubmitResponse) => void;
}
```

### HighscoreTable
Zeigt Leaderboard mit verschiedenen Filtern.

**Props:**
```typescript
{
  walletAddress?: string;
  refreshTrigger?: number;
}
```

**Features:**
- 3 Filter: All-Time, This Week, My Scores
- Desktop: Tabellen-Ansicht
- Mobile: Card-Ansicht
- Eigener Score wird hervorgehoben
- Loading & Error States

## Integration

In der HistoryJumper-Komponente:

```typescript
import { useAccount } from 'wagmi'
import HighscoreDialog from './HighscoreDialog'
import HighscoreTable from './HighscoreTable'

// Im Component:
const { address } = useAccount()
const [showHighscoreDialog, setShowHighscoreDialog] = useState(false)
const [showLeaderboard, setShowLeaderboard] = useState(false)
const [leaderboardRefresh, setLeaderboardRefresh] = useState(0)

// Bei Game Over:
function endGame() {
  // ... existing code
  setShowHighscoreDialog(true)
}

// Im Return:
{showHighscoreDialog && (
  <HighscoreDialog
    score={score}
    level={level}
    platformsClimbed={platformsClimbed}
    walletAddress={address}
    onClose={() => setShowHighscoreDialog(false)}
    onSubmitSuccess={(response) => {
      if (response.isTopScore) {
        setLeaderboardRefresh(prev => prev + 1)
      }
    }}
  />
)}

{showLeaderboard && (
  <HighscoreTable 
    walletAddress={address} 
    refreshTrigger={leaderboardRefresh}
  />
)}
```

## Anti-Cheat Maßnahmen

1. **Server-seitige Validierung**
   - Score-Range Check (0 - 10M)
   - Level-Validierung (1 - 1000)
   - Plausibilitäts-Check (Score vs. Platforms)

2. **Rate Limiting**
   - Max 10 Submissions pro Stunde
   - Basierend auf IP-Adresse oder Wallet

3. **Duplicate Detection**
   - Gleicher Score kurz hintereinander wird erkannt

4. **Wallet-Verifizierung (optional)**
   - Scores mit Wallet sind vertrauenswürdiger
   - Könnte zukünftig mit Signatur verifiziert werden

## Zukünftige Erweiterungen

- [ ] **Score-Signatur**: Client signiert Score mit Wallet für zusätzliche Sicherheit
- [ ] **Achievements**: Badges für besondere Leistungen
- [ ] **Challenges**: Tägliche/Wöchentliche Herausforderungen
- [ ] **Social Features**: Freunde hinzufügen und vergleichen
- [ ] **Replays**: Aufzeichnung und Wiedergabe von Top-Runs
- [ ] **Seasons**: Monatliche/Saisonale Leaderboards mit Reset

## Troubleshooting

### MongoDB Connection Error
```
Error: MongoServerSelectionError: connect ECONNREFUSED
```
**Lösung:** Stelle sicher, dass MongoDB läuft und MONGODB_URI korrekt ist.

### Rate Limit Error (429)
```
Rate limit exceeded. Maximum 10 submissions per hour.
```
**Lösung:** Warte eine Stunde oder verwende eine andere IP/Wallet.

### Validation Error (400)
```
Either playerName or walletAddress is required
```
**Lösung:** Gib entweder einen Namen ein oder aktiviere "Include Wallet Address".

## Performance

- **Indizes**: Alle wichtigen Queries sind indexiert
- **Pagination**: Limit auf 10-20 Ergebnisse
- **Caching**: Client-seitiges Caching mit React State
- **Optimistic Updates**: UI-Updates vor API-Response

## Sicherheit

- **Input Sanitization**: Alle Eingaben werden validiert
- **Rate Limiting**: Verhindert Spam
- **No PII**: Keine persönlichen Daten außer optional Wallet
- **HTTPS Only**: In Production nur über HTTPS

## Lizenz

Teil des Next.js NFT Marketplace W3i 2.0 Projekts.
