'use client'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, useAccount, useReconnect } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { ApolloProvider } from '@apollo/client'
import apolloClient from '@/config/apolloClient'

function WalletConnectionSync() {
    const { isConnected, isConnecting } = useAccount();
    const { reconnect } = useReconnect();
    const isReconnectingRef = useRef(false);

    useEffect(() => {
        if (isConnected) return;

        const safeReconnect = async () => {
            if (isConnected || isConnecting || isReconnectingRef.current) return;
            isReconnectingRef.current = true;
            try {
                await reconnect();
            } catch {
                // no-op: best-effort sync for WalletConnect mobile QR flows
            } finally {
                isReconnectingRef.current = false;
            }
        };

        const onFocus = () => {
            void safeReconnect();
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void safeReconnect();
            }
        };

        const intervalId = window.setInterval(() => {
            void safeReconnect();
        }, 2500);

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        void safeReconnect();

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [isConnected, isConnecting, reconnect]);

    return null;
}

export default function Web3Provider({ children }: { children: ReactNode }) {
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

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <ApolloProvider client={apolloClient}>
                    <WalletConnectionSync />
                    <RainbowKitProvider
                        theme={darkTheme()}
                        modalSize="compact"
                        showRecentTransactions={true}
                        initialChain={wagmiConfig.chains[0]}
                    >
                        {children}
                    </RainbowKitProvider>
                </ApolloProvider>
                {/* React Query Devtools only in development */}
                {process.env.NODE_ENV !== "production" && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
