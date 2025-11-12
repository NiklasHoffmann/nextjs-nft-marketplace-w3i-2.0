/**
 * Tower Render Engine
 * 
 * Handles all rendering for the History Towers game
 * - Brick wall background with scrolling
 * - Tower windows with characters
 * - Platforms with HSL gradient colors
 * - Player character
 * 
 * Extrahiert aus HistoryJumperV2.tsx für bessere Wartbarkeit
 */

import type { Platform, TowerGameState, RenderContext } from '../types/historyTower.types'
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BRICK_WIDTH,
    BRICK_HEIGHT,
    BACKGROUND_SCROLL_SPEED,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    WINDOW_ARCH_HEIGHT,
    WINDOW_SPACING,
    CHARACTER_SIZE_IN_WINDOW,
    COLORS,
    PLATFORM_HEIGHT,
    PLATFORMS_PER_LEVEL,
    BACKGROUND_LAYER_UPDATE_THRESHOLD,
} from '../config/gameConstants'

export class TowerRenderEngine {
    private ctx: CanvasRenderingContext2D
    private width: number
    private height: number
    private windowCharacters: HTMLImageElement[]
    private playerImage: HTMLImageElement | null

    // Layer system for optimized rendering
    private backgroundCanvas: HTMLCanvasElement | null = null
    private backgroundCtx: CanvasRenderingContext2D | null = null
    private lastBackgroundScroll: number = -999 // Force initial render
    private isBackgroundInitialized: boolean = false

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx
        this.width = CANVAS_WIDTH
        this.height = CANVAS_HEIGHT
        this.windowCharacters = []
        this.playerImage = null
    }

    /**
     * Initialize background layer canvas for optimized rendering
     * 
     * Creates an off-screen canvas that caches the tower background (bricks + windows).
     * This canvas is only updated when scroll position changes significantly (>10px),
     * providing substantial performance improvement.
     * 
     * Should be called once during component setup.
     */
    initializeBackgroundLayer(): void {
        if (typeof document !== 'undefined') {
            this.backgroundCanvas = document.createElement('canvas')
            this.backgroundCanvas.width = this.width
            this.backgroundCanvas.height = this.height
            this.backgroundCtx = this.backgroundCanvas.getContext('2d')
            this.isBackgroundInitialized = false
        }
    }

    /**
     * Set window character images for rendering in tower windows
     * 
     * @param images - Array of loaded character images to display in windows
     */
    setWindowCharacters(images: HTMLImageElement[]): void {
        this.windowCharacters = images
    }

    /**
     * Set player character image for rendering
     * 
     * @param image - Loaded player character image (or null for fallback rectangle)
     */
    setPlayerImage(image: HTMLImageElement | null): void {
        this.playerImage = image
    }

    /**
     * Draw rounded rectangle helper
     */
    private drawRoundedRect(x: number, y: number, w: number, h: number, r = 6): void {
        this.ctx.beginPath()
        this.ctx.moveTo(x + r, y)
        this.ctx.arcTo(x + w, y, x + w, y + h, r)
        this.ctx.arcTo(x + w, y + h, x, y + h, r)
        this.ctx.arcTo(x, y + h, x, y, r)
        this.ctx.arcTo(x, y, x + w, y, r)
        this.ctx.closePath()
        this.ctx.fill()
    }

    /**
     * Draw brick wall background with scrolling effect
     * 
     * Creates a repeating brick pattern that scrolls vertically.
     * Uses alternating row offsets for realistic brick wall appearance.
     * Can render to main canvas or background layer.
     * 
     * @param scrollOffset - Vertical scroll offset in pixels
     * @param targetCtx - Optional target context (defaults to main canvas)
     * @private
     */
    private drawBrickWall(scrollOffset: number, cyclePosition: number, targetCtx?: CanvasRenderingContext2D): void {
        const ctx = targetCtx || this.ctx

        // Berechne Brick-Scroll-Offset basierend auf cyclePosition (gleiche Geschwindigkeit wie Fenster)
        // cyclePosition geht von 0 bis WINDOW_SPACING (800)
        // Bricks sollen über die gleiche Strecke scrollen wie Fenster
        const totalWindowHeight = WINDOW_HEIGHT + WINDOW_ARCH_HEIGHT
        const scrollRange = totalWindowHeight + this.height // 1095px
        const brickScrollOffset = (cyclePosition / WINDOW_SPACING) * scrollRange

        // Zeichne Backsteine über gesamte Breite
        for (let y = -BRICK_HEIGHT; y < this.height + BRICK_HEIGHT; y += BRICK_HEIGHT) {
            const rowOffset = Math.floor((y + brickScrollOffset) / BRICK_HEIGHT) % 2 === 0 ? 0 : BRICK_WIDTH / 2
            const brickY = y + (brickScrollOffset % BRICK_HEIGHT) // Plus für nach unten scrollen

            for (let x = -BRICK_WIDTH; x < this.width + BRICK_WIDTH; x += BRICK_WIDTH) {
                const brickX = x + rowOffset

                // Backstein
                ctx.fillStyle = COLORS.brick
                ctx.fillRect(brickX, brickY, BRICK_WIDTH - 2, BRICK_HEIGHT - 2)

                // Fugen (dunkler)
                ctx.strokeStyle = COLORS.brickBorder
                ctx.lineWidth = 2
                ctx.strokeRect(brickX, brickY, BRICK_WIDTH - 2, BRICK_HEIGHT - 2)
            }
        }
    }

    /**
     * Draw tower window with arched top
     * Can be used for both main canvas and background layer
     */
    private drawWindow(windowX: number, windowY: number, targetCtx?: CanvasRenderingContext2D): void {
        const ctx = targetCtx || this.ctx
        ctx.save()

        // Erstelle Fensterform (Rechteck + spitzer Bogen oben)
        ctx.beginPath()
        // Unten links
        ctx.moveTo(windowX, windowY + WINDOW_ARCH_HEIGHT + WINDOW_HEIGHT)
        // Links hoch
        ctx.lineTo(windowX, windowY + WINDOW_ARCH_HEIGHT)
        // Linker Bogen zum Spitz
        ctx.quadraticCurveTo(windowX, windowY, windowX + WINDOW_WIDTH / 2, windowY)
        // Rechter Bogen vom Spitz
        ctx.quadraticCurveTo(windowX + WINDOW_WIDTH, windowY, windowX + WINDOW_WIDTH, windowY + WINDOW_ARCH_HEIGHT)
        // Rechts runter
        ctx.lineTo(windowX + WINDOW_WIDTH, windowY + WINDOW_ARCH_HEIGHT + WINDOW_HEIGHT)
        ctx.closePath()

        // Fenster-Hintergrund
        ctx.fillStyle = COLORS.window.inner
        ctx.fill()

        // Steinrahmen um Fenster
        ctx.strokeStyle = COLORS.window.border
        ctx.lineWidth = 5
        ctx.stroke()

        ctx.restore()
    }

    /**
     * Draw character in window
     * Can be used for both main canvas and background layer
     */
    private drawWindowCharacter(
        windowX: number,
        windowY: number,
        characterIndex: number,
        targetCtx?: CanvasRenderingContext2D
    ): void {
        if (this.windowCharacters.length === 0) return

        const ctx = targetCtx || this.ctx
        const character = this.windowCharacters[characterIndex]
        if (character && character.complete) {
            const charSize = CHARACTER_SIZE_IN_WINDOW
            ctx.drawImage(
                character,
                windowX + (WINDOW_WIDTH - charSize) / 2,
                windowY + WINDOW_ARCH_HEIGHT + (WINDOW_HEIGHT - charSize) / 2 + 10,
                charSize,
                charSize
            )
        }
    }

    /**
     * Draw tower windows with scrolling brick background and character windows
     * 
     * Renders the complete tower background including:
     * - Scrolling brick wall
     * - Windows with arched tops at regular intervals
     * - Character images inside windows
     * 
     * Can render to main canvas or background layer for optimization.
     * 
     * @param backgroundScroll - Current scroll position (player's climb distance)
     * @param targetCtx - Optional target context (defaults to main canvas)
     */
    drawTowerWindows(backgroundScroll: number, targetCtx?: CanvasRenderingContext2D): void {
        const ctx = targetCtx || this.ctx
        const scrollOffset = backgroundScroll * BACKGROUND_SCROLL_SPEED

        // Draw window - should scroll at same speed as bricks
        const totalWindowHeight = WINDOW_HEIGHT + WINDOW_ARCH_HEIGHT
        const windowNumber = Math.floor(scrollOffset / WINDOW_SPACING)

        // Y-Position des aktuellen Fensters
        // cyclePosition gibt uns die Position im aktuellen Cycle (0 bis WINDOW_SPACING)
        const cyclePosition = scrollOffset % WINDOW_SPACING

        // Draw brick wall with same cycle position as window
        this.drawBrickWall(scrollOffset, cyclePosition, ctx)

        // Fenster muss den kompletten Canvas durchscrollen (von -totalWindowHeight bis +height)
        // Gesamte Scrollstrecke: totalWindowHeight + height = 135 + 960 = 1095px
        // Skalierung: cyclePosition (0-800) auf windowY (-135 bis +960)
        const scrollRange = totalWindowHeight + this.height // 1095px
        const windowY = (cyclePosition / WINDOW_SPACING) * scrollRange - totalWindowHeight

        // Fenster zeichnen solange es noch sichtbar ist
        // windowY startet bei -135 (komplett oben) und endet bei 960 (komplett unten)
        const isVisible = windowY < this.height

        if (isVisible) {
            // Zufällige X-Position basierend auf windowNumber (stabil für dieses Fenster)
            const randomSeed = (windowNumber * 12345) % 100
            const minX = 80
            const maxX = this.width - WINDOW_WIDTH - 80
            const windowX = minX + ((randomSeed / 100) * (maxX - minX))

            // Draw window
            this.drawWindow(windowX, windowY, targetCtx)

            // Draw character in window
            if (this.windowCharacters.length > 0) {
                // Verwende (windowNumber + 1) damit wir nie bei Index 0 starten
                const characterIndex = (windowNumber + 1) % this.windowCharacters.length
                this.drawWindowCharacter(windowX, windowY, characterIndex, targetCtx)
            }
        }
    }

    /**
     * Update and draw background layer (optimized rendering)
     * 
     * Only redraws the background layer when scroll position changes significantly
     * (more than BACKGROUND_LAYER_UPDATE_THRESHOLD pixels).
     * Forces initial render on first call.
     * 
     * This optimization reduces expensive brick/window rendering from 60 FPS to ~6 FPS.
     * 
     * @param backgroundScroll - Current scroll position
     * @returns true if background was redrawn, false if cached version is still valid
     */
    updateBackgroundLayer(backgroundScroll: number): boolean {
        if (!this.backgroundCtx || !this.backgroundCanvas) return false

        // Force initial render on first call
        if (!this.isBackgroundInitialized) {
            this.isBackgroundInitialized = true
            this.lastBackgroundScroll = backgroundScroll

            // Clear background layer
            this.backgroundCtx.fillStyle = COLORS.background
            this.backgroundCtx.fillRect(0, 0, this.width, this.height)

            // Draw tower background (bricks and windows)
            this.drawTowerWindows(backgroundScroll, this.backgroundCtx)
            return true
        }

        // Only update if scrolled more than threshold
        const scrollDiff = Math.abs(backgroundScroll - this.lastBackgroundScroll)
        if (scrollDiff < BACKGROUND_LAYER_UPDATE_THRESHOLD) {
            return false
        }

        // Clear background layer
        this.backgroundCtx.fillStyle = COLORS.background
        this.backgroundCtx.fillRect(0, 0, this.width, this.height)

        // Draw tower background (bricks and windows)
        this.drawTowerWindows(backgroundScroll, this.backgroundCtx)

        this.lastBackgroundScroll = backgroundScroll
        return true
    }

    /**
     * Draw the cached background layer to main canvas
     * 
     * Simply copies the pre-rendered background canvas to the main canvas.
     * This is much faster than redrawing bricks and windows every frame.
     */
    drawBackgroundLayer(): void {
        if (this.backgroundCanvas) {
            this.ctx.drawImage(this.backgroundCanvas, 0, 0)
        }
    }

    /**
     * Draw single platform with gradient color and effects
     * 
     * Renders platform with:
     * - HSL rainbow colors (or gold for safe platforms)
     * - Drop shadow
     * - Top highlight
     * - Bottom darkening for 3D effect
     * 
     * @param platform - Platform to render
     */
    drawPlatform(platform: Platform): void {
        const p = platform

        // Hintergrundfarbe basierend auf Plattform-Nummer (HSL Gradient)
        let baseColor: string
        if (p.isSafePlatform) {
            // Goldene Farbe für Level-Plattformen (alle 50)
            baseColor = COLORS.platform.safe
        } else {
            // Regenbogen-Farben für normale Plattformen (HSL)
            const hue = (p.number * 7) % 360
            baseColor = `hsl(${hue}, 70%, 60%)`
        }

        // Schatten
        this.ctx.fillStyle = COLORS.platform.shadow
        this.ctx.fillRect(p.x + 4, p.y + 4, p.w, p.h)

        // Plattform
        this.ctx.fillStyle = baseColor
        this.drawRoundedRect(p.x, p.y, p.w, p.h, 6)

        // Highlight oben
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        this.drawRoundedRect(p.x, p.y, p.w, 4, 6)

        // Dunklerer Rand unten
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        this.drawRoundedRect(p.x, p.y + p.h - 3, p.w, 3, 6)
    }

    /**
     * Draw all platforms in the game
     * 
     * @param platforms - Array of platforms to render
     */
    drawPlatforms(platforms: Platform[]): void {
        platforms.forEach(platform => {
            this.drawPlatform(platform)
        })
    }

    /**
     * Draw level labels on safe platforms (every 50th platform)
     * 
     * Displays "LEVEL X" text with white outline and blue fill on safe platforms.
     * 
     * @param platforms - Array of platforms (only safe platforms get labels)
     */
    drawPlatformLabels(platforms: Platform[]): void {
        this.ctx.save()
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'

        for (const p of platforms) {
            if (p.isSafePlatform) {
                const levelNum = Math.floor(p.number / PLATFORMS_PER_LEVEL) + 1
                this.ctx.font = 'bold 20px ui-sans-serif, system-ui'
                this.ctx.fillStyle = '#1273EB'
                this.ctx.strokeStyle = '#FFFFFF'
                this.ctx.lineWidth = 3
                this.ctx.strokeText(`LEVEL ${levelNum}`, p.x + p.w / 2, p.y + p.h / 2)
                this.ctx.fillText(`LEVEL ${levelNum}`, p.x + p.w / 2, p.y + p.h / 2)
            }
        }

        this.ctx.restore()
    }

    /**
     * Draw player character with loaded image or fallback rectangle
     * 
     * Uses loaded character SVG image if available and complete.
     * Falls back to blue rectangle with shadow if image not loaded.
     * 
     * @param x - Player X position
     * @param y - Player Y position
     * @param w - Player width
     * @param h - Player height
     */
    drawPlayer(x: number, y: number, w: number, h: number): void {
        if (this.playerImage && this.playerImage.complete) {
            // Spielfigur (SVG) - KEIN Schatten, da SVG transparent ist
            this.ctx.drawImage(this.playerImage, x, y, w, h)
        } else {
            // Fallback: Rechteck mit Schatten falls Bild nicht geladen
            this.ctx.fillStyle = COLORS.player.shadow
            this.ctx.fillRect(x + 4, y + 4, w, h)
            this.ctx.fillStyle = '#3b82f6'
            this.ctx.fillRect(x, y, w, h)
        }
    }

    /**
     * Draw UI overlay elements (score and level display)
     * 
     * @param score - Current score to display
     * @param level - Current level to display
     */
    drawUI(score: number, level: number): void {
        // Score
        this.ctx.fillStyle = COLORS.ui.text
        this.ctx.font = 'bold 20px sans-serif'
        this.ctx.fillText(`Score: ${score.toLocaleString()}`, 10, 30)

        // Level
        this.ctx.fillStyle = COLORS.ui.textLight
        this.ctx.font = '16px sans-serif'
        this.ctx.fillText(`Level ${level}`, 10, 55)
    }

    /**
     * Draw game over overlay with semi-transparent background and final stats
     * 
     * @param score - Final score to display
     * @param level - Final level reached
     */
    drawGameOver(score: number, level: number): void {
        // Semi-transparent overlay
        this.ctx.fillStyle = COLORS.ui.overlay
        this.ctx.fillRect(0, 0, this.width, this.height)

        // Game Over Text
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = 'bold 48px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('Game Over', this.width / 2, this.height / 2 - 40)

        // Score
        this.ctx.font = '24px sans-serif'
        this.ctx.fillText(`Score: ${score.toLocaleString()}`, this.width / 2, this.height / 2 + 10)
        this.ctx.fillText(`Level ${level}`, this.width / 2, this.height / 2 + 45)

        this.ctx.textAlign = 'left'
    }

    /**
     * Draw pause overlay with semi-transparent background
     */
    drawPause(): void {
        this.ctx.fillStyle = COLORS.ui.overlay
        this.ctx.fillRect(0, 0, this.width, this.height)

        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = 'bold 48px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('Paused', this.width / 2, this.height / 2)
        this.ctx.textAlign = 'left'
    }

    /**
     * Clear entire canvas to background color
     */
    clear(): void {
        this.ctx.fillStyle = COLORS.background
        this.ctx.fillRect(0, 0, this.width, this.height)
    }
}
