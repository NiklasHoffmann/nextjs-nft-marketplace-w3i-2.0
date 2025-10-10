'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import HighscoreDialog from './HighscoreDialog'
import HighscoreTable from './HighscoreTable'
import type { ScoreSubmitResponse } from '@/types/game'

export default function HistoryJumper() {
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
        const brickWidth = 40
        const brickHeight = 20
        const scrollOffset = s.backgroundScroll * 0.3

        // Zeichne Backsteine über gesamte Breite
        for (let y = -brickHeight; y < HEIGHT + brickHeight; y += brickHeight) {
            const rowOffset = Math.floor((y + scrollOffset) / brickHeight) % 2 === 0 ? 0 : brickWidth / 2
            const brickY = y + (scrollOffset % brickHeight) // Plus für nach unten scrollen

            for (let x = -brickWidth; x < WIDTH + brickWidth; x += brickWidth) {
                const brickX = x + rowOffset

                // Backstein
                ctx.fillStyle = 'rgba(139, 90, 43, 0.25)'
                ctx.fillRect(brickX, brickY, brickWidth - 2, brickHeight - 2)

                // Fugen (dunkler)
                ctx.strokeStyle = 'rgba(80, 50, 25, 0.3)'
                ctx.lineWidth = 2
                ctx.strokeRect(brickX, brickY, brickWidth - 2, brickHeight - 2)
            }
        }

        // Zeichne spitzbogiges Burgfenster (größer)
        const windowWidth = 70
        const windowHeight = 100
        const archHeight = 35 // Höhe des spitzen Bogens oben
        const totalWindowHeight = windowHeight + archHeight
        const windowSpacing = 800 // Größerer Abstand für vollständiges Durchscrollen

        // Berechne Position basierend auf backgroundScroll (synchron mit Backsteinwand)
        const scrollPosition = s.backgroundScroll * 0.3 // Gleiche Geschwindigkeit wie Backsteine
        const cyclePosition = scrollPosition % windowSpacing
        const currentWindowIndex = Math.floor(scrollPosition / windowSpacing)

        // Zufällige X-Position für jedes Fenster (aber konsistent für denselben Index)
        // Verwende currentWindowIndex als Seed für pseudo-zufällige Position
        const randomSeed = (currentWindowIndex * 12345) % 100
        const minX = 80
        const maxX = WIDTH - windowWidth - 80
        const windowX = minX + ((randomSeed / 100) * (maxX - minX))

        // Berechne Y-Position - das Fenster scrollt von oben (-totalWindowHeight) bis komplett unten raus (HEIGHT)
        // Der komplette Scroll-Bereich ist totalWindowHeight + HEIGHT
        const scrollRange = totalWindowHeight + HEIGHT + 50 // Extra Puffer
        const windowY = (cyclePosition / windowSpacing) * scrollRange - totalWindowHeight

        // Zeichne nur wenn das Fenster sichtbar ist
        if (windowY + totalWindowHeight > 0 && windowY < HEIGHT) {
            // Zeichne spitzbogiges Fenster mit Path
            ctx.save()

            // Erstelle Fensterform (Rechteck + spitzer Bogen oben)
            ctx.beginPath()
            // Unten links
            ctx.moveTo(windowX, windowY + archHeight + windowHeight)
            // Links hoch
            ctx.lineTo(windowX, windowY + archHeight)
            // Linker Bogen zum Spitz
            ctx.quadraticCurveTo(windowX, windowY, windowX + windowWidth / 2, windowY)
            // Rechter Bogen vom Spitz
            ctx.quadraticCurveTo(windowX + windowWidth, windowY, windowX + windowWidth, windowY + archHeight)
            // Rechts runter
            ctx.lineTo(windowX + windowWidth, windowY + archHeight + windowHeight)
            ctx.closePath()

            // Fenster-Hintergrund mit bg-primary (#FFF9E2)
            ctx.fillStyle = '#FFF9E2'
            ctx.fill()

            // Steinrahmen um Fenster
            ctx.strokeStyle = 'rgba(139, 90, 43, 0.8)'
            ctx.lineWidth = 5
            ctx.stroke()

            ctx.restore()

            // Zeichne zufällige Figur im Fenster (noch größer)
            if (windowCharactersRef.current.length > 0) {
                const characterIndex = currentWindowIndex % windowCharactersRef.current.length
                const character = windowCharactersRef.current[characterIndex]

                if (character && character.complete) {
                    const charSize = 85 // Noch größer: von 70 auf 85
                    ctx.drawImage(
                        character,
                        windowX + (windowWidth - charSize) / 2,
                        windowY + archHeight + (windowHeight - charSize) / 2 + 10,
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

    const [running, setRunning] = useState(false)
    const [paused, setPaused] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [best, setBest] = useState<number>(0)
    const [showHighscoreDialog, setShowHighscoreDialog] = useState(false)
    const [showLeaderboard, setShowLeaderboard] = useState(false)
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0)

    const WIDTH = 360
    const HEIGHT = 640

    const GRAVITY = 2400
    const JUMP_V = -880
    const MOVE_SPEED_BASE = 260
    const MAX_FALL = 1200

    // Verfügbare Figuren
    const CHARACTERS = [
        '/media/game/Figur2.svg',
        '/media/game/Figur3.svg',
        '/media/game/Figur4.svg',
        '/media/game/Figur5.svg',
        '/media/game/Figur6.svg',
        '/media/game/Figur7.svg',
    ]

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
        if (s.vy > MAX_FALL) s.vy = MAX_FALL

        if (s.jumpPressed && s.grounded) {
            s.vy = JUMP_V
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

    // Load personal best from database
    useEffect(() => {
        const fetchPersonalBest = async () => {
            try {
                let url = '/api/game/scores?type=top&limit=1'

                // Wenn Wallet verbunden ist, hole den persönlichen Highscore
                if (address) {
                    url = `/api/game/scores?type=user&address=${address}&limit=1`
                }

                // Verhindere Browser-Caching
                const response = await fetch(url, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                })
                const data = await response.json()

                if (data.success && data.scores && data.scores.length > 0) {
                    setBest(data.scores[0].score)
                } else if (address) {
                    // Wenn keine Scores für diese Wallet, hole globalen Top-Score
                    const globalResponse = await fetch('/api/game/scores?type=top&limit=1', {
                        cache: 'no-store',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    })
                    const globalData = await globalResponse.json()
                    if (globalData.success && globalData.scores && globalData.scores.length > 0) {
                        setBest(globalData.scores[0].score)
                    } else {
                        // Keine Scores in DB - setze auf 0
                        setBest(0)
                    }
                } else {
                    // Keine Scores in DB - setze auf 0
                    setBest(0)
                }
            } catch (error) {
                console.error('Error fetching personal best:', error)
                // Bei Fehler auf 0 setzen
                setBest(0)
            }
        }

        fetchPersonalBest()
    }, [address, leaderboardRefresh]) // Aktualisiere wenn Wallet sich ändert oder neuer Score submitted

    useEffect(() => {
        // Load random player image
        const randomCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
        playerCharacterPath.current = randomCharacter  // Speichere den Pfad

        const img = new Image()
        img.src = randomCharacter
        img.onload = () => {
            playerImageRef.current = img
        }

        // Load window characters (andere Figuren für Fenster - OHNE die Spielfigur)
        const loadWindowCharacters = () => {
            const otherCharacters = CHARACTERS.filter(c => c !== randomCharacter)
            windowCharactersRef.current = []

            otherCharacters.forEach(src => {
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
                                        {best > 0 && (
                                            <div className="bg-white/20 rounded-xl p-4">
                                                <p className="text-sm text-white/80 mb-1">Highscore</p>
                                                <p className="text-2xl font-bold text-emerald-400">{best}</p>
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
                                        <p className="hidden md:block">← → bewegen • ␣ springen</p>
                                        <p className="md:hidden">Nutze die Buttons zum Spielen</p>
                                        <p className="text-white/70">Springe auf die Plattformen und klettere so hoch wie möglich!</p>
                                    </div>
                                    {best > 0 && (
                                        <div className="bg-white/20 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-white/80 mb-1">Highscore</p>
                                            <p className="text-3xl font-bold text-yellow-400">{best}</p>
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
                                        ⏸
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold px-4 rounded-xl shadow-lg transition-all flex items-center justify-center text-2xl h-[56px] w-[56px]"
                                        title="Neustart"
                                    >
                                        ↻
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Touch Controls */}
                    <div className="bg-primary p-4">
                        <div className="flex items-center justify-between gap-3">
                            {/* Links/Rechts Buttons auf der linken Seite */}
                            <div className="flex gap-2 flex-1">
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
                    <div className="bg-primary px-6 py-3 text-center">
                        <p className="text-xs text-gray-600 font-medium">
                            <span className="hidden sm:inline">Tastatur: ← → bewegen, ␣ springen • </span>
                            {best > 0 && (
                                <span className="text-emerald-600 font-bold">
                                    {address ? 'Dein Highscore' : 'Globaler Highscore'}: {best.toLocaleString()}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Leaderboard Toggle Button */}
                    <div className="px-6 py-3">
                        <button
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition font-bold shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>🏆</span>
                            <span>{showLeaderboard ? 'Leaderboard verstecken' : 'Leaderboard anzeigen'}</span>
                        </button>
                    </div>

                    {/* Leaderboard Section */}
                    {showLeaderboard && (
                        <div className="px-6 pb-6">
                            <HighscoreTable
                                walletAddress={address}
                                refreshTrigger={leaderboardRefresh}
                            />
                        </div>
                    )}
                </div>

                {/* Highscore Dialog */}
                {showHighscoreDialog && (
                    <HighscoreDialog
                        score={score}
                        level={Math.floor(stateRef.current.highestPlatformNumber / 50) + 1}
                        platformsClimbed={stateRef.current.platformsClimbed}
                        walletAddress={address}
                        onClose={() => setShowHighscoreDialog(false)}
                        onSubmitSuccess={(response: ScoreSubmitResponse) => {
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
