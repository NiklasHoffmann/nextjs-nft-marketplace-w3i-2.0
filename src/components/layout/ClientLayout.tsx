"use client";

import React, { type ErrorInfo } from "react";
import dynamic from 'next/dynamic';
import { ErrorBoundary } from "react-error-boundary";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { NFTStatsProvider } from "@/contexts/nft-stats/NFTStatsContext";
import { MarketplaceItemsProvider } from "@/contexts/marketplace-items";
import { WalletNFTsProvider } from "@/contexts/wallet-nfts";
import { CollectionsProvider } from "@/contexts/collections";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider, NotificationContainer } from "@/contexts/notifications";
import { AdminGuard } from "@/components/auth";
import { APP_LOCK_ENABLED } from '@/config/admin';
import { MarketplaceEventsProvider, EventConnectionStatus } from "@/providers/MarketplaceEventsProvider";
import AdminNavbar from '@/app/admin/components/AdminNavbar';
import Web3Provider from './Web3Provider';
import { usePathname, useRouter } from 'next/navigation';
import { devLog } from '@/utils';
import * as Sentry from '@sentry/nextjs';

const DefaultNavbar = dynamic(() => import('./Navbar'));

// --- Simple global fallback UI for render errors ---
function GlobalErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  devLog.error('[GlobalErrorFallback]', error);
  Sentry.captureException(error);
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
      {isAdminRoute ? <AdminNavbar /> : <DefaultNavbar />}
      
      {/* Real-time connection status indicator (bottom-right corner) */}
      {!isAdminRoute && <EventConnectionStatus />}
      
      <main className="flex-1">{children}</main>
    </div>
  );
}

const CHUNK_RELOAD_GUARD_KEY = 'chunk-reload-guard-v1';

const isChunkLoadRelatedError = (input: unknown): boolean => {
  const message = input instanceof Error
    ? input.message
    : typeof input === 'string'
      ? input
      : JSON.stringify(input || '');

  const normalized = message.toLowerCase();
  return (
    normalized.includes('loading chunk') ||
    normalized.includes('chunkloaderror') ||
    normalized.includes('failed to fetch dynamically imported module')
  );
};

const shouldReloadForChunkError = (pathname: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const raw = window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY);
    const now = Date.now();

    if (!raw) {
      window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, JSON.stringify({ pathname, ts: now }));
      return true;
    }

    const parsed = JSON.parse(raw) as { pathname?: string; ts?: number };
    const samePath = parsed?.pathname === pathname;
    const isRecent = typeof parsed?.ts === 'number' && (now - parsed.ts) < 30_000;

    if (samePath && isRecent) {
      return false;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, JSON.stringify({ pathname, ts: now }));
    return true;
  } catch {
    return true;
  }
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const pathname = usePathname() || '';
  const router = useRouter();
  const isAdminRoute = pathname.startsWith('/admin');
  // Admin routes are protected by middleware + app/admin/layout.tsx (AdminAuthGuard).
  // Keep the global AdminGuard only for full app-lock mode on non-admin pages.
  const needsAdminGuard = APP_LOCK_ENABLED && !isAdminRoute;

  // Keep providers persistent across all public pages to avoid cache resets and refetches
  // when navigating between marketplace, nft detail, wallet, sell, etc.
  const needsWalletNFTs = !isAdminRoute;

  const needsCollections = !isAdminRoute;

  const needsMarketplaceItems = !isAdminRoute;

  const innerContent = (
    <CurrencyProvider>
      <CartProvider>
        <LayoutContent>{children}</LayoutContent>
        <NotificationContainer />
      </CartProvider>
    </CurrencyProvider>
  );

  const content = needsAdminGuard
    ? <AdminGuard>{innerContent}</AdminGuard>
    : innerContent;

  const withCollections = needsCollections
    ? <CollectionsProvider>{content}</CollectionsProvider>
    : content;

  const withWallet = needsWalletNFTs
    ? <WalletNFTsProvider>{withCollections}</WalletNFTsProvider>
    : withCollections;

  const withMarketplaceItems = needsMarketplaceItems
    ? <MarketplaceItemsProvider>{withWallet}</MarketplaceItemsProvider>
    : withWallet;

  React.useEffect(() => {
    const onWindowError = (event: ErrorEvent) => {
      const candidate = event.error || event.message;
      if (!isChunkLoadRelatedError(candidate)) return;

      if (shouldReloadForChunkError(pathname)) {
        window.location.reload();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isChunkLoadRelatedError(event.reason)) return;

      if (shouldReloadForChunkError(pathname)) {
        window.location.reload();
      }
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [pathname]);

  React.useEffect(() => {
    if (isAdminRoute) return;

    // Warm key public routes so return-navigation feels instant.
    const prefetchRoutes = ['/marketplace', '/wallet', '/sell', '/cart'] as const;
    prefetchRoutes.forEach((route) => {
      router.prefetch(route);
    });
  }, [isAdminRoute, router]);
  
  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onError={(error: Error, info: ErrorInfo) => {
        devLog.error('[React ErrorBoundary]', { error, info });
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
      }}
    >
      <NotificationProvider>
        <Web3Provider>
          <NFTStatsProvider>
            {/* Real-time WebSocket event listener for marketplace */}
            <MarketplaceEventsProvider 
              autoStart={true}
              debug={isDevelopment}
            >
              {withMarketplaceItems}
            </MarketplaceEventsProvider>
          </NFTStatsProvider>
        </Web3Provider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
