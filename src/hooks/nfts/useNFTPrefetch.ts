/**
 * @deprecated Hook wird nicht mehr verwendet - kein aktiver Import gefunden
 * Prefetch FunktionalitÃ¤t kann direkt Ã¼ber Next.js router.prefetch() genutzt werden
 * Migration: Verwende router.prefetch() direkt in Komponenten wo benÃ¶tigt
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
