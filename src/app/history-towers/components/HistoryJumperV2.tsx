'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import HighscoreDialog from './HighscoreDialog'
import type { ScoreSubmitResponse } from '@/types/game'
import type { Platform } from '../types/historyTower.types'
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    GRAVITY,
    JUMP_VELOCITY,
    MOVE_SPEED_BASE,
    MAX_FALL_SPEED,
    AVAILABLE_CHARACTERS,
    BRICK_WIDTH,
    BRICK_HEIGHT,
    BACKGROUND_SCROLL_SPEED,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    WINDOW_ARCH_HEIGHT,
    WINDOW_SPACING,
    CHARACTER_SIZE_IN_WINDOW,
    COLORS,
    PLATFORMS_PER_LEVEL,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    MAX_VISIBLE_PLATFORMS,
    CAMERA_LINE_RATIO,
    PLAYER_TILT_MAX,
    PLAYER_TILT_DIVIDER,
    PLATFORM_CLEANUP_OFFSET,
    SPAWN_THRESHOLD_Y,
    MAX_FRAME_TIME,
    MOBILE_BREAKPOINT,
    DISTANCE_THRESHOLD_GAME_OVER,
} from '../config/gameConstants'
import { TowerRenderEngine } from '../engine/TowerRenderEngine'
import { TowerPhysicsEngine } from '../engine/TowerPhysicsEngine'
import { useTowerCharacters, useGameInput, useGameState } from '../hooks'

interface HistoryJumperV2Props {
    onGameStateChange?: (isActive: boolean) => void;
    onLeaderboardRefresh?: (trigger: number) => void;
}

export default function HistoryJumperV2({ onGameStateChange, onLeaderboardRefresh }: HistoryJumperV2Props = {}) {
    const { address } = useAccount()
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // ===== NEW: Use Character Hook =====
    const {
        playerImageRef,
        windowCharactersRef,
        playerPathRef,
        loading: charactersLoading
    } = useTowerCharacters()
    // ===================================

    // ===== NEW: Use Game Input Hook =====
    const {
        inputState,
        motionControl,
        setTouchInput,
        toggleMotionControl,
        resetInput
    } = useGameInput()
    // ====================================

    // ===== NEW: Use Game State Hook =====
    const {
        state: gameState,
        startGame: startGameState,
        pauseGame: pauseGameState,
        resumeGame: resumeGameState,
        gameOver: gameOverState,
        updateScore,
        updateBest,
        hideHighscoreDialog,
        triggerLeaderboardRefresh,
        resetGame: resetGameState
    } = useGameState()
    // ====================================

    // ===== NEW: Render Engine =====
    const renderEngineRef = useRef<TowerRenderEngine | null>(null)
    // ===============================

    // ===== NEW: Physics Engine =====
    const physicsEngineRef = useRef<TowerPhysicsEngine | null>(null)
    if (!physicsEngineRef.current) {
        physicsEngineRef.current = new TowerPhysicsEngine()
    }
    // ================================

    const rafRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number | null>(null)

    // Destructure gameState for easier access
    const { running, paused, gameOver, score, best, showHighscoreDialog } = gameState

    // Notify parent component about game state changes
    useEffect(() => {
        onGameStateChange?.(gameState.running);
    }, [gameState.running, onGameStateChange]);

    // Notify parent component about leaderboard refresh
    useEffect(() => {
        onLeaderboardRefresh?.(gameState.leaderboardRefresh);
    }, [gameState.leaderboardRefresh, onLeaderboardRefresh]);

    // Canvas & Game Constants (imported from gameConstants.ts)
    const WIDTH = CANVAS_WIDTH
    const HEIGHT = CANVAS_HEIGHT

    // Physics Constants (imported from gameConstants.ts)
    // GRAVITY, JUMP_VELOCITY, MOVE_SPEED_BASE, MAX_FALL_SPEED

    const stateRef = useRef({
        x: WIDTH / 2 - PLAYER_WIDTH / 2,
        y: HEIGHT - PLAYER_HEIGHT,
        w: PLAYER_WIDTH,
        h: PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        grounded: true,
        platforms: [] as Platform[],
        nextSpawnY: HEIGHT - 140,
        left: false,
        right: false,
        jumpPressed: false,
        motionTilt: 0,  // Motion control tilt value (-1 to 1)
        distanceClimbed: 0,
        backgroundScroll: 0,
        platformsClimbed: 0,  // Zähler für erreichte Plattformen
        highestPlatformNumber: 0,  // Höchste erreichte Plattform-Nummer (für Level-Anzeige)
        totalPlatformsSpawned: 0,  // Gesamtzahl aller gespawnten Plattformen
    })

    const rand = (min: number, max: number) => Math.random() * (max - min) + min

    function resetGame() {
        const s = stateRef.current
        const physics = physicsEngineRef.current

        // Create platforms using PhysicsEngine
        if (physics) {
            s.platforms = physics.createInitialPlatforms() || []
        } else {
            // Fallback: manual creation
            s.platforms = []
            let y = HEIGHT - 80
            for (let i = 0; i < 9; i++) {
                const w = 140
                const x = rand(10, WIDTH - w - 10)
                const direction = Math.random() > 0.5 ? 1 : -1
                s.platforms.push({ x, y, w, h: 12, vx: 0, vy: 0, direction, counted: false, isSafePlatform: false, number: i + 1 })
                y -= 70
            }
        }

        // Position player at canvas bottom
        s.x = WIDTH / 2 - PLAYER_WIDTH / 2  // Center the player
        s.y = HEIGHT - PLAYER_HEIGHT        // Position at canvas bottom
        s.vx = 0
        s.vy = 0
        s.grounded = true

        s.nextSpawnY = (s.platforms && s.platforms.length > 0)
            ? (s.platforms[s.platforms.length - 1]?.y || HEIGHT - 80 - 70 * 9)
            : HEIGHT - 80 - 70 * 9
        s.distanceClimbed = 0
        s.backgroundScroll = 0
        s.platformsClimbed = 0  // Reset platform counter
        s.highestPlatformNumber = 0  // Reset highest platform number
        s.totalPlatformsSpawned = 9  // Wir haben 9 Plattformen erstellt
        s.left = false
        s.right = false
        s.jumpPressed = false
        resetGameState()
        updateScore(0)
    }

    function spawnPlatformsIfNeeded() {
        const s = stateRef.current
        const physics = physicsEngineRef.current
        if (!physics) return

        let minY = Infinity
        let topPlatform: typeof s.platforms[0] | undefined
        s.platforms.forEach(p => {
            if (p.y < minY) {
                minY = p.y
                topPlatform = p
            }
        })

        while (s.platforms.length < MAX_VISIBLE_PLATFORMS || minY > SPAWN_THRESHOLD_Y) {
            s.totalPlatformsSpawned++
            const platformNumber = s.totalPlatformsSpawned

            // Übergebe die letzte gespawnte Plattform für horizontale Distanz-Check
            const lastSpawned = s.platforms[s.platforms.length - 1]

            const platform = physics.spawnPlatform(
                platformNumber,
                minY,
                s.nextSpawnY,
                lastSpawned
            )

            s.platforms.push(platform)
            minY = platform.y
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

        // ===== Layer-based Rendering: Background Layer (optimized) =====
        const backgroundUpdated = renderEngineRef.current?.updateBackgroundLayer(s.backgroundScroll)
        renderEngineRef.current?.drawBackgroundLayer()
        // ================================================================

        // ===== Update character images if available =====
        if (renderEngineRef.current) {
            if (playerImageRef.current && renderEngineRef.current) {
                renderEngineRef.current.setPlayerImage(playerImageRef.current)
            }
            if (windowCharactersRef.current.length > 0 && renderEngineRef.current) {
                renderEngineRef.current.setWindowCharacters(windowCharactersRef.current)
            }
        }
        // ================================================

        // ===== Use Render Engine for Platforms =====
        renderEngineRef.current?.drawPlatforms(s.platforms)
        renderEngineRef.current?.drawPlatformLabels(s.platforms)
        // ================================================

        // ===== NEW: Use Render Engine for Player =====
        // Tilt effect based on velocity
        ctx.save()
        ctx.translate(s.x + s.w / 2, s.y + s.h / 2)
        const tilt = Math.max(-PLAYER_TILT_MAX, Math.min(PLAYER_TILT_MAX, s.vx / PLAYER_TILT_DIVIDER))
        ctx.rotate(tilt)

        renderEngineRef.current?.drawPlayer(
            -s.w / 2,
            -s.h / 2,
            s.w,
            s.h
        )

        ctx.restore()
        // ==============================================
    }

    function step(dt: number) {
        const s = stateRef.current

        // ===== NEW: Use PhysicsEngine for difficulty =====
        const physics = physicsEngineRef.current!
        const { moveSpeed } = physics.getDifficulty(s.platformsClimbed)
        // =================================================

        // ===== NEW: Use PhysicsEngine for platform movement =====
        for (let i = 0; i < s.platforms.length; i++) {
            const platform = s.platforms[i]
            if (platform) {
                s.platforms[i] = physics.updatePlatformMovement(platform, dt)
            }
        }
        // ========================================================

        // ===== NEW: Use PhysicsEngine for player movement =====
        // Bei Motion Control: Verwende motionTilt als Multiplikator für stärkere Bewegung
        const motionMultiplier = Math.abs(s.motionTilt) > 0.1 ? Math.abs(s.motionTilt) : 1
        const effectiveAccel = moveSpeed * 3 * motionMultiplier

        s.vx = physics.applyHorizontalMovement(s.vx, s.left, s.right, effectiveAccel, dt)

        // Gravity
        s.vy = physics.applyGravity(s.vy, dt)

        // Jump
        if (s.jumpPressed && s.grounded) {
            s.vy = physics.jump()
            s.grounded = false
        }

        // Update position
        s.x += s.vx * dt
        s.y += s.vy * dt

        // X boundaries with wrap-around
        s.x = physics.clampPlayerX(s.x, s.w)
        // ======================================================

        let wasGrounded = false

        // ===== NEW: Use PhysicsEngine for collision with spatial partitioning =====
        if (s.vy >= 0) {
            // Filter nearby platforms for collision check (~70% performance gain)
            const nearbyPlatforms = physics.getNearbyPlatforms(s.platforms, s.y)

            for (const p of nearbyPlatforms) {
                const collision = physics.checkCollision(
                    s.x, s.y, s.w, s.h, s.vy, p
                )

                if (collision) {
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
                    if (s.distanceClimbed > DISTANCE_THRESHOLD_GAME_OVER) {
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

        const cameraLine = HEIGHT * CAMERA_LINE_RATIO
        if (s.y < cameraLine) {
            const dy = cameraLine - s.y
            s.y += dy
            for (const p of s.platforms) p.y += dy
            s.distanceClimbed += dy
            updateScore(Math.floor(s.distanceClimbed))
        }

        s.platforms = s.platforms.filter(p => p.y < HEIGHT + PLATFORM_CLEANUP_OFFSET)
        spawnPlatformsIfNeeded()

        if (s.y > HEIGHT + PLATFORM_CLEANUP_OFFSET) {
            endGame()
        }
    }

    function endGame() {
        const finalScore = Math.floor(stateRef.current.distanceClimbed)
        gameOverState(finalScore)
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
                    updateBest(data.scores[0].score)
                } else {
                    // Keine Scores gefunden - setze auf 0
                    updateBest(0)
                }
            } catch (error) {
                console.error('Error fetching personal best:', error)
                // Bei Fehler auf 0 setzen
                updateBest(0)
            }
        }

        fetchPersonalBest()
    }, [address, gameState.leaderboardRefresh, updateBest]) // Aktualisiere wenn Wallet sich ändert oder neuer Score submitted

    // OLD: Character loading moved to useTowerCharacters hook
    // useEffect(() => { ... }, [])

    useEffect(() => {
        resetGame()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const updateSize = () => {
            const container = canvas.parentElement
            if (!container) return

            const isMobile = window.innerWidth < MOBILE_BREAKPOINT
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

        // ===== NEW: Initialize Render Engine =====
        if (!renderEngineRef.current) {
            renderEngineRef.current = new TowerRenderEngine(ctx)
            // Initialize background layer for optimized rendering
            renderEngineRef.current.initializeBackgroundLayer()
        }
        // Update character images
        if (playerImageRef.current) {
            renderEngineRef.current.setPlayerImage(playerImageRef.current)
        }
        if (windowCharactersRef.current.length > 0) {
            renderEngineRef.current.setWindowCharacters(windowCharactersRef.current)
        }
        // ==========================================

        updateSize()
        window.addEventListener('resize', updateSize)

        const loop = (t: number) => {
            if (lastTimeRef.current == null) lastTimeRef.current = t
            const dtMs = t - lastTimeRef.current
            lastTimeRef.current = t
            const dt = Math.min(MAX_FRAME_TIME, dtMs / 1000)
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

    // Sync input state from hook to stateRef
    useEffect(() => {
        const s = stateRef.current
        s.left = inputState.left
        s.right = inputState.right
        s.jumpPressed = inputState.jump
        s.motionTilt = inputState.motionTilt
    }, [inputState])

    // Handle Enter key for starting game
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Enter' && !running) {
                resetGame()
                startGameState()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [running, startGameState])

    const handleTouchButton = (action: 'left' | 'right' | 'jump', pressed: boolean) => {
        setTouchInput(action, pressed)
    }

    const handleStart = () => {
        resetGame()
        startGameState()
    }

    const handlePause = () => {
        pauseGameState()
    }

    const handleResume = () => {
        resumeGameState()
    }

    return (
        <div className="flex w-full justify-center h-full">
            <div className="relative w-full h-full flex flex-col">
                {/* Game Card */}
                <div className="bg-secondary h-full overflow-hidden flex flex-col md:bg-white md:rounded-xl md:shadow-lg md:border md:border-gray-200">
                    {/* Canvas Container */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0 bg-secondary">
                        <canvas
                            ref={canvasRef}
                            width={WIDTH}
                            height={HEIGHT}
                            className="cursor-pointer w-full h-full"
                            style={{ objectFit: 'cover' }}
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
                                        <button
                                            onClick={() => {
                                                const event = new CustomEvent('openLeaderboard')
                                                window.dispatchEvent(event)
                                            }}
                                            className="xl:hidden w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="text-xl">🏆</span>
                                            <span>Leaderboard</span>
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
                                        <button
                                            onClick={() => {
                                                const event = new CustomEvent('openLeaderboard')
                                                window.dispatchEvent(event)
                                            }}
                                            className="xl:hidden w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="text-xl">🏆</span>
                                            <span>Leaderboard</span>
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
                                        <p className="hidden md:block">← → bewegen, ↑ springen</p>
                                        <p className="md:hidden">Nutze die Buttons zum Spielen</p>
                                        <p className="text-white/70">Springe auf die Plattformen und klettere so hoch wie möglich!</p>
                                    </div>
                                    {best > 0 && (
                                        <div className="bg-white/20 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-white/80 mb-1">Highscore</p>
                                            <p className="text-3xl font-bold text-yellow-400">{best}</p>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleStart}
                                            className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                                        >
                                            Spiel starten
                                        </button>

                                        {/* Leaderboard Button - nur auf Mobile im Start-Screen */}
                                        <button
                                            onClick={() => {
                                                const event = new CustomEvent('openLeaderboard')
                                                window.dispatchEvent(event)
                                            }}
                                            className="xl:hidden w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="text-xl">🏆</span>
                                            <span>Leaderboard anzeigen</span>
                                        </button>
                                    </div>
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
                                        🔄
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Touch Controls - Smart Layout basierend auf Device-Features */}
                    <div className="bg-primary p-4 xl:hidden">
                        {/* Touch Buttons: Nur anzeigen wenn Motion Control aus ist */}
                        {!motionControl.enabled && (
                            <div className="flex items-center justify-between gap-3">
                                {/* Links/Rechts Buttons auf der linken Seite */}
                                <div className="flex gap-2 flex-1">
                                    <button
                                        onMouseDown={() => handleTouchButton('left', true)}
                                        onMouseUp={() => handleTouchButton('left', false)}
                                        onMouseLeave={() => handleTouchButton('left', false)}
                                        onTouchStart={() => handleTouchButton('left', true)}
                                        onTouchEnd={() => handleTouchButton('left', false)}
                                        className="flex-1 h-14 md:h-16 lg:h-14 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-3xl md:text-4xl lg:text-3xl font-bold text-primary shadow-md active:scale-95 transition-transform touch-none"
                                        style={{ WebkitTouchCallout: 'none' }}
                                    >
                                        ←
                                    </button>
                                    <button
                                        onMouseDown={() => handleTouchButton('right', true)}
                                        onMouseUp={() => handleTouchButton('right', false)}
                                        onMouseLeave={() => handleTouchButton('right', false)}
                                        onTouchStart={() => handleTouchButton('right', true)}
                                        onTouchEnd={() => handleTouchButton('right', false)}
                                        className="flex-1 h-14 md:h-16 lg:h-14 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-3xl md:text-4xl lg:text-3xl font-bold text-primary shadow-md active:scale-95 transition-transform touch-none"
                                        style={{ WebkitTouchCallout: 'none' }}
                                    >
                                        →
                                    </button>
                                </div>

                                {/* Jump Button und Motion Toggle */}
                                <div className="flex gap-2 flex-1">
                                    <button
                                        onMouseDown={() => handleTouchButton('jump', true)}
                                        onMouseUp={() => handleTouchButton('jump', false)}
                                        onMouseLeave={() => handleTouchButton('jump', false)}
                                        onTouchStart={() => handleTouchButton('jump', true)}
                                        onTouchEnd={() => handleTouchButton('jump', false)}
                                        className="flex-1 h-14 md:h-16 lg:h-14 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-lg md:text-xl lg:text-lg font-bold text-primary shadow-lg active:scale-95 transition-transform touch-none"
                                        style={{ WebkitTouchCallout: 'none' }}
                                    >
                                        JUMP
                                    </button>

                                    {/* Motion Control Toggle - nur anzeigen wenn DeviceOrientation verfügbar */}
                                    {typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && (
                                        <button
                                            onClick={toggleMotionControl}
                                            className="h-14 md:h-16 lg:h-14 w-14 md:w-16 lg:w-14 flex-shrink-0 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center shadow-md transition active:scale-95"
                                            title="Bewegungssteuerung aktivieren"
                                        >
                                            <span className="text-2xl">🎮</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Wenn Motion aktiv: Nur Jump Button + Toggle anzeigen (Pfeiltasten ausgeblendet) */}
                        {motionControl.enabled && (
                            <div className="flex gap-2">
                                {/* Jump Button - volle Breite wenn Motion aktiv */}
                                <button
                                    onMouseDown={() => handleTouchButton('jump', true)}
                                    onMouseUp={() => handleTouchButton('jump', false)}
                                    onMouseLeave={() => handleTouchButton('jump', false)}
                                    onTouchStart={() => handleTouchButton('jump', true)}
                                    onTouchEnd={() => handleTouchButton('jump', false)}
                                    className="flex-1 h-14 md:h-16 lg:h-14 select-none rounded-xl bg-secondary hover:bg-secondary/90 text-lg md:text-xl lg:text-lg font-bold text-primary shadow-lg active:scale-95 transition-transform touch-none"
                                    style={{ WebkitTouchCallout: 'none' }}
                                >
                                    JUMP
                                </button>

                                {/* Motion Toggle Button - aktiver Zustand */}
                                <button
                                    onClick={toggleMotionControl}
                                    className="h-14 md:h-16 lg:h-14 w-14 md:w-16 lg:w-14 flex-shrink-0 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition flex items-center justify-center shadow-lg active:scale-95"
                                    title="Bewegungssteuerung deaktivieren"
                                >
                                    <span className="text-2xl">📱</span>
                                </button>
                            </div>
                        )}

                        {/* Hinweis bei aktivierter Motion Control */}
                        {motionControl.enabled && (
                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-600 font-medium">
                                    🎮 Neige dein Gerät nach links/rechts zum Steuern
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    {/* Footer mit Controls & Highscore */}
                    <div className="bg-primary px-6 py-3 text-center" key={`footer-${address || 'no-wallet'}`}>
                        <p className="text-xs text-gray-600 font-medium">
                            <span className="hidden sm:inline">Tastatur: ← → bewegen, ↑ springen • </span>
                            {best > 0 ? (
                                <span className="text-emerald-600 font-bold" key={`highscore-${address || 'global'}-${best}`}>
                                    {address ? 'Dein Highscore' : 'Globaler Highscore'}: {best.toLocaleString()}
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
                        onClose={hideHighscoreDialog}
                        onSubmitSuccess={(response: ScoreSubmitResponse) => {
                            if (response.isTopScore) {
                                // Aktualisiere Leaderboard
                                triggerLeaderboardRefresh()
                            }
                        }}
                    />
                )}
            </div>
        </div>
    )
}
