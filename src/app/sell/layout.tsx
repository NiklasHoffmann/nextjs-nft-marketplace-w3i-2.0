/**
 * Sell Route Layout
 * 
 * Centralized layout with dynamic header and flow sidebar.
 * Manages shared UI elements across all /sell routes.
 * 
 * @module sell/layout
 */

'use client';

import React, { useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { ListingFlowProvider, useListingFlow } from './contexts/ListingFlowContext';
import { SellHeader, FlowSidebar } from './components';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import type { ListingType } from './types';
import { devLog } from '@/utils';

function SellLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { formData, progressData, reset } = useListingFlow();
    const walletNFTsContext = useWalletNFTs();
    const isScrolled = useScrollPosition(80);

    // Layout metrics
    const NAVBAR_HEIGHT = 64; // Navbar height
    const HEADER_NORMAL_HEIGHT = 90; // Normal header height
    const HEADER_COMPACT_HEIGHT = 56; // Compact header height
    
    const headerHeight = isScrolled ? HEADER_COMPACT_HEIGHT : HEADER_NORMAL_HEIGHT;
    const topOffset = NAVBAR_HEIGHT + headerHeight;
    const contentPadding = topOffset + 10; // +10px for spacing

    // Reset state when leaving /sell route
    useEffect(() => {
        return () => {
            // Only reset if not navigating within /sell routes
            // This cleanup runs when the component unmounts (user leaves /sell)
            devLog.info('sell-layout', '🔄 Leaving /sell route - resetting state');
            reset();
        };
    }, []); // Empty dependency array - only run on unmount

    // Listen for listing-created events and force immediate refresh
    useEffect(() => {
        const handleInvalidation = (event: CustomEvent) => {
            const detail = event.detail;
            devLog.info('sell-layout', '🔔 Received invalidation event:', detail);

            // Force immediate refresh when listing is created/canceled
            if (detail.type === 'listing-created' || detail.type === 'listing-canceled') {
                devLog.info('sell-layout', '🔄 Forcing immediate wallet NFTs refresh');
                // Trigger manual refresh to update stats immediately
                walletNFTsContext.refresh().then(() => {
                    devLog.info('sell-layout', '✅ Wallet NFTs refreshed successfully');
                });
            }
        };

        window.addEventListener('dataInvalidation', handleInvalidation as EventListener);

        return () => {
            window.removeEventListener('dataInvalidation', handleInvalidation as EventListener);
        };
    }, [walletNFTsContext]);

    // Calculate NFT selection and type first
    const selectedCount = pathname === '/sell/success'
        ? 0
        : (formData.selectedNFTs?.length || (formData.selectedNFT ? 1 : 0));
    const listingType: ListingType = (formData.selectedNFTs?.length || 0) > 1 ? 'batch' : 'single';
    const isBatch = listingType === 'batch';

    // Dynamische Header-Konfiguration basierend auf Route
    const getHeaderConfig = () => {
        if (pathname === '/sell') {
            return {
                title: isBatch ? 'NFTs verkaufen (Batch)' : 'NFT verkaufen',
                subtitle: isBatch ? 'Erstelle mehrere Listings gleichzeitig' : 'Erstelle ein neues Listing',
                icon: 'sell' as const,
                backUrl: '/marketplace',
                backLabel: 'Zurück zum Marktplatz'
            };
        }
        if (pathname === '/sell/check-listing') {
            return {
                title: isBatch ? 'Listings überprüfen' : 'Listing überprüfen',
                subtitle: isBatch ? 'Überprüfe deine NFTs vor dem Erstellen' : 'Überprüfe deine Angaben vor dem Erstellen',
                icon: 'check' as const,
                backUrl: '/sell',
                backLabel: 'Zurück zum Formular'
            };
        }
        if (pathname === '/sell/listing') {
            return {
                title: isBatch ? 'Listings erstellen' : 'Listing erstellen',
                subtitle: isBatch ? 'Transaktionen werden verarbeitet...' : 'Transaktion wird verarbeitet...',
                icon: 'progress' as const,
                backUrl: '/sell/check-listing',
                backLabel: 'Zurück zur Vorschau'
            };
        }
        if (pathname === '/sell/success') {
            return {
                title: isBatch ? 'Erfolgreich gelistet!' : 'Erfolgreich gelistet!',
                subtitle: isBatch ? 'Deine NFTs sind jetzt auf dem Marktplatz' : 'Dein NFT ist jetzt auf dem Marktplatz',
                icon: 'success' as const,
                backUrl: '/marketplace',
                backLabel: 'Zum Marktplatz'
            };
        }
        return {
            title: isBatch ? 'NFTs verkaufen' : 'NFT verkaufen',
            subtitle: '',
            icon: 'sell' as const
        };
    };

    const headerConfig = getHeaderConfig();

    // Calculate NFT counts from WalletNFTsContext directly
    // Re-calculate when nfts array OR lastFetched changes (ensures update after refresh)
    const totalNFTs = useMemo(() => {
        const count = walletNFTsContext.nfts.length;
        devLog.info('sell-layout', `📊 Total NFTs: ${count} (lastFetched: ${walletNFTsContext.lastFetched})`);
        return count;
    }, [walletNFTsContext.nfts, walletNFTsContext.lastFetched]);

    const listedCount = useMemo(() => {
        const count = walletNFTsContext.nfts.filter(nft => nft.isListed || nft.listingId).length;
        devLog.info('sell-layout', `📊 Listed NFTs: ${count}`);
        return count;
    }, [walletNFTsContext.nfts, walletNFTsContext.lastFetched]);

    const unlistedCount = useMemo(() => {
        const count = walletNFTsContext.nfts.filter(nft => !nft.isListed && !nft.listingId).length;
        devLog.info('sell-layout', `📊 Unlisted NFTs: ${count}`);
        return count;
    }, [walletNFTsContext.nfts, walletNFTsContext.lastFetched]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            <SellHeader
                title={headerConfig.title}
                subtitle={headerConfig.subtitle}
                icon={headerConfig.icon}
                backUrl={headerConfig.backUrl}
                backLabel={headerConfig.backLabel}
                totalNFTs={totalNFTs}
                listedCount={listedCount}
                unlistedCount={unlistedCount}
                selectedCount={selectedCount}
            />

            {/* Main Content with Sidebar Layout */}
            <div className="flex transition-all duration-300" style={{ paddingTop: `${contentPadding}px` }}>
                {/* Flow Sidebar - sticky und direkt unter dem SellHeader */}
                <div 
                    className="w-64 flex-shrink-0 sticky self-start overflow-y-auto bg-white border-r border-gray-200 transition-all duration-300"
                    style={{ 
                        top: `${topOffset}px`,
                        height: `calc(100vh - ${topOffset}px)`
                    }}
                >
                    <div className="px-4 py-4">
                        <FlowSidebar
                            whitelistStatus={progressData.whitelistStatus || 'not-started'}
                            approvalStatus={progressData.approvalStatus || 'not-started'}
                            selectedCount={selectedCount}
                            totalNFTs={totalNFTs}
                            filteredCount={unlistedCount}
                            listingType={listingType}
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 px-8 py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
    return (
        <ListingFlowProvider>
            <SellLayoutContent>
                {children}
            </SellLayoutContent>
        </ListingFlowProvider>
    );
}
