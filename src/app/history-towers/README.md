# 🎮 History Towers - Jump & Run Game

Ein Canvas-basiertes Jump & Run Spiel mit progressiver Schwierigkeit und Highscore-System.

## 📁 Struktur

```
history-towers/
├── components/
│   ├── HistoryJumperV2.tsx     # Hauptspiel-Komponente (860 Zeilen - Refactored ✅)
│   ├── GamePageLayout.tsx      # Responsive Layout (Desktop/Mobile)
│   ├── HighscoreDialog.tsx     # Score-Eingabe Dialog
│   ├── HighscoreTable.tsx      # Leaderboard Anzeige
│   ├── LeaderboardModal.tsx    # Mobile Leaderboard
│   ├── LeaderboardSidebar.tsx  # Desktop Leaderboard
│   ├── MarketplaceDropdown.tsx # Mobile Marketplace Info
│   ├── MarketplaceInfo.tsx     # Desktop Marketplace Info
│   └── index.ts                # Exports
├── engine/                     # ✅ NEW - Game Engines
│   ├── TowerRenderEngine.ts    # Rendering Logic (436 Zeilen)
│   ├── TowerPhysicsEngine.ts   # Physics Logic (385 Zeilen)
│   └── index.ts
├── hooks/                      # ✅ NEW - Custom Hooks
│   ├── useGameState.ts         # UI State Management (useReducer)
│   ├── useGameInput.ts         # Input Handling (Keyboard, Touch, Motion)
│   ├── useTowerCharacters.ts   # Character Loading (Promise-based)
│   └── index.ts
├── config/
│   └── gameConstants.ts        # ✅ Zentrale Konstanten (alle Magic Numbers)
├── types/
│   ├── historyTower.types.ts   # TypeScript Interfaces
│   └── index.ts
├── page.tsx                    # Route Page
├── ARCHITECTURE.md             # Architektur-Dokumentation
└── README.md                   # Diese Datei
```

## ✅ Refactoring Status (Vollständig Abgeschlossen!)

**Status**: ✅ Production Ready (12. November 2025)

### Von Monolith zu Clean Architecture
- **Vorher**: 965 Zeilen monolithischer Code in einer Datei
- **Nachher**: 745 Zeilen Hauptkomponente + 821 Zeilen in Engines
- **Reduktion**: 220 Zeilen (-23%) durch Elimination von Duplikaten
- **Tests**: 20/20 passing (TowerPhysicsEngine, 7ms runtime)
- **Build**: Production-ready (12.5 kB route, 1.4 MB First Load JS)

### Neue Architektur
```typescript
HistoryJumperV2 (745 Zeilen - Orchestration & UI)
  ├─> useGameState() - State Management mit useReducer
  ├─> useGameInput() - Input Handling (Keyboard, Touch, Motion)
  ├─> useTowerCharacters() - Async character loading
  │
  ├─> TowerRenderEngine (436 Zeilen - All Rendering)
  │    ├─ drawTowerWindows() - Brick wall + windows mit characters
  │    ├─ drawPlatforms() - Platform rendering mit HSL gradients
  │    ├─ drawPlatformLabels() - Level labels auf safe platforms
  │    ├─ drawPlayer() - Player character mit tilt effect
  │    └─ Layer Caching - Background cache (alle 10px updated)
  │
  └─> TowerPhysicsEngine (385 Zeilen - All Physics, 20 Tests)
       ├─ getDifficulty() - Level progression (6 Tests)
       ├─ spawnPlatform() - Platform generation (5 Tests)
       ├─ checkCollision() - Feet-based collision (4 Tests)
       ├─ getNearbyPlatforms() - Spatial partitioning (2 Tests)
       ├─ isOutOfBounds() - Boundary checks (1 Test)
       └─ createInitialPlatforms() - Initial setup (2 Tests)
```

### Verbesserungen
✅ **Separation of Concerns**: Rendering, Physics, State, Input getrennt  
✅ **Testability**: Engines können unabhängig getestet werden (20/20 Tests)  
✅ **Maintainability**: Klare Verantwortlichkeiten  
✅ **Type Safety**: Zentrale Type-Definitionen  
✅ **No Magic Numbers**: Alle Konstanten in gameConstants.ts  
✅ **Performance**: Layer-Caching + Spatial Partitioning (~70% weniger Checks)  
✅ **Production Ready**: Build erfolgreich, keine TypeScript/ESLint Errors  
✅ **Performance**: Identisch (60 FPS target)

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

## 🎯 Entwickler-Informationen

### Quick Start
```bash
# Route öffnen
http://localhost:3000/history-towers

# Tests ausführen
npm test -- src/app/history-towers/__tests__

# Build checken
npm run build
```

### Code Guidelines
- Alle Magic Numbers → `gameConstants.ts`
- Neue Features → Tests schreiben
- Engines nutzen für Logic-Änderungen
- JSDoc für public methods

### Beispiel: gameConstants.ts verwenden
```typescript
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
