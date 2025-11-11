'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import HighscoreDialog from './HighscoreDialog'
import {
    useGameState,
    useGameInput,
    useGamePhysics,
    useGameRenderer,
    useScoreManager,
} from '../hooks'
import { GAME_CONFIG, COLORS } from '../constants'
import type { Platform as PlatformType } from '../types'

// Tower-specific constants (keep for now)
const CANVAS_WIDTH = GAME_CONFIG.canvasWidth
const CANVAS_HEIGHT = GAME_CONFIG.canvasHeight
const GRAVITY = GAME_CONFIG.gravity
const JUMP_VELOCITY = GAME_CONFIG.jumpPower
const MOVE_SPEED_BASE = GAME_CONFIG.moveSpeed
const MAX_FALL_SPEED = 20 // Tower-specific max fall speed

// Tower design constants (unique to this component)
const BRICK_WIDTH = 40
const BRICK_HEIGHT = 20
const BACKGROUND_SCROLL_SPEED = 0.5
const WINDOW_WIDTH = 60
const WINDOW_HEIGHT = 80
const WINDOW_ARCH_HEIGHT = 20
const WINDOW_SPACING = 100
const CHARACTER_SIZE_IN_WINDOW = 50
const PLATFORMS_PER_LEVEL = 50

// Tower-specific colors
const TOWER_COLORS = {
    brick: '#8B4513',
    brickBorder: '#654321',
    window: {
        inner: '#87CEEB',
        border: '#DAA520',
    },
}

// Available character images for tower windows
const AVAILABLE_CHARACTERS = [
    '/media/game/character1.png',
    '/media/game/character2.png',
    '/media/game/character3.png',
    '/media/game/character4.png',
    '/media/game/character5.png',
    '/media/game/character6.png',
    '/media/game/character7.png',
    '/media/game/character8.png',
]

interface HistoryJumperProps {
    onGameStateChange?: (isActive: boolean) => void;
    onLeaderboardRefresh?: (trigger: number) => void;
}

export default function HistoryJumper({ onGameStateChange, onLeaderboardRefresh }: HistoryJumperProps = {}) {
    const { address } = useAccount()
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 6) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
        ctx.fill()
    }

    function drawTowerWindows(ctx: CanvasRenderingContext2D, s: typeof stateRef.current) {
        // Zeichne backsteinige Wand über den gesamten Hintergrund (scrollen nach unten)
        const scrollOffset = s.backgroundScroll * BACKGROUND_SCROLL_SPEED

        // Zeichne Backsteine über gesamte Breite
        for (let y = -BRICK_HEIGHT; y < HEIGHT + BRICK_HEIGHT; y += BRICK_HEIGHT) {
            const rowOffset = Math.floor((y + scrollOffset) / BRICK_HEIGHT) % 2 === 0 ? 0 : BRICK_WIDTH / 2
            const brickY = y + (scrollOffset % BRICK_HEIGHT) // Plus für nach unten scrollen

            for (let x = -BRICK_WIDTH; x < WIDTH + BRICK_WIDTH; x += BRICK_WIDTH) {
                const brickX = x + rowOffset

                // Backstein
                ctx.fillStyle = TOWER_COLORS.brick
                ctx.fillRect(brickX, brickY, BRICK_WIDTH - 2, BRICK_HEIGHT - 2)

                // Fugen (dunkler)
                ctx.strokeStyle = TOWER_COLORS.brickBorder
                ctx.lineWidth = 2
                ctx.strokeRect(brickX, brickY, BRICK_WIDTH - 2, BRICK_HEIGHT - 2)
            }
        }

        // Zeichne spitzbogiges Burgfenster (größer)
        const totalWindowHeight = WINDOW_HEIGHT + WINDOW_ARCH_HEIGHT

        // Berechne Position basierend auf backgroundScroll (synchron mit Backsteinwand)
        const scrollPosition = s.backgroundScroll * BACKGROUND_SCROLL_SPEED // Gleiche Geschwindigkeit wie Backsteine
        const cyclePosition = scrollPosition % WINDOW_SPACING
        const currentWindowIndex = Math.floor(scrollPosition / WINDOW_SPACING)

        // Zufällige X-Position für jedes Fenster (aber konsistent für denselben Index)
        // Verwende currentWindowIndex als Seed für pseudo-zufällige Position
        const randomSeed = (currentWindowIndex * 12345) % 100
        const minX = 80
        const maxX = WIDTH - WINDOW_WIDTH - 80
        const windowX = minX + ((randomSeed / 100) * (maxX - minX))

        // Berechne Y-Position - das Fenster scrollt von oben (-totalWindowHeight) bis komplett unten raus (HEIGHT)
        // Der komplette Scroll-Bereich ist totalWindowHeight + HEIGHT
        const scrollRange = totalWindowHeight + HEIGHT + 50 // Extra Puffer
        const windowY = (cyclePosition / WINDOW_SPACING) * scrollRange - totalWindowHeight

        // Zeichne nur wenn das Fenster sichtbar ist
        if (windowY + totalWindowHeight > 0 && windowY < HEIGHT) {
            // Zeichne spitzbogiges Fenster mit Path
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

            // Fenster-Hintergrund mit bg-primary (#FFF9E2)
            ctx.fillStyle = TOWER_COLORS.window.inner
            ctx.fill()

            // Steinrahmen um Fenster
            ctx.strokeStyle = TOWER_COLORS.window.border
            ctx.lineWidth = 5
            ctx.stroke()

            ctx.restore()

            // Zeichne zufällige Figur im Fenster (noch größer)
            if (windowCharactersRef.current.length > 0) {
                const characterIndex = currentWindowIndex % windowCharactersRef.current.length
                const character = windowCharactersRef.current[characterIndex]

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
        }
    }

    const rafRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number | null>(null)
    const playerImageRef = useRef<HTMLImageElement | null>(null)
    const playerCharacterPath = useRef<string>('')  // Speichert den Pfad der Spielfigur
    const windowCharactersRef = useRef<HTMLImageElement[]>([])

    // UI State (keep in component)
    const [running, setRunning] = useState(false)
    const [paused, setPaused] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [showHighscoreDialog, setShowHighscoreDialog] = useState(false)
    const [motionEnabled, setMotionEnabled] = useState(false)
    const [motionPermission, setMotionPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

    // Score State (Tower has custom score system based on distanceClimbed)
    const [score, setScore] = useState(0)

    // Custom Hooks - Game State Management
    const gameState = useGameState()
    const input = useGameInput()
    const scoreManager = useScoreManager({ walletAddress: address })

    // Tower-specific state (keep for now - contains backgroundScroll, etc.)
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0)

    // Notify parent component about game state changes
    useEffect(() => {
        onGameStateChange?.(running);
    }, [running, onGameStateChange]);

    // Notify parent component about leaderboard refresh
    useEffect(() => {
        onLeaderboardRefresh?.(leaderboardRefresh);
    }, [leaderboardRefresh, onLeaderboardRefresh]);

    // Canvas & Game Constants (imported from gameConstants.ts)
    const WIDTH = CANVAS_WIDTH
    const HEIGHT = CANVAS_HEIGHT

    // Physics Constants (imported from gameConstants.ts)
    // GRAVITY, JUMP_VELOCITY, MOVE_SPEED_BASE, MAX_FALL_SPEED

    type Platform = {
        x: number
        y: number
        w: number
        h: number
        vx: number  // horizontal velocity
        vy: number  // vertical velocity (fall speed)
        direction: number  // 1 or -1 for movement direction
        counted: boolean  // Track if this platform was counted
        isSafePlatform: boolean  // Jede 50. Plattform (Level-Plattform)
        number: number  // Plattform-Nummer (1, 2, 3, ...)
    }

    const stateRef = useRef({
        x: WIDTH / 2 - 33,
        y: HEIGHT - 80,
        w: 80,
        h: 80,
        vx: 0,
        vy: 0,
        grounded: true,
        platforms: [] as Platform[],
        nextSpawnY: HEIGHT - 140,
        left: false,
        right: false,
        jumpPressed: false,
        distanceClimbed: 0,
        backgroundScroll: 0,
        platformsClimbed: 0,  // Zähler für erreichte Plattformen
        highestPlatformNumber: 0,  // Höchste erreichte Plattform-Nummer (für Level-Anzeige)
        totalPlatformsSpawned: 0,  // Gesamtzahl aller gespawnten Plattformen
    })

    const rand = (min: number, max: number) => Math.random() * (max - min) + min

    function resetGame() {
        const s = stateRef.current

        // Create platforms (no ground platform - canvas bottom is the ground)
        s.platforms = []

        let y = HEIGHT - 80
        for (let i = 0; i < 9; i++) {
            const w = 140
            const x = rand(10, WIDTH - w - 10)
            const direction = Math.random() > 0.5 ? 1 : -1
            s.platforms.push({ x, y, w, h: 12, vx: 0, vy: 0, direction, counted: false, isSafePlatform: false, number: i + 1 })
            y -= 70
        }

        // Position player at canvas bottom
        s.x = WIDTH / 2 - 33  // w/2 for centering (66/2 = 33)
        s.y = HEIGHT - 66     // Player height is 66, so position exactly at canvas bottom
        s.vx = 0
        s.vy = 0
        s.grounded = true

        s.nextSpawnY = y
        s.distanceClimbed = 0
        s.backgroundScroll = 0
        s.platformsClimbed = 0  // Reset platform counter
        s.highestPlatformNumber = 0  // Reset highest platform number
        s.totalPlatformsSpawned = 9  // Wir haben 9 Plattformen erstellt
        s.left = false
        s.right = false
        s.jumpPressed = false
        setScore(0)
    }

    function getDifficulty(platformsClimbed: number) {
        // Level alle 50 Plattformen (Level 1 = 0-49, Level 2 = 50-99, Level 3 = 100-149, etc.)
        const level = Math.floor(platformsClimbed / 50) + 1  // Level beginnt bei 1

        // Vertikale Bewegung startet ab Level 2 (Plattform 50)
        // Wird schneller bei Level 4, 6, 8, 10... (alle geraden Levels ab 4)
        let platformFallSpeed = 0
        if (level >= 2) {  // Ab Level 2 (Plattform 50)
            // Anzahl der Geschwindigkeitserhöhungen: Bei Level 4, 6, 8, 10...
            const speedIncreases = Math.max(0, Math.floor((level - 2) / 2))  // 0, 0, 1, 1, 2, 2, 3, 3...
            platformFallSpeed = 15 + speedIncreases * 8  // Start 15 bei Level 2, +8 bei Level 4, 6, 8...
        }

        // Horizontale Bewegung startet ab Level 3 (Plattform 100)
        // Wird schneller bei Level 5, 7, 9, 11... (alle ungeraden Levels ab 5)
        let horizontalSpeed = 0
        if (level >= 3) {  // Ab Level 3 (Plattform 100)
            // Anzahl der Geschwindigkeitserhöhungen: Bei Level 5, 7, 9, 11...
            const speedIncreases = Math.max(0, Math.floor((level - 3) / 2))  // 0, 0, 1, 1, 2, 2, 3, 3...
            horizontalSpeed = 20 + speedIncreases * 10  // Start 20 bei Level 3, +10 bei Level 5, 7, 9...
        }

        const moveSpeed = MOVE_SPEED_BASE + (level - 1) * 6  // Spieler-Geschwindigkeit
        const spacing = 80 - Math.min((level - 1) * 2, 30)
        const minSpacing = 48
        const platformMinW = 140 - Math.min((level - 1) * 4, 60)
        const platformMaxW = 180 - Math.min((level - 1) * 3, 60)

        return {
            level,
            moveSpeed,
            spacing: Math.max(minSpacing, spacing),
            platformMinW: Math.max(70, platformMinW),
            platformMaxW: Math.max(100, platformMaxW),
            platformFallSpeed,
            horizontalSpeed,
        }
    }

    function spawnPlatformsIfNeeded() {
        const s = stateRef.current

        let minY = Infinity
        s.platforms.forEach(p => {
            if (p.y < minY) minY = p.y
        })

        while (s.platforms.length < 14 || minY > -60) {
            // Verwende den globalen Counter für die Plattform-Nummer
            s.totalPlatformsSpawned++
            const platformNumber = s.totalPlatformsSpawned

            // Jede 50. Plattform ist eine sichere Level-Plattform (Plattform 50, 100, 150, etc.)
            const isSafePlatform = platformNumber % 50 === 0

            // Position im 50er-Zyklus
            const positionInCycle = platformNumber % 50

            // Berechne Schwierigkeit basierend auf der PLATTFORM-NUMMER
            const { spacing, platformMinW, platformMaxW, horizontalSpeed, platformFallSpeed } = getDifficulty(platformNumber)

            // Safe platforms sind volle Breite und mittig
            const w = isSafePlatform ? WIDTH - 20 : rand(platformMinW, platformMaxW)
            const x = isSafePlatform ? 10 : rand(10, WIDTH - w - 10)

            // Spacing-Logik für sanfte Level-Übergänge:
            // - Plattformen 48, 49 vor goldener Plattform: Verwende alten Level-Spacing
            // - Goldene Plattform (0): Durchschnitt zwischen alt und neu
            // - Plattformen 1, 2, 3 nach goldener Plattform: Verwende alten Level-Spacing
            // - Ab Plattform 4: Normaler neuer Level-Spacing
            let useSpacing = spacing
            let variance = 0.2 // Standard Varianz (±20%)

            if (isSafePlatform) {
                // Goldene Plattform: Durchschnitt zwischen vorherigem und neuem Level
                const prevLevelSpacing = getDifficulty(platformNumber - 1).spacing
                useSpacing = (prevLevelSpacing + spacing) / 2
                variance = 0.05 // Sehr geringe Varianz (±5%)
            } else if (positionInCycle >= 1 && positionInCycle <= 3) {
                // Plattformen 1, 2, 3 nach goldener Plattform: Verwende vorherigen Level
                // um sanften Übergang zum neuen Schwierigkeitsgrad zu ermöglichen
                useSpacing = getDifficulty(platformNumber - positionInCycle).spacing
                variance = 0.1 // Reduzierte Varianz (±10%)
            } else if (positionInCycle >= 48) {
                // Plattformen 48, 49 vor goldener Plattform
                variance = 0.1 // Reduzierte Varianz (±10%)
            }

            const y = (minY === Infinity ? s.nextSpawnY : minY) - rand(useSpacing * (1 - variance), useSpacing * (1 + variance))
            const direction = Math.random() > 0.5 ? 1 : -1

            s.platforms.push({
                x,
                y,
                w,
                h: 12,
                vx: isSafePlatform ? 0 : horizontalSpeed,  // Safe platforms bewegen sich nicht horizontal
                vy: isSafePlatform ? 0 : platformFallSpeed,  // Safe platforms bewegen sich nicht vertikal
                direction,
                counted: false,
                isSafePlatform,
                number: platformNumber
            })
            minY = y
        }
    }

    function draw(ctx: CanvasRenderingContext2D) {
        const s = stateRef.current

        // Background mit secondary color (#1273EB)
        ctx.fillStyle = '#1273EB'
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        // Hintergrund scrollt mit der Höhe des Spielers (distanceClimbed)
        // So bewegt sich der Hintergrund nur, wenn der Spieler höher klettert
        s.backgroundScroll = s.distanceClimbed

        // Keine extra Level-Linien mehr - die goldenen Safe-Plattformen sind die Level-Markierungen!

        // Zeichne Steinturm-Hintergrund mit Fenstern
        drawTowerWindows(ctx, s)

        // Platforms mit primary color (#FFF9E2)
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 4
        for (const p of s.platforms) {
            // Safe platforms (jede 50.) in gold/orange, normale in cream
            if (p.isSafePlatform) {
                ctx.fillStyle = '#FFD700'  // Gold für Level-Plattformen
                ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'
                ctx.shadowBlur = 12
            } else {
                ctx.fillStyle = '#FFF9E2'  // Cream für normale Plattformen
                ctx.shadowColor = 'rgba(0,0,0,0.3)'
                ctx.shadowBlur = 8
            }
            drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 6)
        }
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        // Level-Anzeige nur auf goldenen Plattformen
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        for (const p of s.platforms) {
            if (p.isSafePlatform) {
                // Level-Nummer auf Safe Platforms (LEVEL X)
                // Plattform 50 = LEVEL 2, Plattform 100 = LEVEL 3, etc.
                const levelNum = Math.floor(p.number / 50) + 1
                ctx.font = 'bold 20px ui-sans-serif, system-ui'
                ctx.fillStyle = '#1273EB'  // Blauer Text auf goldener Plattform
                ctx.strokeStyle = '#FFFFFF'
                ctx.lineWidth = 3
                ctx.strokeText(`LEVEL ${levelNum}`, p.x + p.w / 2, p.y + p.h / 2)
                ctx.fillText(`LEVEL ${levelNum}`, p.x + p.w / 2, p.y + p.h / 2)
            }
            // Normale Plattformen haben keine Nummer mehr
        }
        ctx.restore()

        // Player - draw SVG image
        ctx.save()
        ctx.translate(s.x + s.w / 2, s.y + s.h / 2)
        const tilt = Math.max(-0.3, Math.min(0.3, s.vx / 600))
        ctx.rotate(tilt)

        if (playerImageRef.current && playerImageRef.current.complete) {
            // Draw the SVG image
            ctx.drawImage(
                playerImageRef.current,
                -s.w / 2,
                -s.h / 2,
                s.w,
                s.h
            )
        } else {
            // Fallback: draw rectangle if image not loaded
            ctx.shadowColor = 'rgba(0,0,0,0.4)'
            ctx.shadowBlur = 10
            ctx.shadowOffsetY = 5
            ctx.fillStyle = '#f59e0b'
            drawRoundedRect(ctx, -s.w / 2, -s.h / 2, s.w, s.h, 8)
            ctx.shadowBlur = 0
            ctx.shadowOffsetY = 0
        }

        ctx.restore()
    }

    function step(dt: number) {
        const s = stateRef.current
        const { moveSpeed } = getDifficulty(s.platformsClimbed)

        // Move platforms (horizontal AND vertical)
        for (const p of s.platforms) {
            // Horizontal movement (only if horizontalSpeed > 0 AND not a safe platform)
            if (p.vx > 0 && !p.isSafePlatform) {
                p.x += p.vx * p.direction * dt

                // Bounce off edges
                if (p.x <= 0) {
                    p.x = 0
                    p.direction = 1
                } else if (p.x + p.w >= WIDTH) {
                    p.x = WIDTH - p.w
                    p.direction = -1
                }
            }

            // Vertical movement (platforms fall down) - Verwende gespeicherte vy
            if (p.vy > 0 && !p.isSafePlatform) {
                p.y += p.vy * dt
            }
        }

        const accel = moveSpeed * 3
        if (s.left && !s.right) s.vx -= accel * dt
        else if (s.right && !s.left) s.vx += accel * dt
        else s.vx *= 0.9

        const maxVx = moveSpeed
        if (s.vx > maxVx) s.vx = maxVx
        if (s.vx < -maxVx) s.vx = -maxVx

        s.vy += GRAVITY * dt
        if (s.vy > MAX_FALL_SPEED) s.vy = MAX_FALL_SPEED

        if (s.jumpPressed && s.grounded) {
            s.vy = JUMP_VELOCITY
            s.grounded = false
        }

        s.x += s.vx * dt
        s.y += s.vy * dt

        if (s.x + s.w < 0) s.x = WIDTH - 1
        if (s.x > WIDTH) s.x = -s.w + 1

        let wasGrounded = false

        // Check platform collisions
        // Die Figur ist 80px breit, aber die Füße sind nur ~20px in der Mitte
        // Die Füße scheinen leicht nach links versetzt zu sein
        const feetWidth = 20  // Breite der Füße
        const feetOffset = (s.w - feetWidth) / 2 - 10  // Offset von der linken Seite (10px nach links)
        const feetLeft = s.x + feetOffset  // Linke Seite der Füße
        const feetRight = feetLeft + feetWidth  // Rechte Seite der Füße

        if (s.vy >= 0) {
            for (const p of s.platforms) {
                const playerBottom = s.y + s.h
                // Nur die Füße zählen für die Kollision, nicht der ganze Körper
                const willOverlapX = feetRight > p.x && feetLeft < p.x + p.w
                const isNearPlatform = playerBottom >= p.y && playerBottom <= p.y + p.h + 5

                if (willOverlapX && isNearPlatform) {
                    s.y = p.y - s.h
                    s.vy = 0
                    s.grounded = true
                    wasGrounded = true

                    // Increment platformsClimbed if this platform hasn't been counted yet
                    if (!p.counted) {
                        p.counted = true
                        s.platformsClimbed++
                        // Update highest platform number for level display
                        if (p.number > s.highestPlatformNumber) {
                            s.highestPlatformNumber = p.number
                        }
                    }

                    // Move player with the platform
                    s.x += p.vx * p.direction * dt
                    break
                }
            }

            // Check if player fell to canvas bottom (game over if climbed already)
            if (!wasGrounded) {
                const playerBottom = s.y + s.h
                if (playerBottom >= HEIGHT) {
                    // Only allow landing at bottom at game start (distance = 0)
                    if (s.distanceClimbed > 5) {
                        // Player fell back down - game over
                        endGame()
                        return
                    } else {
                        // Game start - allow landing
                        s.y = HEIGHT - s.h
                        s.vy = 0
                        s.grounded = true
                        wasGrounded = true
                    }
                }
            }
        }

        if (!wasGrounded && s.vy < 0) {
            s.grounded = false
        }

        const cameraLine = HEIGHT * 0.4
        if (s.y < cameraLine) {
            const dy = cameraLine - s.y
            s.y += dy
            for (const p of s.platforms) p.y += dy
            s.distanceClimbed += dy
            setScore(prev => prev + dy)
        }

        s.platforms = s.platforms.filter(p => p.y < HEIGHT + 40)
        spawnPlatformsIfNeeded()

        if (s.y > HEIGHT + 40) {
            endGame()
        }
    }

    function endGame() {
        setRunning(false)
        setGameOver(true)
        setPaused(false)
        const finalScore = Math.floor(stateRef.current.distanceClimbed)
        setScore(finalScore)
        // Best wird jetzt aus der Datenbank geholt, nicht mehr aus localStorage
        // Zeige Highscore-Dialog an
        setShowHighscoreDialog(true)
    }

    // Load personal best from database (now handled by useScoreManager hook)
    useEffect(() => {
        scoreManager.fetchPersonalBest()
    }, [address, leaderboardRefresh]) // Aktualisiere wenn Wallet sich ändert oder neuer Score submitted

    useEffect(() => {
        // Load random player image from AVAILABLE_CHARACTERS
        const randomCharacter = AVAILABLE_CHARACTERS[Math.floor(Math.random() * AVAILABLE_CHARACTERS.length)]

        if (!randomCharacter) {
            console.error('No random character found');
            return;
        }

        playerCharacterPath.current = randomCharacter  // Speichere den Pfad

        const img = new Image()
        img.src = randomCharacter
        img.onload = () => {
            playerImageRef.current = img
        }

        // Load window characters (andere Figuren für Fenster - OHNE die Spielfigur)
        const loadWindowCharacters = () => {
            const otherCharacters = AVAILABLE_CHARACTERS.filter((c: string) => c !== randomCharacter)
            windowCharactersRef.current = []

            otherCharacters.forEach((src: string) => {
                const charImg = new Image()
                charImg.src = src
                charImg.onload = () => {
                    // Nochmal prüfen, dass es nicht die Spielfigur ist
                    if (src !== playerCharacterPath.current) {
                        windowCharactersRef.current.push(charImg)
                    }
                }
            })
        }
        loadWindowCharacters()
    }, [])

    useEffect(() => {
        resetGame()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const updateSize = () => {
            const container = canvas.parentElement
            if (!container) return

            const isMobile = window.innerWidth < 768
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight

            // Maintain aspect ratio while fitting in container
            const targetRatio = WIDTH / HEIGHT
            const containerRatio = containerWidth / containerHeight

            let displayWidth, displayHeight

            if (containerRatio > targetRatio) {
                // Container is wider - match height
                displayHeight = containerHeight
                displayWidth = displayHeight * targetRatio
            } else {
                // Container is taller - match width
                displayWidth = containerWidth
                displayHeight = displayWidth / targetRatio
            }

            canvas.style.width = displayWidth + 'px'
            canvas.style.height = displayHeight + 'px'
        }

        const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
        canvas.width = WIDTH * dpr
        canvas.height = HEIGHT * dpr

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.scale(dpr, dpr)

        updateSize()
        window.addEventListener('resize', updateSize)

        const loop = (t: number) => {
            if (lastTimeRef.current == null) lastTimeRef.current = t
            const dtMs = t - lastTimeRef.current
            lastTimeRef.current = t
            const dt = Math.min(0.033, dtMs / 1000)
            if (running) {
                step(dt)
            }
            draw(ctx)
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', updateSize)
            lastTimeRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running])

    // Device Motion Control (Gyro/Accelerometer)
    useEffect(() => {
        if (!motionEnabled) return

        const handleMotion = (event: DeviceOrientationEvent) => {
            const s = stateRef.current
            if (event.gamma === null) return

            // gamma: Rotation um die Y-Achse (-90 bis 90)
            // Negativ = nach links kippen, Positiv = nach rechts kippen
            const tilt = event.gamma

            // Schwellenwerte für Bewegung (kleinere Werte = sensibler)
            const threshold = 8 // Grad

            if (tilt < -threshold) {
                s.left = true
                s.right = false
            } else if (tilt > threshold) {
                s.right = true
                s.left = false
            } else {
                // Neutralzone - keine Bewegung
                s.left = false
                s.right = false
            }
        }

        window.addEventListener('deviceorientation', handleMotion)
        return () => {
            window.removeEventListener('deviceorientation', handleMotion)
        }
    }, [motionEnabled])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current
            if (e.type === 'keydown') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.left = true
                if (e.code === 'ArrowRight' || e.code === 'KeyD') s.right = true
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') s.jumpPressed = true
                if (e.code === 'Enter') {
                    if (!running) {
                        resetGame()
                        setRunning(true)
                    }
                }
            } else if (e.type === 'keyup') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.left = false
                if (e.code === 'ArrowRight' || e.code === 'KeyD') s.right = false
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') s.jumpPressed = false
            }
        }

        window.addEventListener('keydown', onKey)
        window.addEventListener('keyup', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('keyup', onKey)
        }
    }, [running])

    const handleTouchButton = (action: 'left' | 'right' | 'jump', pressed: boolean) => {
        const s = stateRef.current
        if (action === 'left') s.left = pressed
        if (action === 'right') s.right = pressed
        if (action === 'jump') s.jumpPressed = pressed
    }

    const handleStart = () => {
        resetGame()
        setRunning(true)
        setPaused(false)
        setGameOver(false)
    }

    const handlePause = () => {
        setRunning(false)
        setPaused(true)
    }

    const handleResume = () => {
        setRunning(true)
        setPaused(false)
    }

    const requestMotionPermission = async () => {
        // Check if on iOS 13+ which requires permission
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission()
                if (permission === 'granted') {
                    setMotionEnabled(true)
                    setMotionPermission('granted')
                } else {
                    setMotionPermission('denied')
                }
            } catch (error) {
                console.error('Error requesting motion permission:', error)
                setMotionPermission('denied')
            }
        } else {
            // Not iOS 13+ or permission not needed
            setMotionEnabled(true)
            setMotionPermission('granted')
        }
    }

    const toggleMotionControl = () => {
        if (motionEnabled) {
            setMotionEnabled(false)
        } else {
            if (motionPermission === 'granted') {
                setMotionEnabled(true)
            } else {
                requestMotionPermission()
            }
        }
    }

    return (
        <div className="flex w-full justify-center h-full">
            <div className="relative w-full max-w-2xl flex flex-col">
                {/* Game Card */}
                <div className="bg-white md:bg-white h-full md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 overflow-hidden flex flex-col md:max-h-full">
                    {/* Spacer for Mobile Navbar */}
                    <div className="flex-shrink-0 h-16 md:h-0 bg-white md:bg-transparent"></div>

                    {/* Canvas Container */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0 bg-secondary">
                        <canvas
                            ref={canvasRef}
                            width={WIDTH}
                            height={HEIGHT}
                            className="cursor-pointer w-full h-full object-contain"
                            onClick={!running ? handleStart : undefined}
                        />

                        {/* Pause Overlay */}
                        {paused && !gameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 max-w-sm mx-4">
                                    <h2 className="text-3xl font-bold text-white mb-6">Pausiert</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleResume}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                                        >
                                            Weiterspielen
                                        </button>
                                        <button
                                            onClick={handleStart}
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                        >
                                            Neustart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Game Over Overlay */}
                        {gameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-sm">
                                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 max-w-sm mx-4">
                                    <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
                                    <div className="space-y-4">
                                        <div className="bg-white/20 rounded-xl p-4">
                                            <p className="text-sm text-white/80 mb-1">Dein Score</p>
                                            <p className="text-4xl font-bold text-yellow-400">{Math.floor(score)}</p>
                                        </div>
                                        {scoreManager.bestScore > 0 && (
                                            <div className="bg-white/20 rounded-xl p-4">
                                                <p className="text-sm text-white/80 mb-1">Highscore</p>
                                                <p className="text-2xl font-bold text-emerald-400">{scoreManager.bestScore}</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleStart}
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                                        >
                                            Nochmal spielen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Start Overlay */}
                        {!running && !paused && !gameOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-sm">
                                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 max-w-sm mx-4">
                                    <h2 className="text-4xl font-bold text-white mb-6">History Jumper</h2>
                                    <div className="space-y-4 text-white/90 text-sm mb-8">
                                        <p className="hidden md:block">← → bewegen • ↑ springen</p>
                                        <p className="md:hidden">Nutze die Buttons zum Spielen</p>
                                        <p className="text-white/70">Springe auf die Plattformen und klettere so hoch wie möglich!</p>
                                    </div>
                                    {scoreManager.bestScore > 0 && (
                                        <div className="bg-white/20 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-white/80 mb-1">Highscore</p>
                                            <p className="text-3xl font-bold text-yellow-400">{scoreManager.bestScore}</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleStart}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                                    >
                                        Spiel starten
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* In-Game UI */}
                        {running && (
                            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                                {/* Level - ganz links */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg min-w-[80px] h-[56px] flex flex-col justify-center">
                                    <p className="text-xs text-gray-600 font-medium leading-none">Level</p>
                                    <p className="text-2xl font-bold text-blue-600 leading-tight">{Math.floor(stateRef.current.highestPlatformNumber / 50) + 1}</p>
                                </div>

                                {/* Score - mittig mit fester Breite */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg w-[140px] text-center h-[56px] flex flex-col justify-center">
                                    <p className="text-xs text-gray-600 font-medium leading-none">Score</p>
                                    <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{Math.floor(score)}</p>
                                </div>

                                {/* Buttons - ganz rechts */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePause}
                                        className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold px-4 rounded-xl shadow-lg transition-all flex items-center justify-center text-2xl h-[56px] w-[56px]"
                                        title="Pause"
                                    >
                                        ?
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold px-4 rounded-xl shadow-lg transition-all flex items-center justify-center text-2xl h-[56px] w-[56px]"
                                        title="Neustart"
                                    >
                                        ?
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Touch Controls */}
                    <div className="bg-primary p-4">
                        {/* Motion Control Toggle - nur auf Mobile */}
                        <div className="mb-3 md:hidden">
                            <button
                                onClick={toggleMotionControl}
                                className={`w-full px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${motionEnabled
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                <span className="text-xl">{motionEnabled ? '??' : '??'}</span>
                                <span className="text-sm">
                                    {motionEnabled ? 'Bewegungssteuerung AN' : 'Bewegungssteuerung (kippen)'}
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            {/* Links/Rechts Buttons auf der linken Seite - versteckt wenn Motion aktiv */}
                            <div className={`flex gap-2 flex-1 transition-opacity ${motionEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
                                <button
                                    onMouseDown={() => handleTouchButton('left', true)}
                                    onMouseUp={() => handleTouchButton('left', false)}
                                    onMouseLeave={() => handleTouchButton('left', false)}
                                    onTouchStart={() => handleTouchButton('left', true)}
                                    onTouchEnd={() => handleTouchButton('left', false)}
                                    className="flex-1 h-16 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-3xl font-bold text-primary shadow-md active:scale-95 transition-transform"
                                >
                                    ←
                                </button>
                                <button
                                    onMouseDown={() => handleTouchButton('right', true)}
                                    onMouseUp={() => handleTouchButton('right', false)}
                                    onMouseLeave={() => handleTouchButton('right', false)}
                                    onTouchStart={() => handleTouchButton('right', true)}
                                    onTouchEnd={() => handleTouchButton('right', false)}
                                    className="flex-1 h-16 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-3xl font-bold text-primary shadow-md active:scale-95 transition-transform"
                                >
                                    →
                                </button>
                            </div>

                            {/* Jump Button auf der rechten Seite */}
                            <button
                                onMouseDown={() => handleTouchButton('jump', true)}
                                onMouseUp={() => handleTouchButton('jump', false)}
                                onMouseLeave={() => handleTouchButton('jump', false)}
                                onTouchStart={() => handleTouchButton('jump', true)}
                                onTouchEnd={() => handleTouchButton('jump', false)}
                                className="flex-1 h-16 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-lg font-bold text-primary shadow-lg active:scale-95 transition-transform"
                            >
                                JUMP
                            </button>
                        </div>
                    </div>

                    {/* Footer Info */}
                    {/* Footer mit Controls & Highscore */}
                    <div className="bg-primary px-6 py-3 text-center" key={`footer-${address || 'no-wallet'}`}>
                        <p className="text-xs text-gray-600 font-medium">
                            <span className="hidden sm:inline">Tastatur: ← → bewegen, ↑ springen • </span>
                            {scoreManager.bestScore > 0 ? (
                                <span className="text-emerald-600 font-bold" key={`highscore-${address || 'global'}-${scoreManager.bestScore}`}>
                                    {address ? 'Dein Highscore' : 'Globaler Highscore'}: {scoreManager.bestScore.toLocaleString()}
                                </span>
                            ) : (
                                <span className="text-gray-500 italic">
                                    {address ? 'Noch kein persönlicher Score - spiele deine erste Runde!' : 'Noch keine Highscores - sei der Erste!'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Highscore Dialog */}
                {showHighscoreDialog && (
                    <HighscoreDialog
                        score={score}
                        level={Math.floor(stateRef.current.highestPlatformNumber / 50) + 1}
                        platformsClimbed={stateRef.current.platformsClimbed}
                        walletAddress={address}
                        onClose={() => setShowHighscoreDialog(false)}
                        onSubmitSuccess={(response: { isTopScore?: boolean }) => {
                            if (response.isTopScore) {
                                // Aktualisiere Leaderboard
                                setLeaderboardRefresh(prev => prev + 1)
                            }
                        }}
                    />
                )}
            </div>
        </div>
    )
}
