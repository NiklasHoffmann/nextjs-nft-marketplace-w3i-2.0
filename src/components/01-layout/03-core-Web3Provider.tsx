'use client'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState, useEffect } from 'react'

export default function Web3Provider({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false)

    // React Query: optimized for Web3 operations
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Web3 data can be cached longer due to blockchain immutability
                        staleTime: 60_000, // 1 minute
                        retry: (failureCount, error: unknown) => {
                            const errorObj = error as { status?: number; response?: { status?: number } };
                            const status = errorObj?.status || errorObj?.response?.status || 0;
                            // Don't retry on hard 4xx errors except 408/429
                            if (status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
                            return failureCount < 3;
                        },
                    },
                },
            })
    );

    // Prevent hydration errors
    useEffect(() => {
        setMounted(true)
    }, [])

    // Zeige einen Loader während der Hydration
    if (!mounted) {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme()}
                    modalSize="compact"
                    showRecentTransactions={true}
                    initialChain={wagmiConfig.chains[0]} // Setzt Sepolia als Standard
                >
                    {children}
                </RainbowKitProvider>
                {/* React Query Devtools only in development */}
                {process.env.NODE_ENV !== "production" && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
