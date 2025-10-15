# 🎮 History Towers - Jump & Run Game

Ein Canvas-basiertes Jump & Run Spiel mit progressiver Schwierigkeit und Highscore-System.

## 📁 Struktur

```
history-towers/
├── components/
│   ├── HistoryJumper.tsx       # Hauptspiel-Komponente (1071 Zeilen - Monolithisch)
│   ├── 01-HistoryJumper.tsx    # ⚠️ Legacy - zu entfernen?
│   ├── 01-IcyTowers.tsx        # ⚠️ Legacy - zu entfernen?
│   ├── HighscoreDialog.tsx     # Score-Eingabe Dialog
│   ├── HighscoreTable.tsx      # Leaderboard Anzeige
│   └── index.ts                # Exports
├── config/
│   ├── gameConstants.ts        # ✅ NEW - Zentrale Konstanten
│   └── gameConfig.ts           # Spiel-Konstanten & Types (alt?)
├── utils/
│   └── gameUtils.ts            # Hilfsfunktionen
├── page.tsx                    # Route Page
└── README.md                   # Diese Datei
```

## ⚠️ Code-Zustand & Refactoring-Status

### Aktuelle Architektur
- **HistoryJumper.tsx**: 1071 Zeilen monolithischer Code
  - ✅ Funktioniert einwandfrei
  - ❌ Schwer wartbar (alle Logic in einer Datei)
  - ❌ Rendering & Game Logic vermischt
  - ❌ Schwierig zu testen

### Refactoring-Empfehlungen (Optional)
**Nur bei Bedarf durchführen - siehe "Refactoring Plan" unten**

## 🎯 Features

### Gameplay
- **Platform Jumping**: Springe auf Plattformen und klettere höher
- **Progressive Difficulty**: Jedes Level (50 Plattformen) erhöht die Schwierigkeit
  - Ab Level 2: Plattformen fallen nach unten
  - Ab Level 3: Plattformen bewegen sich horizontal
- **Safe Platforms**: Jede 50. Plattform ist golden und zeigt das Level an
- **Tower Background**: Backsteinwand mit scrollenden gotischen Fenstern
- **Random Characters**: 6 verschiedene Charaktere, zufällig ausgewählt

### Steuerung
- **Desktop**: 
  - ← → oder A/D: Bewegen
  - ␣ (Space) oder ↑ oder W: Springen
  - Enter: Start/Neustart
  
- **Mobile**: Touch-Buttons
  - Links: L/R Bewegung
  - Rechts: Jump

### Highscore-System
- **Datenbank-Integration**: Scores werden in MongoDB gespeichert
- **Player Identification**: Name oder Wallet-Adresse (optional)
- **Leaderboard**: Top 10 All-Time, This Week, My Scores
- **Anti-Cheat**: Server-seitige Validierung, Rate Limiting

## 🔧 Technische Details

### Game Loop
- **requestAnimationFrame**: 60 FPS
- **Delta Time**: Framezeit-basierte Physik
- **Canvas Scaling**: DPR-aware für scharfe Grafiken

### Physik
- Gravity: 2400 px/s²
- Jump Velocity: -880 px/s
- Max Fall Speed: 1200 px/s
- Collision Detection: Feet-only (20px wide)

### State Management
- **useRef**: Game State (nicht-reaktiv für Performance)
- **useState**: UI State (Score, Running, Paused, etc.)
- **useEffect**: Lifecycle (Canvas Setup, Event Listeners)

### Performance
- Canvas-basiert (keine DOM-Manipulation im Game Loop)
- Effiziente Platform-Spawning (nur sichtbare Plattformen)
- Optimierte Rendering (kein Re-render bei jedem Frame)

## 📊 Konfiguration

Alle Spiel-Konstanten sind in `config/gameConfig.ts` zentralisiert:

```typescript
// Beispiel: Canvas-Größe ändern
export const GAME_CONFIG = {
  WIDTH: 360,  // Logische Breite
  HEIGHT: 640, // Logische Höhe
}

// Beispiel: Schwierigkeit anpassen
export const DIFFICULTY = {
  PLATFORMS_PER_LEVEL: 50, // Plattformen pro Level
  VERTICAL_MOVEMENT_START_LEVEL: 2,
  HORIZONTAL_MOVEMENT_START_LEVEL: 3,
}
```

## 🎨 Styling

- **Tailwind CSS**: Für UI-Komponenten
- **Canvas API**: Für Game-Rendering
- **Responsive**: Desktop & Mobile optimiert
- **Color Scheme**:
  - Background: `#1273EB` (Blue)
  - Platforms: `#FFF9E2` (Cream)
  - Safe Platforms: `#FFD700` (Gold)

## 🔌 API Integration

### Highscore API
- **POST** `/api/game/scores` - Score speichern
- **GET** `/api/game/scores?type=top` - Top Scores
- **GET** `/api/game/scores?type=week` - Weekly Scores
- **GET** `/api/game/scores?type=user&address=0x...` - User Scores

### Wallet Integration
- **wagmi**: `useAccount` Hook für Wallet-Adresse
- **Optional**: Scores können mit oder ohne Wallet gespeichert werden

## 🚀 Erweiterungen

Mögliche zukünftige Features:

- [ ] **Power-Ups**: Sammle Items für Bonus-Punkte
- [ ] **Achievements**: Badges für besondere Leistungen
- [ ] **Sound Effects**: Audio-Feedback für Aktionen
- [ ] **Multiplayer**: Echtzeit-Wettbewerb
- [ ] **Skins**: Verschiedene Charaktere freischaltbar
- [ ] **Daily Challenges**: Tägliche Ziele

## 🧪 Testing

```bash
# Development Server
npm run dev

# Navigate to
http://localhost:3000/history-towers

# Test Checklist
- [ ] Spiel startet ohne Fehler
- [ ] Plattformen spawnen korrekt
- [ ] Kollisions-Erkennung funktioniert
- [ ] Level-Anzeige ist akkurat
- [ ] Highscore-Dialog erscheint bei Game Over
- [ ] Leaderboard lädt und zeigt Scores
- [ ] Mobile Touch-Controls funktionieren
```

## 🔧 Refactoring Plan (Bei Bedarf)

### Warum NICHT sofort refactoren?
- ✅ Code funktioniert einwandfrei
- ❌ 1071 Zeilen in einer Datei = hohes Risiko
- ❌ Keine automated tests = schwierig sicher zu refactoren
- ❌ Viel Aufwand für wenig funktionalen Gewinn

### Empfohlene Struktur (Zukünftig)

```
history-towers/
├── components/
│   ├── HistoryJumper.tsx          # Simplified container (150 Zeilen)
│   ├── GameCanvas.tsx             # Canvas rendering component
│   ├── GameOverlay.tsx            # HUD/UI overlay
│   ├── GameControls.tsx           # Input controls UI
│   └── PauseMenu.tsx              # Pause menu
├── hooks/
│   ├── useHistoryTowersGame.ts    # Main game logic (400 Zeilen)
│   ├── useGamePhysics.ts          # Physics calculations
│   └── useMotionControls.ts       # Device orientation
├── utils/
│   ├── gameRenderer.ts            # Canvas rendering (300 Zeilen)
│   ├── difficultyCalculator.ts    # Level & difficulty
│   ├── platformSpawner.ts         # Platform generation
│   └── collisionDetection.ts      # Collision helpers
├── config/
│   └── gameConstants.ts           # ✅ CREATED - All constants
└── types/
    └── game.ts                     # TypeScript interfaces
```

### Refactoring-Schritte (Inkrementell)

**Phase 1: Vorbereitung** ✅ COMPLETED
1. ✅ Erstelle `config/gameConstants.ts`
2. ✅ Dokumentiere Architektur (dieses Dokument)

**Phase 2: Bei neuem Feature oder Bug**
3. Extrahiere betroffenen Code in separates Modul
4. Schreibe Unit Tests für neues Modul
5. Integriere zurück in HistoryJumper.tsx

**Phase 3: Bei Zeit & Bedarf**
6. Extrahiere Rendering → `utils/gameRenderer.ts`
7. Extrahiere Game Logic → `hooks/useHistoryTowersGame.ts`
8. Split UI → Separate Components

### Verwendung von gameConstants.ts

```typescript
// OLD (direkt in Component):
const WIDTH = 360;
const HEIGHT = 640;
const GRAVITY = 2400;

// NEW (aus Constants):
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_WIDTH,
  COLORS
} from '../config/gameConstants';
```

## 📝 Code-Qualität

- **TypeScript**: Vollständig typisiert
- **ESLint**: Code-Qualität
- **Kommentare**: Wichtige Logik dokumentiert
- **Modular**: Komponenten, Config, Utils getrennt

## 🐛 Bekannte Issues

- Keine aktuell bekannten Bugs

## 📄 Lizenz

Teil des Next.js NFT Marketplace W3i 2.0 Projekts.
