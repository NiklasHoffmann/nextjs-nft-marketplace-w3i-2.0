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