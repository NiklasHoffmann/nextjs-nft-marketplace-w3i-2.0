/**
 * Canonical NFT image URL resolution.
 *
 * For IPFS sources we always route through our local image proxy endpoint,
 * so every UI path uses the same cache/retry/compression behavior.
 */

const BARE_CID_REGEX = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58,})(\/.*)?$/;
const IMAGE_PROXY_VERSION = '7';
const IPFS_GATEWAY_PREFIXES = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/',
] as const;

export interface IpfsInfo {
    hash: string;
    path: string;
}

interface ResolveImageOptions {
    width?: number;
    tokenId?: string | number | bigint;
}

const toErc1155HexTokenId = (tokenId: string | number | bigint): string | null => {
    try {
        const raw = typeof tokenId === 'string' ? tokenId.trim() : tokenId;
        if (raw === '') return null;
        const parsed = typeof raw === 'string' ? BigInt(raw) : BigInt(raw);
        if (parsed < BigInt(0)) return null;
        return parsed.toString(16).padStart(64, '0').toLowerCase();
    } catch {
        return null;
    }
};

const applyErc1155IdTemplate = (
    input: string,
    tokenId?: string | number | bigint,
): string => {
    if (!input) return input;
    if (tokenId === undefined || tokenId === null) return input;

    const hexTokenId = toErc1155HexTokenId(tokenId);
    if (!hexTokenId) return input;

    return input
        .replace(/\{id\}/gi, hexTokenId)
        .replace(/%7Bid%7D/gi, hexTokenId);
};

const stripQueryAndFragment = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.split('#')[0]?.split('?')[0]?.trim() || '';
};

const encodeIpfsPath = (value: string): string => {
    const normalized = value
        .split('/')
        .filter((segment) => segment.length > 0)
        .map((segment) => encodeURIComponent(segment));
    return normalized.join('/');
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
    const templated = applyErc1155IdTemplate(url?.trim() || '', options?.tokenId);
    const normalized = templated;
    if (!normalized) return [];

    const ipfsInfo = extractIpfsInfoFromUrl(normalized);
    if (ipfsInfo) {
        const { hash, path } = ipfsInfo;
        const fullHash = path ? `${hash}/${path}` : hash;
        const encodedHash = encodeIpfsPath(fullHash);
        const widthParam = options?.width
            ? `&w=${Math.max(64, Math.min(2048, Math.floor(options.width)))}`
            : '';
        const gatewayCandidates = IPFS_GATEWAY_PREFIXES.map((prefix) => `${prefix}${encodedHash}`);
        return [
            `/api/nft/image/${encodedHash}?v=${IMAGE_PROXY_VERSION}${widthParam}`,
            ...gatewayCandidates,
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
