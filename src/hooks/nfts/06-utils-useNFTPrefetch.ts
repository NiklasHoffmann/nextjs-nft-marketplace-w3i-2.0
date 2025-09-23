/**
 * @deprecated Hook wird nicht mehr verwendet - kein aktiver Import gefunden
 * Prefetch Funktionalität kann direkt über Next.js router.prefetch() genutzt werden
 * Migration: Verwende router.prefetch() direkt in Komponenten wo benötigt
 */
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useNFTPrefetch() {
    const router = useRouter();

    const prefetchOnHover = useCallback((nftAddress: string, tokenId: string) => {
        // Prefetch the NFT detail page for better performance
        router.prefetch(`/nft/${nftAddress}?tokenId=${tokenId}` as any);
    }, [router]);

    return {
        prefetchOnHover
    };
}