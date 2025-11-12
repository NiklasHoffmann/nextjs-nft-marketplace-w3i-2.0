# Unit Tests für History Towers Game

## Setup

Die Tests verwenden Vitest als Test-Framework. Um die Tests auszuführen, müssen Sie zuerst die Abhängigkeiten installieren:

```bash
npm install -D vitest @vitest/ui @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Fügen Sie dann das Test-Script zur `package.json` hinzu:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Tests ausführen

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Mode
npm test -- --watch

# Tests mit UI
npm run test:ui

# Coverage Report
npm run test:coverage
```

## Test-Struktur

### TowerPhysicsEngine.test.ts
Testet die gesamte Physik-Engine:

- ✅ **getDifficulty()**: Level-Berechnung, Schwierigkeitsanpassung, Safe Platforms
- ✅ **checkCollision()**: Kollisionserkennung zwischen Spieler und Plattformen
- ✅ **getNearbyPlatforms()**: Spatial Partitioning Optimierung
- ✅ **spawnPlatform()**: Plattform-Generierung mit korrekten Eigenschaften
- ✅ **updateMovingPlatforms()**: Bewegung und Bounce-Logik für bewegliche Plattformen

### TowerRenderEngine.test.ts (TODO)
- Canvas-Rendering Tests
- Background Layer Caching
- Window und Brick Synchronisation

### useGameState.test.ts (TODO)
- Alle Reducer Actions
- State Transitions
- Edge Cases

### useGameInput.test.ts (TODO)
- Keyboard Input Handling
- Touch Controls
- Motion Controls
- DeviceOrientation Events

## Hinweise

- Die Tests sind bereits für die tatsächliche API der Engines geschrieben
- Canvas-Mocking ist in `setup.ts` konfiguriert
- Alle Tests verwenden die echten Konstanten aus `gameConstants.ts`
- Platform-Objekte werden mit allen erforderlichen Properties erstellt

## Bekannte Einschränkungen

- Canvas-Rendering kann nur gemockt werden, visuelle Ausgabe nicht testbar
- DeviceOrientation API muss für Motion Control Tests gemockt werden
- Einige Tests für TowerRenderEngine sind optional da sie hauptsächlich visuelle Ausgabe testen
