/**
 * useTowerCharacters Hook
 * 
 * Handles loading of player and window characters with Promise-based image loading.
 * Prevents race conditions and provides refs for direct access without causing re-renders.
 * 
 * Process:
 * 1. Randomly selects one character as player
 * 2. Loads player image
 * 3. Loads all other characters for windows
 * 4. Provides refs for immediate access in render loop
 * 
 * @returns Character images, loading state, and refs for direct access
 * 
 * @example
 * ```typescript
 * const { playerImageRef, windowCharactersRef, loading } = useTowerCharacters();
 * 
 * // Use in render engine
 * if (!loading && playerImageRef.current) {
 *   renderEngine.setPlayerImage(playerImageRef.current);
 * }
 * ```
 * 
 * Extrahiert aus HistoryJumperV2.tsx für bessere Wartbarkeit
 */

import { useState, useEffect, useRef } from 'react'
import { AVAILABLE_CHARACTERS } from '../config/gameConstants'
import type { LoadedCharacters } from '../types/historyTower.types'

/**
 * Load single image as Promise
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
        img.src = src
    })
}

/**
 * Load all characters
 */
async function loadAllCharacters(): Promise<LoadedCharacters> {
    try {
        // Random player character
        const randomIndex = Math.floor(Math.random() * AVAILABLE_CHARACTERS.length)
        const playerPath = AVAILABLE_CHARACTERS[randomIndex] as string

        if (!playerPath) {
            throw new Error('No player character found')
        }

        // Other characters for windows (ohne player)
        const otherPaths = AVAILABLE_CHARACTERS.filter(path => path !== playerPath)

        // Load all images in parallel
        const [playerImage, ...windowImages] = await Promise.all([
            loadImage(playerPath),
            ...otherPaths.map(path => loadImage(path))
        ])

        return {
            playerImage,
            playerPath,
            windowImages
        }
    } catch (error) {
        console.error('Error loading characters:', error)
        throw error
    }
}

export function useTowerCharacters() {
    const [characters, setCharacters] = useState<LoadedCharacters | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Refs für direkten Zugriff (ohne Re-renders)
    const playerImageRef = useRef<HTMLImageElement | null>(null)
    const windowCharactersRef = useRef<HTMLImageElement[]>([])
    const playerPathRef = useRef<string>('')

    useEffect(() => {
        let mounted = true

        const load = async () => {
            try {
                setLoading(true)
                setError(null)

                const loaded = await loadAllCharacters()

                if (mounted) {
                    setCharacters(loaded)
                    playerImageRef.current = loaded.playerImage
                    windowCharactersRef.current = loaded.windowImages
                    playerPathRef.current = loaded.playerPath
                    setLoading(false)
                }
            } catch (err) {
                if (mounted) {
                    setError(err as Error)
                    setLoading(false)
                }
            }
        }

        load()

        return () => {
            mounted = false
        }
    }, [])

    return {
        characters,
        loading,
        error,
        // Refs für direkten Zugriff
        playerImageRef,
        windowCharactersRef,
        playerPathRef,
    }
}
