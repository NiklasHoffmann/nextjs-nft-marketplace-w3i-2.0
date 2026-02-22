"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

interface OneInchTokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

interface OneInchQuote {
  srcToken: OneInchTokenInfo;
  dstToken: OneInchTokenInfo;
  dstAmount: string;
  srcAmount: string;
  protocols?: unknown;
  estimatedGas?: number;
}

interface OneInchQuoteResponse {
  quote: OneInchQuote;
  provider: '1inch';
}

interface UseOneInchQuoteParams {
  chainId: number;
  src: string;
  dst: string;
  amount: string;
  includeProtocols?: boolean;
  includeTokensInfo?: boolean;
  enabled?: boolean;
}

export function useOneInchQuote({
  chainId,
  src,
  dst,
  amount,
  includeProtocols,
  includeTokensInfo,
  enabled = true,
}: UseOneInchQuoteParams) {
  const [data, setData] = useState<OneInchQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      chainId: String(chainId),
      src,
      dst,
      amount,
    });

    if (includeProtocols !== undefined) params.set('includeProtocols', String(includeProtocols));
    if (includeTokensInfo !== undefined) params.set('includeTokensInfo', String(includeTokensInfo));

    return params.toString();
  }, [chainId, src, dst, amount, includeProtocols, includeTokensInfo]);

  const fetchQuote = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/1inch/quote?${queryString}`, {
        method: 'GET',
        cache: 'no-store',
        signal,
      });

      const json = await response.json();
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to fetch 1inch quote');
      }

      setData(json.data as OneInchQuoteResponse);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to fetch 1inch quote';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, queryString]);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuote(controller.signal);
    return () => controller.abort();
  }, [fetchQuote]);

  return {
    data,
    quote: data?.quote ?? null,
    loading,
    error,
    refetch: fetchQuote,
  };
}
