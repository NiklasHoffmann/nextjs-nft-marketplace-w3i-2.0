/**
 * History Towers - Type Definitions
 * 
 * Alle TypeScript Interfaces für das Tower-Game
 */

// ===== PLATFORM =====
export interface Platform {
    x: number
    y: number
    w: number
    h: number
    vx: number  // Horizontal velocity (für bewegliche Plattformen)
    vy: number  // Vertical velocity (für fallende Plattformen)
    direction: number  // 1 or -1 für Bewegungsrichtung
    counted: boolean  // Ob diese Plattform bereits für Score gezählt wurde
    isSafePlatform: boolean  // Jede 50. Plattform (Level-Plattform)
    number: number  // Plattform-Nummer (1, 2, 3, ...)
}

// ===== PLAYER =====
export interface Player {
    x: number
    y: number
    w: number
    h: number
    vx: number  // Horizontal velocity
    vy: number  // Vertical velocity
    grounded: boolean
}

// ===== GAME STATE =====
export interface TowerGameState {
    // Player
    x: number
    y: number
    w: number
    h: number
    vx: number
    vy: number
    grounded: boolean

    // Platforms
    platforms: Platform[]
    nextSpawnY: number
    totalPlatformsSpawned: number

    // Input
    left: boolean
    right: boolean
    jumpPressed: boolean

    // Progress
    distanceClimbed: number
    backgroundScroll: number
    platformsClimbed: number
    highestPlatformNumber: number
}

// ===== DIFFICULTY =====
export interface Difficulty {
    level: number
    moveSpeed: number
    spacing: number
    platformMinW: number
    platformMaxW: number
    platformFallSpeed: number
    horizontalSpeed: number
}

// ===== RENDERING =====
export interface RenderContext {
    ctx: CanvasRenderingContext2D
    width: number
    height: number
}

export interface WindowCharacter {
    image: HTMLImageElement
    path: string
}

export interface LoadedCharacters {
    playerImage: HTMLImageElement
    playerPath: string
    windowImages: HTMLImageElement[]
}

// ===== CONSTANTS (für Type Safety) =====
export type MotionPermission = 'granted' | 'denied' | 'prompt'

export type TouchAction = 'left' | 'right' | 'jump'

// ===== UI STATE =====
export interface GameUIState {
    running: boolean
    paused: boolean
    gameOver: boolean
    score: number
    best: number
    showHighscoreDialog: boolean
    leaderboardRefresh: number
}

// ===== INPUT STATE (exported from useGameInput hook) =====
export interface GameInputState {
    left: boolean
    right: boolean
    jump: boolean
}

export interface MotionControlState {
    enabled: boolean
    permission: MotionPermission
}
