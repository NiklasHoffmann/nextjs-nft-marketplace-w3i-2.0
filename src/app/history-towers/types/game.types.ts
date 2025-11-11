/**
 * Type Definitions for History Towers Game
 * 
 * Zentrale Type-Definitionen für alle Game-bezogenen Interfaces und Types
 */

/**
 * Plattform im Spiel
 */
export interface Platform {
    /** X-Position (horizontal) */
    x: number;
    /** Y-Position (vertikal) */
    y: number;
    /** Breite der Plattform */
    width: number;
    /** Höhe der Plattform */
    height: number;
    /** Plattform-Nummer (höher = weiter oben) */
    number: number;
    /** Farbe der Plattform */
    color: string;
    /** Vertikaler Offset für Bewegung */
    offset: number;
    /** Ist diese Plattform Teil einer Combo? */
    isCombo?: boolean;
}

/**
 * Partikel-Effekt
 */
export interface Particle {
    /** X-Position */
    x: number;
    /** Y-Position */
    y: number;
    /** Horizontale Geschwindigkeit */
    vx: number;
    /** Vertikale Geschwindigkeit */
    vy: number;
    /** Lebensdauer in Frames */
    life: number;
    /** Farbe des Partikels */
    color: string;
    /** Größe des Partikels */
    size: number;
}

/**
 * Spieler-Zustand
 */
export interface Player {
    /** X-Position */
    x: number;
    /** Y-Position */
    y: number;
    /** Breite */
    width: number;
    /** Höhe */
    height: number;
    /** Horizontale Geschwindigkeit */
    velocityX: number;
    /** Vertikale Geschwindigkeit */
    velocityY: number;
    /** Ist der Spieler auf einer Plattform? */
    onGround: boolean;
    /** Blickrichtung (1 = rechts, -1 = links) */
    direction: number;
}

/**
 * Game State - Kompletter Spielzustand
 */
export interface GameState {
    /** Spieler */
    player: Player;
    /** Alle Plattformen */
    platforms: Platform[];
    /** Alle aktiven Partikel */
    particles: Particle[];
    /** Aktueller Score */
    score: number;
    /** Höchste erreichte Plattform-Nummer */
    highestPlatformNumber: number;
    /** Anzahl der erklommenen Plattformen */
    platformsClimbed: number;
    /** Aktuelle Combo-Zähler */
    combo: number;
    /** Maximale Combo */
    maxCombo: number;
    /** Scroll-Offset der Kamera */
    cameraY: number;
    /** Nächste Plattform-Nummer */
    nextPlatformNumber: number;
    /** Bewegungsrichtung */
    direction: {
        left: boolean;
        right: boolean;
        up: boolean;
    };
}

/**
 * Game Configuration - Einstellungen für Physik und Gameplay
 */
export interface GameConfig {
    /** Gravitation */
    gravity: number;
    /** Sprungkraft */
    jumpPower: number;
    /** Bewegungsgeschwindigkeit */
    moveSpeed: number;
    /** Maximale horizontale Geschwindigkeit */
    maxSpeedX: number;
    /** Luftwiderstand */
    friction: number;
    /** Plattform-Breite (min) */
    minPlatformWidth: number;
    /** Plattform-Breite (max) */
    maxPlatformWidth: number;
    /** Vertikaler Abstand zwischen Plattformen */
    platformGap: number;
    /** Canvas-Breite */
    canvasWidth: number;
    /** Canvas-Höhe */
    canvasHeight: number;
}

/**
 * Score Submit Response von der API
 */
export interface ScoreSubmitResponse {
    /** War die Anfrage erfolgreich? */
    success: boolean;
    /** Ist dieser Score ein neuer Top-Score? */
    isTopScore: boolean;
    /** Position im Leaderboard */
    rank?: number;
    /** Fehlermeldung falls nicht erfolgreich */
    message?: string;
}

/**
 * Game Score aus der Datenbank
 */
export interface GameScore {
    /** MongoDB ID */
    _id: string;
    /** Wallet-Adresse des Spielers */
    walletAddress?: string;
    /** Score */
    score: number;
    /** Level */
    level: number;
    /** Anzahl erklommener Plattformen */
    platformsClimbed: number;
    /** Maximale Combo */
    maxCombo?: number;
    /** Timestamp */
    timestamp: Date;
    /** Session ID */
    sessionId?: string;
}

/**
 * Props für HistoryJumper Component
 */
export interface HistoryJumperProps {
    /** Callback wenn sich der Game-Active-Status ändert */
    onGameStateChange?: (isActive: boolean) => void;
    /** Callback wenn das Leaderboard refresht werden soll */
    onLeaderboardRefresh?: (value: number) => void;
}

/**
 * Touch Button States für Mobile Controls
 */
export interface TouchButtonState {
    /** Links-Button gedrückt? */
    left: boolean;
    /** Rechts-Button gedrückt? */
    right: boolean;
    /** Sprung-Button gedrückt? */
    jump: boolean;
}

/**
 * Keyboard Input State
 */
export interface KeyboardState {
    /** Links-Taste gedrückt? */
    ArrowLeft: boolean;
    /** Rechts-Taste gedrückt? */
    ArrowRight: boolean;
    /** Hoch-Taste gedrückt? */
    ArrowUp: boolean;
    /** Space-Taste gedrückt? */
    Space: boolean;
    /** A-Taste gedrückt? */
    KeyA: boolean;
    /** D-Taste gedrückt? */
    KeyD: boolean;
    /** W-Taste gedrückt? */
    KeyW: boolean;
}
