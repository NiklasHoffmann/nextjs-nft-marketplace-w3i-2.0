"use client";

import { useCallback, useState } from 'react';

interface OneInchSwapTx {
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice?: string;
  gas?: string;
}

interface OneInchSwapResult {
  dstAmount: string;
  tx: OneInchSwapTx;
  protocols?: unknown;
}

interface PrepareSwapParams {
  chainId: number;
  src: string;
  dst: string;
  amount: string;
  from: string;
  slippage: number;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
  includeProtocols?: boolean;
  includeTokensInfo?: boolean;
}

export function useOneInchSwap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapTx, setSwapTx] = useState<OneInchSwapTx | null>(null);
  const [result, setResult] = useState<OneInchSwapResult | null>(null);

  const prepareSwap = useCallback(async (params: PrepareSwapParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/1inch/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const json = await response.json();
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to prepare 1inch swap');
      }

      const swap = json.data?.swap;
      if (!swap?.tx) {
        throw new Error('Invalid 1inch swap response');
      }

      setSwapTx(swap.tx as OneInchSwapTx);
      setResult({
        dstAmount: String(swap.dstAmount || '0'),
        tx: swap.tx as OneInchSwapTx,
        protocols: swap.protocols,
      });

      return swap.tx as OneInchSwapTx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare 1inch swap';
      setError(message);
      setSwapTx(null);
      setResult(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSwapTx(null);
    setResult(null);
  }, []);

  return {
    loading,
    error,
    swapTx,
    result,
    prepareSwap,
    reset,
  };
}
