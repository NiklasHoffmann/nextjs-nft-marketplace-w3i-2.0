# History Towers - Game Architecture

## 📁 Projekt-Struktur

```
src/app/history-towers/
├── components/           # React Components
│   ├── GamePageLayout.tsx      # 3-Spalten Layout Wrapper
│   ├── HistoryJumper.tsx       # Haupt-Game Component
│   ├── HighscoreTable.tsx      # Leaderboard
│   ├── HighscoreDialog.tsx     # Score Submit Dialog
│   ├── MarketplaceInfo.tsx     # Linke Sidebar
│   └── LeaderboardSidebar.tsx  # Rechte Sidebar
│
├── hooks/               # Custom React Hooks
│   ├── useGameState.ts         # State Management Hook
│   ├── useGameInput.ts         # Input Handling Hook
│   ├── useGamePhysics.ts       # Physics Engine Hook
│   ├── useGameRenderer.ts      # Canvas Rendering Hook
│   ├── useScoreManager.ts      # Score API Hook
│   ├── useGameLoop.ts          # Game Loop Hook
│   └── index.ts                # Barrel Export
│
├── types/               # TypeScript Type Definitions
│   ├── game.types.ts           # Game-bezogene Interfaces
│   └── index.ts                # Barrel Export
│
├── constants/           # Spiel-Konfiguration
│   ├── game.constants.ts       # Physik, Farben, Config
│   └── index.ts                # Barrel Export
│
├── utils/               # Utility Functions
│   ├── platformGenerator.ts    # Plattform-Generierung
│   ├── collision.ts            # Kollisions-Detection
│   ├── particles.ts            # Partikel-System
│   ├── scoring.ts              # Score-Berechnung
│   └── index.ts                # Barrel Export
│
├── ARCHITECTURE.md      # This file
└── page.tsx             # Next.js Page Entry Point
```

## 🎮 Core Game Concepts

### Game Loop
Das Spiel läuft mit 60 FPS und verwendet `requestAnimationFrame` für smooth rendering.

**Update-Zyklen:**
1. **Input Processing** - Keyboard/Touch Events
2. **Physics Update** - Spieler-Bewegung, Gravitation
3. **Collision Detection** - Plattform-Checks
4. **Platform Management** - Generierung & Cleanup
5. **Particle Effects** - Landing, Combos
6. **Camera Follow** - Smooth Scrolling
7. **Rendering** - Canvas Draw Calls

### Platform System
Plattformen werden dynamisch generiert und entfernt:

- **Start:** 15 Plattformen werden initialisiert
- **Generation:** Neue Plattformen wenn Spieler hoch klettert
- **Cleanup:** Alte Plattformen unter Viewport werden entfernt
- **Schwierigkeit:** Plattformen werden kleiner mit höherem Level

### Collision Detection
Einfaches AABB (Axis-Aligned Bounding Box) System:

```typescript
checkCollision(player, platform) {
  return (
    player.x < platform.x + platform.width &&
    player.x + player.width > platform.x &&
    player.y + player.height >= platform.y &&
    player.velocityY >= 0  // Nur von oben
  )
}
```

### Score System
- **Base Score:** 10 Punkte pro Plattform
- **Combo Bonus:** +5 Punkte pro Combo-Level
- **Combo Multiplier:** 1 + Math.floor(combo / 5) * 0.5
- **Height Bonus:** platformNumber * 5
- **Rank System:** Novice → Legendary

### Level System
- **50 Plattformen pro Level**
- **Schwierigkeit steigt um 10% pro Level**
- **Max Schwierigkeit:** 3.0x
- **Effekte:** Kleinere Plattformen, höhere Geschwindigkeit

## � Custom Hooks

### useGameState
Zentrales State Management für das gesamte Spiel.

**Managed:**
- Player (Position, Velocity, Ground State)
- Platforms (Array, Generation, Cleanup)
- Particles (Array, Physics, Lifecycle)
- Score & Combo System
- Camera Position
- Direction Input

**Key Methods:**
- `resetGame()` - Reset zum Startzustand
- `updatePlayer()` - Player-Updates
- `addParticles()` - Neue Partikel hinzufügen
- `updateScore()` - Score erhöhen
- `updateCombo()` - Combo-Counter
- `batchUpdate()` - Performance-optimiert

### useGameInput
Verwaltet alle Eingaben (Keyboard + Touch).

**Features:**
- Keyboard Events (Arrow Keys, WASD, Space)
- Touch Button States
- Unified Input API
- Auto-cleanup bei unmount

**Key Methods:**
- `isMovingLeft()` - Links-Eingabe check
- `isMovingRight()` - Rechts-Eingabe check
- `isJumping()` - Sprung-Eingabe check
- `handleTouchButton()` - Touch-Handler
- `resetInput()` - Alle Inputs zurücksetzen

### useGamePhysics
Physics Engine mit Kollisionserkennung.

**Capabilities:**
- Gravitation & Bewegung
- Velocity Capping
- Friction/Air Resistance
- AABB Collision Detection
- Jump Mechanics
- Camera Following
- Out-of-Bounds Check

**Key Methods:**
- `updatePlayerPhysics()` - Gravitation & Movement
- `handleJump()` - Sprung-Logic
- `checkPlatformCollision()` - Kollision mit Plattformen
- `checkOutOfBounds()` - Game Over Check
- `updateCamera()` - Smooth Camera Follow
- `updateAllParticles()` - Partikel-Physik

### useGameRenderer
Canvas Rendering Engine.

**Renders:**
- Background Grid
- Platforms mit Shadows & Highlights
- Player mit Direction Indicator
- Particles (Landing, Combo, Jump)
- HUD (Score, Level, Combo Bar)
- Pause Overlay

**Key Methods:**
- `render()` - Main render function
- `drawPlayer()` - Spieler zeichnen
- `drawPlatforms()` - Alle Plattformen
- `drawHUD()` - Score/Level/Combo Display
- `drawPauseOverlay()` - Pause Screen

### useScoreManager
API Integration für Highscores.

**Features:**
- Score Submission
- Personal Best Tracking
- Rank Calculation
- Error Handling
- Loading States

**Key Methods:**
- `submitScore()` - Score an API senden
- `fetchPersonalBest()` - Best Score laden
- `isNewPersonalBest()` - Check ob neuer PB
- `getRankText()` - Rank-Label (Novice → Legendary)
- `formatScore()` - Score formatieren

### useGameLoop
Main Game Loop mit requestAnimationFrame.

**Orchestrates:**
- Input Processing
- Physics Updates
- Collision Detection
- Score & Combo Logic
- Platform Management
- Particle Updates
- Camera Movement
- Game Over Detection

**Features:**
- 60 FPS Target
- Pause Support
- Performance Optimized
- Cleanup on Unmount

## �🎨 UI Components

### GamePageLayout
3-Spalten Layout (Desktop only):
- **Links:** MarketplaceInfo (Coming Soon)
- **Mitte:** HistoryJumper (Spiel)
- **Rechts:** LeaderboardSidebar (Highscores)

**Features:**
- Fixed Viewport Height
- Blur-Effekt während Gameplay
- Responsive (Mobile: nur Spiel)

### HistoryJumper
Hauptkomponente mit Canvas-Rendering:
- Game Loop Management
- Player Input Handling
- Canvas Rendering
- Score Tracking

### HighscoreTable
Leaderboard mit Filtern:
- All-Time
- Week
- Month  
- My Scores (wallet-specific)

## 🔧 Configuration

### Physics Constants
```typescript
GAME_CONFIG = {
  gravity: 0.8,
  jumpPower: -16,
  moveSpeed: 0.8,
  maxSpeedX: 8,
  friction: 0.85,
}
```

### Visual Constants
```typescript
COLORS = {
  background: '#f8f9fa',
  player: '#3b82f6',
  platformBase: '#6366f1',
  comboGold: '#fbbf24',
}
```

## 🚀 Performance

### Optimierungen
- **Platform Cleanup:** Alte Plattformen werden entfernt
- **Particle Pooling:** Partikel werden recycled
- **Canvas Optimization:** Nur sichtbare Elemente zeichnen
- **RAF Throttling:** Frame-Rate-Limiting bei Bedarf

### Memory Management
- Max 30 sichtbare Plattformen
- Max 100 aktive Partikel
- Cleanup bei Game Over

## 🔌 API Integration

### Endpoints
- `POST /api/game/scores` - Submit Score
- `GET /api/game/scores?type=top&limit=10` - Top Scores
- `GET /api/game/scores?type=user&address=0x...` - User Scores

### Score Submission
```typescript
{
  walletAddress?: string,
  score: number,
  level: number,
  platformsClimbed: number,
  maxCombo: number,
}
```

## 🎯 Future Improvements

### Planned Features
- [ ] Power-Ups (Double Jump, Shield, etc.)
- [ ] Moving Platforms
- [ ] Different Platform Types
- [ ] Daily Challenges
- [ ] Achievements System
- [ ] Replay System
- [ ] Multiplayer Mode

### Technical Debt
- [ ] Extract Hooks (useGameEngine, useGameRenderer)
- [ ] Add Unit Tests
- [ ] Add E2E Tests
- [ ] Performance Profiling
- [ ] Accessibility Improvements

## 📝 Development

### Running Locally
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm run test  # (when implemented)
```

## 🤝 Contributing

1. Benutze TypeScript für neue Features
2. Folge der bestehenden Struktur (types, utils, constants)
3. Dokumentiere neue Functions mit JSDoc
4. Teste vor dem Commit

## 📄 License

Part of nextjs-nft-marketplace-w3i-2.0
