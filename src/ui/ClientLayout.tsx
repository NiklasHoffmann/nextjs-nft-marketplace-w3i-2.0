"use client";

import React, { useState, type ErrorInfo } from "react";
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorBoundary } from "react-error-boundary";
import { ApolloProvider } from "@apollo/client/react";
import apolloClient from "../config/apolloClient";
import { wagmiConfig } from "@/config/wagmi";
import "@/utils/bigint"; // Import BigInt serialization support
import Navbar from "@/components/Navbar";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

// --- Simple global fallback UI for render errors ---
function GlobalErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // TODO: hier an Sentry/Log-Backend senden
  if (process.env.NODE_ENV !== "production") {
    console.error("[GlobalErrorFallback]", error);
  }
  return (
    <div className="p-4 m-4 rounded-xl border border-red-300 bg-red-50 text-red-900">
      <h2 className="font-semibold mb-2">Uups, da ist etwas schiefgelaufen.</h2>
      <p className="text-sm opacity-90 mb-3">
        {error.message || "Unbekannter Fehler. Versuche es bitte erneut."}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-3 py-1 rounded-md border border-red-400 hover:bg-white/50"
      >
        Neu laden
      </button>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // React Query: ein stabiler Client für die gesamte App
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // konservativ: Daten 60s "frisch", Fehler werden geloggt
            staleTime: 60_000,
            retry: (failureCount, error: unknown) => {
              const errorObj = error as { status?: number; response?: { status?: number } };
              const status = errorObj?.status || errorObj?.response?.status || 0;
              // bei "harte" 4xx außer 408/429, nicht retryen
              if (status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onError={(error: Error, info: ErrorInfo) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[React ErrorBoundary]", { error, info });
        }
        // TODO: Sentry.captureException(error)
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme()}>
            <ApolloProvider client={apolloClient}>
              <CurrencyProvider>
                <div>
                  <Navbar />
                  <main>{children}</main>
                </div>
              </CurrencyProvider>
            </ApolloProvider>
            {/* Optional: Devtools nur in Dev */}
            {process.env.NODE_ENV !== "production" && <ReactQueryDevtools initialIsOpen={false} />}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
