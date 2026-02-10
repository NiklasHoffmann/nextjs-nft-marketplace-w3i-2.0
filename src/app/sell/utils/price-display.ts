export const formatTokenDisplay = (amount: string | number, decimals: number, maxDecimals = 4) => {
    const safeDecimals = Math.max(0, Math.min(maxDecimals, decimals));
    const normalized = typeof amount === 'number'
        ? amount.toFixed(Math.min(6, decimals))
        : amount;

    if (!normalized.includes('.')) return normalized;

    const [whole, fraction] = normalized.split('.');
    const trimmedFraction = (fraction || '').slice(0, safeDecimals).replace(/0+$/, '');
    return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
};
