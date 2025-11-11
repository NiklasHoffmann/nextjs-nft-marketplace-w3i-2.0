# Migration Guide: Using Custom Hooks

## Overview

Phase 3 des Refactorings erstellt eine **SimplifiedGame** Komponente als Referenz-Implementierung für die neuen Custom Hooks. Die Original-Komponente `HistoryJumper` bleibt unverändert, da sie zusätzliche Features enthält (Tower-Design, Motion Controls, komplexe Visuals).

## Why Not Migrate Immediately?

**Gründe für schrittweise Migration:**

1. **Feature-Reichhaltigkeit**: HistoryJumper hat viele Custom-Features:
   - Tower-Design mit Fenstern
   - Gyroscope/Motion Controls
   - Komplexe visuelle Effekte
   - Spezielle Animationen

2. **Risiko-Minimierung**: Vollständiger Refactor könnte Features brechen

3. **Referenz-Implementierung**: SimplifiedGame zeigt Best Practices

4. **Flexibilität**: Beide Versionen können koexistieren

## Architecture Comparison

### Old Architecture (HistoryJumper.tsx - 1059 lines)

```typescript
export default function HistoryJumper() {
    // ❌ Alles in einer Komponente
    const [running, setRunning] = useState(false)
    const [paused, setPaused] = useState(false)
    const [score, setScore] = useState(0)
    const [player, setPlayer] = useState({...})
    const [platforms, setPlatforms] = useState([])
    // ... +10 weitere useState

    // ❌ Game loop direkt in useEffect
    useEffect(() => {
        const gameLoop = () => {
            // 500+ Zeilen Game Logic
        }
        requestAnimationFrame(gameLoop)
    }, [...viele deps])

    // ❌ Rendering Logic in Komponente
    function drawPlayer(ctx, player) { ... }
    function drawPlatforms(ctx) { ... }
    // ... viele Drawing Functions

    return <canvas ref={canvasRef} />
}
```

**Probleme:**
- 1059 Zeilen Code
- Schwer zu testen
- Schwer zu warten
- Keine Wiederverwendbarkeit
- Tight coupling

### New Architecture (SimplifiedGame.tsx - 306 lines)

```typescript
export default function SimplifiedGame() {
    // ✅ Nur UI State in Komponente
    const [running, setRunning] = useState(false)
    const [paused, setPaused] = useState(false)
    const [gameOver, setGameOver] = useState(false)

    // ✅ Game State in Custom Hook
    const gameState = useGameState()
    
    // ✅ Input Management in Hook
    const input = useGameInput()
    
    // ✅ Physics in Hook
    const physics = useGamePhysics()
    
    // ✅ Rendering in Hook
    const renderer = useGameRenderer(canvasRef)
    
    // ✅ API in Hook
    const scoreManager = useScoreManager({ walletAddress: address })
    
    // ✅ Game Loop in Hook
    useGameLoop({
        gameState: gameState.gameState,
        isRunning: running && !gameOver,
        isPaused: paused,
        onUpdate: gameState.batchUpdate,
        // ... callbacks
    })

    return <canvas ref={canvasRef} />
}
```

**Vorteile:**
- 306 Zeilen (71% weniger)
- Separation of Concerns
- Testbar
- Wiederverwendbar
- Wartbar

## Hook Usage Guide

### 1. useGameState

**Verwaltet:** Player, Platforms, Particles, Score, Combo, Camera

```typescript
const gameState = useGameState()

// Zugriff auf State
gameState.gameState.player.x
gameState.gameState.score
gameState.gameState.combo

// State Updates
gameState.updatePlayer({ x: 100, y: 200 })
gameState.updateScore(50)
gameState.updateCombo(5)
gameState.addPlatforms([...])
gameState.resetGame()

// Performance Optimization
gameState.batchUpdate({
    player: { x: 100, y: 200 },
    score: 500,
    combo: 3
})
```

### 2. useGameInput

**Verwaltet:** Keyboard & Touch Input

```typescript
const input = useGameInput()

// Check Input State
if (input.isMovingLeft()) { ... }
if (input.isMovingRight()) { ... }
if (input.isJumping()) { ... }

// Touch Controls
input.handleTouchButton('left', true)
input.handleTouchButton('jump', false)

// Reset
input.resetInput()
```

### 3. useGamePhysics

**Verwaltet:** Gravity, Movement, Collision, Camera

```typescript
const physics = useGamePhysics()

// Physics Update
const updated = physics.updatePlayerPhysics(
    gameState.gameState.player,
    input.isMovingLeft(),
    input.isMovingRight()
)

// Jump
const jumped = physics.handleJump(updated)

// Collision Detection
const { player, landedPlatform } = physics.checkPlatformCollision(
    jumped,
    gameState.gameState.platforms
)

// Game Over Check
if (physics.checkOutOfBounds(player, gameState.gameState.cameraY)) {
    handleGameOver()
}

// Camera Update
const newCameraY = physics.updateCamera(
    gameState.gameState.cameraY,
    player.y
)
```

### 4. useGameRenderer

**Verwaltet:** Canvas Drawing

```typescript
const renderer = useGameRenderer(canvasRef)

// Render Frame
useEffect(() => {
    if (!running) return
    
    const animate = () => {
        renderer.render(gameState.gameState, paused)
        requestAnimationFrame(animate)
    }
    
    const frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
}, [running, paused, gameState.gameState, renderer])
```

### 5. useScoreManager

**Verwaltet:** API Calls, Personal Best

```typescript
const scoreManager = useScoreManager({
    walletAddress: address
})

// Check Personal Best
if (scoreManager.isNewPersonalBest(score)) {
    // Show celebration
}

// Submit Score
await scoreManager.submitScore(
    score,
    level,
    platforms,
    combo
)

// Format Score
const formatted = scoreManager.formatScore(12345) // "12,345"

// Get Rank
const rank = scoreManager.getRankText(5000) // "Expert"
```

### 6. useGameLoop

**Verwaltet:** Main Game Loop

```typescript
useGameLoop({
    gameState: gameState.gameState,
    isRunning: running && !gameOver,
    isPaused: paused,
    
    // Callbacks
    onUpdate: gameState.batchUpdate,
    onGameOver: handleGameOver,
    
    // State Updates
    updatePlayer: gameState.updatePlayer,
    addParticles: gameState.addParticles,
    updateScore: gameState.updateScore,
    updateCombo: gameState.updateCombo,
    resetCombo: gameState.resetCombo,
    updateHighestPlatform: gameState.updateHighestPlatform,
    updateCameraY: gameState.updateCameraY,
    updatePlatforms: gameState.updatePlatforms,
    updateParticles: gameState.updateParticles,
    
    // Physics
    checkPlatformCollision: physics.checkPlatformCollision,
    updatePlayerPhysics: physics.updatePlayerPhysics,
    handleJump: physics.handleJump,
    checkOutOfBounds: physics.checkOutOfBounds,
    updateCamera: physics.updateCamera,
    updateAllParticles: physics.updateAllParticles,
    
    // Input
    isMovingLeft: input.isMovingLeft,
    isMovingRight: input.isMovingRight,
    isJumping: input.isJumping,
})
```

## Migration Steps (Future)

Wenn HistoryJumper migriert werden soll:

### Step 1: Backup

```bash
cp src/app/history-towers/components/HistoryJumper.tsx \
   src/app/history-towers/components/HistoryJumper.backup.tsx
```

### Step 2: Update Imports

```typescript
// REMOVE
import { CANVAS_WIDTH, GRAVITY, ... } from '../config/gameConstants'

// ADD
import {
    useGameState,
    useGameInput,
    useGamePhysics,
    useGameRenderer,
    useScoreManager,
    useGameLoop,
} from '../hooks'
import { GAME_CONFIG, COLORS } from '../constants'
```

### Step 3: Replace State

```typescript
// REMOVE
const [score, setScore] = useState(0)
const [player, setPlayer] = useState({...})
const [platforms, setPlatforms] = useState([])
// ... etc

// ADD
const gameState = useGameState()
```

### Step 4: Replace Input

```typescript
// REMOVE
const [keys, setKeys] = useState({...})
useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    // ...
}, [])

// ADD
const input = useGameInput()
```

### Step 5: Replace Physics

```typescript
// REMOVE
function updatePhysics() {
    // ... 200+ Zeilen
}

// ADD
const physics = useGamePhysics()
```

### Step 6: Replace Rendering

```typescript
// REMOVE
function drawPlayer(ctx, player) { ... }
function drawPlatforms(ctx) { ... }
// ... etc

// ADD
const renderer = useGameRenderer(canvasRef)
```

### Step 7: Replace Game Loop

```typescript
// REMOVE
useEffect(() => {
    const gameLoop = () => {
        // ... 500+ Zeilen
    }
    animationFrameRef.current = requestAnimationFrame(gameLoop)
}, [...])

// ADD
useGameLoop({
    gameState: gameState.gameState,
    isRunning: running,
    // ... callbacks
})
```

### Step 8: Test Thoroughly

- [ ] Game starts
- [ ] Movement works
- [ ] Jump works
- [ ] Collision works
- [ ] Score increases
- [ ] Combo works
- [ ] Particles render
- [ ] Game over works
- [ ] Score submission works
- [ ] Pause works

## Current Status

### ✅ Completed

1. **Phase 1 - Utilities** (Committed: 025aa2c)
   - types/
   - constants/
   - utils/
   - ARCHITECTURE.md

2. **Phase 2 - Custom Hooks** (Committed: 4e1174d, 6f6581e)
   - hooks/useGameState.ts
   - hooks/useGameInput.ts
   - hooks/useGamePhysics.ts
   - hooks/useGameRenderer.ts
   - hooks/useScoreManager.ts
   - hooks/useGameLoop.ts

3. **Phase 3 - Demo Component** (Current)
   - components/SimplifiedGame.tsx (306 lines)
   - MIGRATION_GUIDE.md (this file)

### 📦 Files

```
src/app/history-towers/
├── components/
│   ├── HistoryJumper.tsx          # Original (1059 lines) ✅ Unverändert
│   ├── HistoryJumper.backup.tsx   # Backup ✅
│   └── SimplifiedGame.tsx          # Demo (306 lines) ✅ NEU
├── hooks/                          # ✅ 6 Custom Hooks
├── types/                          # ✅ TypeScript Types
├── constants/                      # ✅ Game Config
├── utils/                          # ✅ Utilities
├── ARCHITECTURE.md                 # ✅ Documentation
└── MIGRATION_GUIDE.md             # ✅ This File
```

## Testing SimplifiedGame

### Option 1: Temporary Page

```typescript
// src/app/history-towers-demo/page.tsx
import SimplifiedGame from '../history-towers/components/SimplifiedGame'

export default function DemoPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">
                History Towers - Hook Demo
            </h1>
            <SimplifiedGame />
        </div>
    )
}
```

### Option 2: Swap in page.tsx

```typescript
// Temporarily replace HistoryJumper with SimplifiedGame
import SimplifiedGame from './components/SimplifiedGame'

// In JSX:
<SimplifiedGame
    onGameStateChange={handleGameStateChange}
    onLeaderboardRefresh={() => setLeaderboardKey(prev => prev + 1)}
/>
```

## Benefits of New Architecture

### Code Size
- **HistoryJumper**: 1059 lines
- **SimplifiedGame**: 306 lines
- **Reduction**: 71%

### Maintainability
- ✅ Separation of Concerns
- ✅ Single Responsibility
- ✅ Easier to understand
- ✅ Easier to debug

### Testability
- ✅ Hooks können isoliert getestet werden
- ✅ Mock dependencies einfach
- ✅ Unit tests für jede Funktion

### Reusability
- ✅ Hooks in anderen Projekten verwendbar
- ✅ Different game modes möglich
- ✅ Alternative UIs einfach

### Performance
- ✅ `batchUpdate()` für mehrere State-Changes
- ✅ Ref-based state für Game Loop
- ✅ Optimierte Rendering

## Future Enhancements

### Short Term
- [ ] Add unit tests for hooks
- [ ] Add storybook stories
- [ ] Performance benchmarks

### Medium Term
- [ ] Migrate Tower-Design to hook
- [ ] Migrate Motion Controls to hook
- [ ] Create useGameAudio hook

### Long Term
- [ ] Complete migration of HistoryJumper
- [ ] Extract hooks to separate package
- [ ] Create game engine framework

## Conclusion

Die Custom Hook Architecture bietet:

1. **Cleaner Code**: 71% weniger Zeilen
2. **Better Structure**: Separation of Concerns
3. **Testability**: Isolated units
4. **Reusability**: Hooks überall verwendbar
5. **Maintainability**: Einfacher zu verstehen und debuggen

SimplifiedGame dient als **Proof of Concept** und **Referenz-Implementierung**. Die Original-Komponente kann schrittweise migriert werden, wenn gewünscht.
