/**
 * Tower Physics Engine
 * 
 * Handles all physics calculations for the History Towers game
 * - Difficulty progression
 * - Platform movement
 * - Collision detection
 * - Platform spawning logic
 * 
 * Extrahiert aus HistoryJumperV2.tsx für bessere Wartbarkeit
 */

import type { Platform, Difficulty } from '@/app/history-towers/types/historyTower.types'
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    GRAVITY,
    JUMP_VELOCITY,
    MOVE_SPEED_BASE,
    MAX_FALL_SPEED,
    PLATFORMS_PER_LEVEL,
    PLAYER_SPEED_INCREASE_PER_LEVEL,
    SPACING_DECREASE_PER_LEVEL,
    MAX_SPACING_DECREASE,
    MIN_PLATFORM_SPACING,
    PLATFORM_MIN_WIDTH_DECREASE,
    PLATFORM_MAX_WIDTH_DECREASE,
    MAX_PLATFORM_WIDTH_DECREASE,
    MIN_PLATFORM_WIDTH,
    MAX_PLATFORM_WIDTH_MIN,
    VERTICAL_MOVEMENT_START_LEVEL,
    VERTICAL_SPEED_BASE,
    VERTICAL_SPEED_INCREASE,
    HORIZONTAL_MOVEMENT_START_LEVEL,
    HORIZONTAL_SPEED_BASE,
    HORIZONTAL_SPEED_INCREASE,
    COLLISION_CHECK_DISTANCE,
} from '@/app/history-towers/config/gameConstants'

export class TowerPhysicsEngine {
    private width: number
    private height: number

    constructor() {
        this.width = CANVAS_WIDTH
        this.height = CANVAS_HEIGHT
    }

    /**
     * Calculate difficulty based on platforms climbed
     * 
     * Calculates progressive difficulty scaling for the game:
     * - Level progression (1 level per 50 platforms)
     * - Player move speed increases with level
     * - Platform spacing decreases (platforms get closer)
     * - Platform width decreases (harder to land)
     * - Vertical platform movement starts at level 2
     * - Horizontal platform movement starts at level 3
     * 
     * @param platformsClimbed - Total number of platforms the player has climbed
     * @returns Difficulty object with all calculated parameters for current level
     * 
     * @example
     * ```typescript
     * const difficulty = physics.getDifficulty(75); // Level 2 (platforms 50-99)
    * devLog.info(difficulty.level); // 2
    * devLog.info(difficulty.platformFallSpeed); // > 0 (vertical movement active)
    * devLog.info(difficulty.horizontalSpeed); // 0 (horizontal movement not yet active)
     * ```
     */
    getDifficulty(platformsClimbed: number): Difficulty {
        // Level alle 50 Plattformen (Level 1 = 0-49, Level 2 = 50-99, etc.)
        const level = Math.floor(platformsClimbed / PLATFORMS_PER_LEVEL) + 1

        // Vertikale Bewegung startet ab Level 2
        let platformFallSpeed = 0
        if (level >= VERTICAL_MOVEMENT_START_LEVEL) {
            const speedIncreases = Math.max(0, Math.floor((level - VERTICAL_MOVEMENT_START_LEVEL) / 2))
            platformFallSpeed = VERTICAL_SPEED_BASE + speedIncreases * VERTICAL_SPEED_INCREASE
        }

        // Horizontale Bewegung startet ab Level 3
        let horizontalSpeed = 0
        if (level >= HORIZONTAL_MOVEMENT_START_LEVEL) {
            const speedIncreases = Math.max(0, Math.floor((level - HORIZONTAL_MOVEMENT_START_LEVEL) / 2))
            horizontalSpeed = HORIZONTAL_SPEED_BASE + speedIncreases * HORIZONTAL_SPEED_INCREASE
        }

        const moveSpeed = MOVE_SPEED_BASE + (level - 1) * PLAYER_SPEED_INCREASE_PER_LEVEL
        const spacing = 80 - Math.min((level - 1) * SPACING_DECREASE_PER_LEVEL, MAX_SPACING_DECREASE)
        const platformMinW = 140 - Math.min((level - 1) * PLATFORM_MIN_WIDTH_DECREASE, MAX_PLATFORM_WIDTH_DECREASE)
        const platformMaxW = 180 - Math.min((level - 1) * PLATFORM_MAX_WIDTH_DECREASE, MAX_PLATFORM_WIDTH_DECREASE)

        return {
            level,
            moveSpeed,
            spacing: Math.max(MIN_PLATFORM_SPACING, spacing),
            platformMinW: Math.max(MIN_PLATFORM_WIDTH, platformMinW),
            platformMaxW: Math.max(MAX_PLATFORM_WIDTH_MIN, platformMaxW),
            platformFallSpeed,
            horizontalSpeed,
        }
    }

    /**
     * Random helper
     */
    private rand(min: number, max: number): number {
        return Math.random() * (max - min) + min
    }

    /**
     * Create initial platforms for game start
     * 
     * Generates 9 static platforms evenly spaced from bottom to top.
     * These platforms provide the initial climbing structure at game start.
     * 
     * @returns Array of Platform objects positioned from bottom to top
     */
    createInitialPlatforms(): Platform[] {
        const platforms: Platform[] = []
        let y = this.height - 80

        for (let i = 0; i < 9; i++) {
            const w = 140
            const x = this.rand(10, this.width - w - 10)
            const direction = Math.random() > 0.5 ? 1 : -1
            platforms.push({
                x,
                y,
                w,
                h: 12,
                vx: 0,
                vy: 0,
                direction,
                counted: false,
                isSafePlatform: false,
                number: i + 1
            })
            y -= 70
        }

        return platforms
    }

    /**
     * Spawn new platform above the current highest platform
     * 
     * Creates a new platform with properties based on:
     * - Platform number (for difficulty scaling and safe platform detection)
     * - Current difficulty level (width, spacing, movement speeds)
     * - Last platform position (for horizontal distance constraints)
     * 
     * Safe platforms (every 50th) are full-width and centered.
     * Normal platforms have constrained horizontal distance from previous platform.
     * 
     * @param platformNumber - Sequential number of this platform (used for difficulty and safe platform detection)
     * @param minY - Current minimum Y position of all platforms
     * @param nextSpawnY - Target Y position for spawning
     * @param lastPlatform - Previous non-safe platform (for horizontal distance calculation)
     * @returns New Platform object with calculated position and properties
     */
    spawnPlatform(
        platformNumber: number,
        minY: number,
        nextSpawnY: number,
        lastPlatform?: Platform
    ): Platform {
        const isSafePlatform = platformNumber % PLATFORMS_PER_LEVEL === 0
        const positionInCycle = platformNumber % PLATFORMS_PER_LEVEL

        const { spacing, platformMinW, platformMaxW, horizontalSpeed, platformFallSpeed } =
            this.getDifficulty(platformNumber)

        // Safe platforms sind volle Breite und mittig
        const w = isSafePlatform ? this.width - 20 : this.rand(platformMinW, platformMaxW)

        // X-Position mit maximaler horizontaler Distanz-Check
        let x: number
        if (isSafePlatform) {
            x = 10 // Safe platforms sind immer mittig
        } else if (lastPlatform && !lastPlatform.isSafePlatform) {
            // Maximale horizontale Sprungweite: ~200px (abhängig von moveSpeed)
            // Bei horizontaler Geschwindigkeit müssen wir mehr Spielraum lassen
            const maxHorizontalDistance = 200

            // Berechne möglichen X-Bereich basierend auf letzter Plattform
            const lastCenterX = lastPlatform.x + lastPlatform.w / 2
            const minX = Math.max(10, lastCenterX - maxHorizontalDistance)
            const maxX = Math.min(this.width - w - 10, lastCenterX + maxHorizontalDistance)

            // Wenn der Bereich zu klein ist (Plattform zu breit), erweitere ihn
            if (maxX - minX < w) {
                x = this.rand(10, this.width - w - 10)
            } else {
                x = this.rand(minX, maxX - w)
            }
        } else {
            // Erste Plattform oder nach Safe Platform: komplett zufällig
            x = this.rand(10, this.width - w - 10)
        }

        // Spacing mit Variance für sanfte Übergänge
        let useSpacing = spacing
        let variance = 0.2

        if (isSafePlatform) {
            const prevLevelSpacing = this.getDifficulty(platformNumber - 1).spacing
            useSpacing = (prevLevelSpacing + spacing) / 2
            variance = 0.05
        } else if (positionInCycle >= 1 && positionInCycle <= 3) {
            useSpacing = this.getDifficulty(platformNumber - positionInCycle).spacing
            variance = 0.1
        } else if (positionInCycle >= 48) {
            variance = 0.1
        }

        const y = (minY === Infinity ? nextSpawnY : minY) -
            this.rand(useSpacing * (1 - variance), useSpacing * (1 + variance))
        const direction = Math.random() > 0.5 ? 1 : -1

        return {
            x,
            y,
            w,
            h: 12,
            vx: isSafePlatform ? 0 : horizontalSpeed,
            vy: isSafePlatform ? 0 : platformFallSpeed,
            direction,
            counted: false,
            isSafePlatform,
            number: platformNumber
        }
    }

    /**
     * Update platform movement for one frame
     * 
     * Applies horizontal and vertical movement to platforms based on their velocity.
     * Platforms bounce when hitting canvas boundaries horizontally.
     * 
     * @param platform - Platform to update
     * @param dt - Delta time in seconds
     * @returns New Platform object with updated position
     */
    updatePlatformMovement(platform: Platform, dt: number): Platform {
        let { x, y, vx, vy, direction } = platform

        // Horizontale Bewegung
        if (vx > 0) {
            x += direction * vx * dt
            // Bounce an Wänden
            if (x <= 0 || x + platform.w >= this.width) {
                direction *= -1
                x = Math.max(0, Math.min(x, this.width - platform.w))
            }
        }

        // Vertikale Bewegung (nach unten)
        if (vy > 0) {
            y += vy * dt
        }

        return { ...platform, x, y, direction }
    }

    /**
     * Filter platforms that are within collision check distance (spatial partitioning)
     * 
     * Performance optimization that reduces collision checks by ~70%.
     * Only returns platforms within COLLISION_CHECK_DISTANCE (200px) of the player.
     * This reduces average checks from 14 platforms to ~4 platforms per frame.
     * 
     * @param platforms - All platforms in the game
     * @param playerY - Current Y position of the player
     * @returns Filtered array of platforms within collision range
     * 
     * @example
     * ```typescript
     * const nearbyPlatforms = physics.getNearbyPlatforms(allPlatforms, player.y);
     * // Instead of checking all 14 platforms, only check ~4 nearby ones
     * for (const platform of nearbyPlatforms) {
     *   if (physics.checkCollision(..., platform)) { ... }
     * }
     * ```
     */
    getNearbyPlatforms(platforms: Platform[], playerY: number): Platform[] {
        return platforms.filter(
            platform => Math.abs(platform.y - playerY) <= COLLISION_CHECK_DISTANCE
        )
    }

    /**
     * Check collision between player and platform (feet-based collision)
     * 
     * Uses optimized feet collision detection (30px width) for better control.
     * Only detects collision when:
     * - Player is moving downward (playerVY > 0)
     * - Player's feet horizontally overlap with platform
     * - Player was above platform in previous frame
     * - Player is now at or below platform top
     * 
     * @param playerX - Player X position
     * @param playerY - Player Y position
     * @param playerW - Player width
     * @param playerH - Player height
     * @param playerVY - Player vertical velocity (positive = falling down)
     * @param platform - Platform to check collision with
     * @returns true if collision detected, false otherwise
     */
    checkCollision(
        playerX: number,
        playerY: number,
        playerW: number,
        playerH: number,
        playerVY: number,
        platform: Platform
    ): boolean {
        if (playerVY <= 0) return false

        // Optimierte Füße-Breite für bessere Kontrolle
        const feetWidth = 30
        const feetOffset = (playerW - feetWidth) / 2 - 10

        const playerFeetLeft = playerX + feetOffset
        const playerFeetRight = playerFeetLeft + feetWidth
        const playerBottom = playerY + playerH

        const platformTop = platform.y
        const platformBottom = platform.y + platform.h
        const platformLeft = platform.x
        const platformRight = platform.x + platform.w

        // Horizontal overlap der Füße
        const overlapX = playerFeetRight > platformLeft && playerFeetLeft < platformRight

        // Vertical overlap (von oben kommend)
        const wasAbove = playerBottom - playerVY <= platformTop
        const isNowBelow = playerBottom >= platformTop && playerBottom < platformBottom

        return overlapX && wasAbove && isNowBelow
    }

    /**
     * Check if player is out of bounds (fell below canvas)
     * 
     * @param playerY - Player Y position
     * @returns true if player has fallen below canvas height
     */
    isOutOfBounds(playerY: number): boolean {
        return playerY > this.height
    }

    /**
     * Clamp player X position with wrap-around at canvas edges
     * 
     * Implements wrap-around behavior: player exits left edge and appears on right edge, and vice versa.
     * 
     * @param playerX - Player X position
     * @param playerW - Player width
     * @returns Clamped X position with wrap-around applied
     */
    clampPlayerX(playerX: number, playerW: number): number {
        // Wrap-around like original
        if (playerX + playerW < 0) return this.width - 1
        if (playerX > this.width) return -playerW + 1
        return playerX
    }

    /**
     * Apply gravity to player vertical velocity
     * 
     * @param vy - Current vertical velocity
     * @param dt - Delta time in seconds
     * @returns New vertical velocity clamped to MAX_FALL_SPEED
     */
    applyGravity(vy: number, dt: number): number {
        return Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED)
    }

    /**
     * Apply horizontal movement based on input
     * 
     * @param vx - Current horizontal velocity
     * @param leftPressed - Is left input active
     * @param rightPressed - Is right input active
     * @param moveSpeed - Current movement speed (from difficulty)
     * @returns New horizontal velocity
     */
    applyHorizontalMovement(
        vx: number,
        leftPressed: boolean,
        rightPressed: boolean,
        moveSpeed: number,
        dt: number
    ): number {
        if (leftPressed) {
            vx -= moveSpeed * dt
        }
        if (rightPressed) {
            vx += moveSpeed * dt
        }

        // Friction
        vx *= 0.9

        return vx
    }

    /**
     * Handle jump
     */
    jump(): number {
        return JUMP_VELOCITY
    }

    /**
     * Calculate score multiplier based on level
     */
    getScoreMultiplier(level: number): number {
        if (level === 1) return 1
        if (level === 2) return 1.5
        return 2
    }
}
