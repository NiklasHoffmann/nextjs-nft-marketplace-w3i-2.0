import { http } from 'wagmi'
import { mainnet, polygon, base, sepolia } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
    injectedWallet,
    walletConnectWallet,
    coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig } from 'wagmi'
import { createPublicClient } from 'viem'

export const appName = 'Next.js NFT Marketplace W3i 2.0'

// Viem Public Client für direkte Blockchain-Interaktionen
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"),
})

// Project ID für WalletConnect - WICHTIG: Muss eine echte ID von https://cloud.walletconnect.com sein
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Validierung der Project ID
if (!projectId) {
    console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ist nicht gesetzt. WalletConnect wird möglicherweise nicht funktionieren.')
    console.warn('📝 Erstelle eine Project ID auf https://cloud.walletconnect.com')
}

// Simplified Connector-Konfiguration - Use injected wallet instead of MetaMask SDK
const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [
                injectedWallet,
                ...(projectId ? [walletConnectWallet] : []), // Nur hinzufügen wenn Project ID verfügbar
                coinbaseWallet,
            ],
        },
    ],
    {
        appName,
        projectId: projectId || '', // Leerer String als Fallback
    }
)

export const wagmiConfig = createConfig({
    connectors,
    chains: [sepolia, mainnet, polygon, base],
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_SEPOLIA || 'https://ethereum-sepolia-rpc.publicnode.com'),
        [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_MAINNET || 'https://eth.llamarpc.com'),
        [polygon.id]: http(process.env.NEXT_PUBLIC_RPC_POLYGON || 'https://polygon.llamarpc.com'),
        [base.id]: http(process.env.NEXT_PUBLIC_RPC_BASE || 'https://base.llamarpc.com'),
    },
    ssr: true,
})
