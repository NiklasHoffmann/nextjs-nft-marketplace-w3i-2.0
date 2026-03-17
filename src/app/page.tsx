// app/page.tsx
'use client';

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import Link from "next/link";
import { HOME_CONFIG } from "@/config/app.config";
import { LoadingState } from '@/components/core/Loading';

export default function Home() {
  const router = useRouter();

  const prefetchMarketplace = useCallback(() => {
    router.prefetch('/marketplace');
    if (typeof window !== 'undefined') {
      // Warm API + DB/cache path so first click in incognito feels faster.
      fetch('/api/marketplace/items?page=1&limit=20&sortBy=price&sortOrder=desc&includeFilters=true', {
        method: 'GET',
        cache: 'no-store',
        keepalive: true,
      }).catch(() => {
        // Non-critical warmup.
      });
    }
  }, [router]);

  // Redirect if enabled
  useEffect(() => {
    if (HOME_CONFIG.ENABLE_REDIRECT) {
      router.replace(HOME_CONFIG.REDIRECT_TARGET);
    }
  }, [router]);

  useEffect(() => {
    if (HOME_CONFIG.ENABLE_REDIRECT) return;

    // Start warming marketplace route/data shortly after home renders.
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchMarketplace, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = setTimeout(prefetchMarketplace, 400);
    return () => clearTimeout(timer);
  }, [prefetchMarketplace]);

  // Show redirect loading state if enabled
  if (HOME_CONFIG.ENABLE_REDIRECT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingState
          size="lg"
          variant="centered"
          message={`Weiterleitung zu ${HOME_CONFIG.REDIRECT_TARGET}...`}
        />
      </div>
    );
  }

  // Main landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Ideationmarket
            </h1>
            <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Trade, collect, and discover unique digital utilities on our next-generation Web3 marketplace
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/marketplace"
                prefetch={true}
                onMouseEnter={prefetchMarketplace}
                onFocus={prefetchMarketplace}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg transform hover:scale-105"
              >
                🏪 Explore Marketplace
              </Link>
              <button
                onClick={() => router.push('/wallet')}
                className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg border-2 border-gray-200 transform hover:scale-105"
              >
                👛 My Wallet
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Feature 1: Browse Collections */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse Collections</h3>
              <p className="text-gray-600 mb-4">
                Discover unique Utilities collections with detailed insights, rarity scores, and real-time marketplace data.
              </p>
              <Link
                href="/marketplace"
                prefetch={true}
                onMouseEnter={prefetchMarketplace}
                onFocus={prefetchMarketplace}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center gap-2"
              >
                View Collections
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 2: Trade NFTs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Buy & Sell Utilities</h3>
              <p className="text-gray-600 mb-4">
                List your Utilities for sale with ETH or trade directly with other Utilities. Batch purchases save on gas fees.
              </p>
              <button
                onClick={() => router.push('/sell')}
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors flex items-center gap-2"
              >
                Start Trading
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 3: Wallet Management */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Manage Your Wallet</h3>
              <p className="text-gray-600 mb-4">
                View your Utilities portfolio, track sales proceeds, and manage your listings in one place.
              </p>
              <button
                onClick={() => router.push('/wallet')}
                className="text-green-600 font-semibold hover:text-green-700 transition-colors flex items-center gap-2"
              >
                Open Wallet
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 4: Shopping Cart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Batch Purchases</h3>
              <p className="text-gray-600 mb-4">
                Add multiple Utilities to your cart and purchase them all in a single transaction to save on gas.
              </p>
              <button
                onClick={() => router.push('/cart')}
                className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-2"
              >
                View Cart
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 5: Enhanced Insights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enhanced Utilities Insights</h3>
              <p className="text-gray-600 mb-4">
                Get detailed Utilities insights including custom titles, categories, descriptions, and rarity information.
              </p>
              <Link
                href="/marketplace"
                prefetch={true}
                onMouseEnter={prefetchMarketplace}
                onFocus={prefetchMarketplace}
                className="text-pink-600 font-semibold hover:text-pink-700 transition-colors flex items-center gap-2"
              >
                Explore Insights
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 6: History Towers Game */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Play History Towers</h3>
              <p className="text-gray-600 mb-4">
                Earn rewards by playing our integrated blockchain game. Test your skills and compete on the leaderboard.
              </p>
              <button
                onClick={() => router.push('/history-towers')}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors flex items-center gap-2"
              >
                Start Playing
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">Real-Time</div>
                <div className="text-gray-600 font-medium">Marketplace Sync</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">Multi-Chain</div>
                <div className="text-gray-600 font-medium">NFT Support</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">Gas-Efficient</div>
                <div className="text-gray-600 font-medium">Batch Purchases</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">Enhanced</div>
                <div className="text-gray-600 font-medium">Utilities Insights</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
