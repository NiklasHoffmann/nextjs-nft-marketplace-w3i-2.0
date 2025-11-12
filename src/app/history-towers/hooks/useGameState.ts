/**
 * Game State Hook
 * 
 * Manages UI state for the History Towers game using useReducer pattern.
 * Separates UI state from game physics state for better organization.
 * 
 * Consolidates 7 former useState hooks into a single reducer with typed actions:
 * - running, paused, gameOver (game flow states)
 * - score, best (score tracking)
 * - showHighscoreDialog (dialog visibility)
 * - leaderboardRefresh (leaderboard update trigger)
 * 
 * @example
 * ```typescript
 * const { state, startGame, pauseGame, gameOver } = useGameState();
 * 
 * // Start game
 * startGame(); // state.running = true, state.score = 0
 * 
 * // End game
 * gameOver(1500); // state.gameOver = true, state.showHighscoreDialog = true
 * ```
 */

import { useReducer, useCallback } from 'react'
import type { GameUIState } from '../types/historyTower.types'

// Action Types
type GameStateAction =
    | { type: 'START_GAME' }
    | { type: 'PAUSE_GAME' }
    | { type: 'RESUME_GAME' }
    | { type: 'GAME_OVER'; score: number }
    | { type: 'UPDATE_SCORE'; score: number }
    | { type: 'UPDATE_BEST'; best: number }
    | { type: 'SHOW_HIGHSCORE_DIALOG' }
    | { type: 'HIDE_HIGHSCORE_DIALOG' }
    | { type: 'TRIGGER_LEADERBOARD_REFRESH' }
    | { type: 'RESET_GAME' }

// Initial State
const initialState: GameUIState = {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    best: 0,
    showHighscoreDialog: false,
    leaderboardRefresh: 0,
}

// Reducer
function gameStateReducer(state: GameUIState, action: GameStateAction): GameUIState {
    switch (action.type) {
        case 'START_GAME':
            return {
                ...state,
                running: true,
                paused: false,
                gameOver: false,
                score: 0,
                showHighscoreDialog: false,
            }

        case 'PAUSE_GAME':
            return {
                ...state,
                running: false,
                paused: true,
            }

        case 'RESUME_GAME':
            return {
                ...state,
                running: true,
                paused: false,
            }

        case 'GAME_OVER':
            return {
                ...state,
                running: false,
                paused: false,
                gameOver: true,
                score: action.score,
                showHighscoreDialog: true,
            }

        case 'UPDATE_SCORE':
            return {
                ...state,
                score: action.score,
            }

        case 'UPDATE_BEST':
            return {
                ...state,
                best: action.best,
            }

        case 'SHOW_HIGHSCORE_DIALOG':
            return {
                ...state,
                showHighscoreDialog: true,
            }

        case 'HIDE_HIGHSCORE_DIALOG':
            return {
                ...state,
                showHighscoreDialog: false,
            }

        case 'TRIGGER_LEADERBOARD_REFRESH':
            return {
                ...state,
                leaderboardRefresh: state.leaderboardRefresh + 1,
            }

        case 'RESET_GAME':
            return {
                ...state,
                running: false,
                paused: false,
                gameOver: false,
                score: 0,
            }

        default:
            return state
    }
}

export interface UseGameStateReturn {
    state: GameUIState
    startGame: () => void
    pauseGame: () => void
    resumeGame: () => void
    gameOver: (score: number) => void
    updateScore: (score: number) => void
    updateBest: (best: number) => void
    showHighscoreDialog: () => void
    hideHighscoreDialog: () => void
    triggerLeaderboardRefresh: () => void
    resetGame: () => void
}

export function useGameState(): UseGameStateReturn {
    const [state, dispatch] = useReducer(gameStateReducer, initialState)

    const startGame = useCallback(() => {
        dispatch({ type: 'START_GAME' })
    }, [])

    const pauseGame = useCallback(() => {
        dispatch({ type: 'PAUSE_GAME' })
    }, [])

    const resumeGame = useCallback(() => {
        dispatch({ type: 'RESUME_GAME' })
    }, [])

    const gameOver = useCallback((score: number) => {
        dispatch({ type: 'GAME_OVER', score })
    }, [])

    const updateScore = useCallback((score: number) => {
        dispatch({ type: 'UPDATE_SCORE', score })
    }, [])

    const updateBest = useCallback((best: number) => {
        dispatch({ type: 'UPDATE_BEST', best })
    }, [])

    const showHighscoreDialog = useCallback(() => {
        dispatch({ type: 'SHOW_HIGHSCORE_DIALOG' })
    }, [])

    const hideHighscoreDialog = useCallback(() => {
        dispatch({ type: 'HIDE_HIGHSCORE_DIALOG' })
    }, [])

    const triggerLeaderboardRefresh = useCallback(() => {
        dispatch({ type: 'TRIGGER_LEADERBOARD_REFRESH' })
    }, [])

    const resetGame = useCallback(() => {
        dispatch({ type: 'RESET_GAME' })
    }, [])

    return {
        state,
        startGame,
        pauseGame,
        resumeGame,
        gameOver,
        updateScore,
        updateBest,
        showHighscoreDialog,
        hideHighscoreDialog,
        triggerLeaderboardRefresh,
        resetGame,
    }
}
