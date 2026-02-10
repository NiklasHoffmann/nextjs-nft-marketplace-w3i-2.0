"use client";

import React, { type ErrorInfo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ApolloProvider } from "@apollo/client/react";
import apolloClient from '@/config/apolloClient';
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { NFTStatsProvider } from "@/contexts/nft-stats/NFTStatsContext";
import { MarketplaceItemsProvider } from "@/contexts/marketplace-items";
import { WalletNFTsProvider } from "@/contexts/wallet-nfts";
import { CollectionsProvider } from "@/contexts/collections";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider, NotificationContainer } from "@/contexts/notifications";
import { AdminGuard } from "@/components/auth";
import { MarketplaceEventsProvider, EventConnectionStatus } from "@/providers/MarketplaceEventsProvider";
import Navbar from './Navbar';
import AdminNavbar from '@/app/admin/components/AdminNavbar';
import Web3Provider from './Web3Provider';
import { usePathname } from 'next/navigation';

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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminRoute ? <AdminNavbar /> : <Navbar />}
      
      {/* Real-time connection status indicator (bottom-right corner) */}
      {!isAdminRoute && <EventConnectionStatus />}
      
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
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
      <NotificationProvider>
        <Web3Provider>
          <ApolloProvider client={apolloClient}>
            <NFTStatsProvider>
              {/* Real-time WebSocket event listener for marketplace */}
              <MarketplaceEventsProvider 
                autoStart={true}
                debug={isDevelopment}
              >
                <MarketplaceItemsProvider>
                  <WalletNFTsProvider>
                    <CollectionsProvider>
                      <CurrencyProvider>
                        <CartProvider>
                          <AdminGuard>
                            <LayoutContent>{children}</LayoutContent>
                            <NotificationContainer />
                          </AdminGuard>
                        </CartProvider>
                      </CurrencyProvider>
                    </CollectionsProvider>
                  </WalletNFTsProvider>
                </MarketplaceItemsProvider>
              </MarketplaceEventsProvider>
            </NFTStatsProvider>
          </ApolloProvider>
        </Web3Provider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
