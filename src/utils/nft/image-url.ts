/**
 * Canonical NFT image URL resolution.
 *
 * For IPFS sources we always route through our local image proxy endpoint,
 * so every UI path uses the same cache/retry/compression behavior.
 */

const BARE_CID_REGEX = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58,})(\/.*)?$/;
const IMAGE_PROXY_VERSION = '7';

export interface IpfsInfo {
    hash: string;
    path: string;
}

interface ResolveImageOptions {
    width?: number;
}

const stripQueryAndFragment = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.split('#')[0]?.split('?')[0]?.trim() || '';
};

export const extractIpfsInfoFromUrl = (url: string): IpfsInfo | null => {
    const normalized = url?.trim() || '';
    if (!normalized) return null;

    if (/^ipfs:\/\//i.test(normalized)) {
        const withoutProtocol = stripQueryAndFragment(normalized.replace(/^ipfs:\/\//i, ''));
        const parts = withoutProtocol.split('/');
        const startsWithIpfsPrefix = parts[0]?.toLowerCase() === 'ipfs';
        const hashIndex = startsWithIpfsPrefix ? 1 : 0;
        const hash = stripQueryAndFragment(parts[hashIndex] || '');
        const path = stripQueryAndFragment(parts.slice(hashIndex + 1).join('/'));
        return hash ? { hash, path } : null;
    }

    if (normalized.includes('/ipfs/')) {
        const afterIpfs = stripQueryAndFragment(normalized.split('/ipfs/')[1] || '');
        if (!afterIpfs) return null;
        const parts = afterIpfs.split('/');
        const startsWithIpfsPrefix = parts[0]?.toLowerCase() === 'ipfs';
        const hashIndex = startsWithIpfsPrefix ? 1 : 0;
        const hash = stripQueryAndFragment(parts[hashIndex] || '');
        const path = stripQueryAndFragment(parts.slice(hashIndex + 1).join('/'));
        return hash ? { hash, path } : null;
    }

    const bareMatch = BARE_CID_REGEX.exec(normalized);
    if (bareMatch) {
        const hash = stripQueryAndFragment(bareMatch[1]!);
        const path = stripQueryAndFragment(bareMatch[2] ? bareMatch[2].slice(1) : '');
        return { hash, path };
    }

    return null;
};

export const resolveNftImageCandidates = (url: string, options?: ResolveImageOptions): string[] => {
    const normalized = url?.trim() || '';
    if (!normalized) return [];

    const ipfsInfo = extractIpfsInfoFromUrl(normalized);
    if (ipfsInfo) {
        const { hash, path } = ipfsInfo;
        const fullHash = path ? `${hash}/${path}` : hash;
        const widthParam = options?.width
            ? `&w=${Math.max(64, Math.min(2048, Math.floor(options.width)))}`
            : '';
        return [
            `/api/nft/image/${encodeURIComponent(fullHash)}?v=${IMAGE_PROXY_VERSION}${widthParam}`,
        ];
    }

    if (/^https?:\/\//i.test(normalized)) {
        return [normalized];
    }

    if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return [normalized];
    }

    // Allow local static fallback images like /media/custom-nft.jpg
    if (normalized.startsWith('/')) {
        return [normalized];
    }

    return [];
};

export const resolveNftImageUrl = (
    url: string,
    fallback: string = '',
    options?: ResolveImageOptions,
): string => {
    const candidates = resolveNftImageCandidates(url, options);
    return candidates[0] || fallback;
};
