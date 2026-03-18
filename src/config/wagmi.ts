import { http, webSocket, fallback } from 'wagmi'
import { mainnet, polygon, base, sepolia } from 'wagmi/chains'
import { connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit'
import {
    injectedWallet,
    coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig } from 'wagmi'
import { createPublicClient } from 'viem'
import { devLog } from '@/utils'

export const appName = 'Next.js NFT Marketplace W3i 2.0'

// WebSocket URL für Sepolia
const SEPOLIA_WSS = process.env.NEXT_PUBLIC_WSS_SEPOLIA || "wss://sepolia.infura.io/ws/v3/2c8fdbbe1b46451fa44c97b461ccb3c5"
const SEPOLIA_HTTP = process.env.NEXT_PUBLIC_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"

// Viem Public Client für direkte Blockchain-Interaktionen
// Verwendet fallback: WebSocket im Browser, HTTP auf Server
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: typeof window !== 'undefined' 
        ? webSocket(SEPOLIA_WSS) // Browser: Real-time WebSocket
        : http(SEPOLIA_HTTP) // Server: HTTP (WebSocket funktioniert nicht in Node.js)
})

// Project ID für WalletConnect - WICHTIG: Muss eine echte ID von https://cloud.walletconnect.com sein
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Validierung der Project ID
if (!projectId) {
    devLog.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ist nicht gesetzt. WalletConnect wird möglicherweise nicht funktionieren.')
    devLog.warn('📝 Erstelle eine Project ID auf https://cloud.walletconnect.com')
}

// Wallet setup:
// - With WalletConnect projectId: use RainbowKit default wallet list (broad support)
// - Without projectId: keep deterministic injected/coinbase fallback
const connectors = projectId
    ? getDefaultWallets({
        appName,
        projectId,
    }).connectors
    : connectorsForWallets(
        [
            {
                groupName: 'Recommended',
                wallets: [
                    injectedWallet,
                    coinbaseWallet,
                ],
            },
        ],
        {
            appName,
            projectId: '',
        }
    )

export const wagmiConfig = createConfig({
    connectors,
    chains: [sepolia, mainnet, polygon, base],
    transports: {
        // Sepolia: WebSocket im Browser (real-time), HTTP auf Server (fallback)
        [sepolia.id]: typeof window !== 'undefined'
            ? fallback([
                webSocket(SEPOLIA_WSS),
                http(SEPOLIA_HTTP)
              ])
            : http(SEPOLIA_HTTP),
        [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_MAINNET || 'https://eth.llamarpc.com'),
        [polygon.id]: http(process.env.NEXT_PUBLIC_RPC_POLYGON || 'https://polygon.llamarpc.com'),
        [base.id]: http(process.env.NEXT_PUBLIC_RPC_BASE || 'https://base.llamarpc.com'),
    },
    // Client-only wallet UX (RainbowKit modals, QR pairing) is more reliable here without SSR hydration.
    ssr: false,
})
