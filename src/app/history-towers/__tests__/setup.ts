import { afterEach, vi } from 'vitest'
import { TextDecoder, TextEncoder } from 'util'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder
}

if (!globalThis.TextDecoder) {
    globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder
}

if (!globalThis.fetch) {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('fetch not mocked'))) as unknown as typeof fetch
}

// Mock HTMLCanvasElement if needed
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    canvas: {
        width: 480,
        height: 960,
    },
})) as any
