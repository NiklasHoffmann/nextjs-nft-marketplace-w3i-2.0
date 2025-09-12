import { http } from 'wagmi'
import { mainnet, polygon, base, sepolia, localhost } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { createPublicClient } from 'viem'

export const appName = 'Next.js NFT Marketplace W3i 2.0'

// Viem Public Client für direkte Blockchain-Interaktionen
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"),
})

export const wagmiConfig = getDefaultConfig({
    appName,
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '2c4b1c6b8c2e8b8c5e8f8a6b8d8e8b2e9b7b7f7b',
    chains: [localhost, sepolia, mainnet, polygon, base],
    transports: {
        [localhost.id]: http('http://127.0.0.1:8545'),
        [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_SEPOLIA || 'https://ethereum-sepolia-rpc.publicnode.com'),
        [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_MAINNET || 'https://eth.llamarpc.com'),
        [polygon.id]: http(process.env.NEXT_PUBLIC_RPC_POLYGON || 'https://polygon.llamarpc.com'),
        [base.id]: http(process.env.NEXT_PUBLIC_RPC_BASE || 'https://base.llamarpc.com'),
    },
    ssr: true,
})
