"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ZERO_ADDRESS, isNativeETH } from '@/config/tokens';

interface OneInchApproveTx {
  to: string;
  data: string;
  value: string;
  gasPrice?: string;
}

interface UseOneInchApprovalParams {
  chainId: number;
  tokenAddress?: string;
  walletAddress?: string;
  requiredAmount?: string;
  enabled?: boolean;
}

export function useOneInchApproval({
  chainId,
  tokenAddress,
  walletAddress,
  requiredAmount,
  enabled = true,
}: UseOneInchApprovalParams) {
  const [spender, setSpender] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedTokenAddress = useMemo(() => tokenAddress || ZERO_ADDRESS, [tokenAddress]);
  const isSourceNative = useMemo(() => isNativeETH(normalizedTokenAddress), [normalizedTokenAddress]);

  const refresh = useCallback(async () => {
    if (!enabled || !walletAddress || !normalizedTokenAddress) {
      setSpender(null);
      setAllowance('0');
      setError(null);
      setLoading(false);
      return;
    }

    if (isSourceNative) {
      setSpender(null);
      setAllowance('0');
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const spenderParams = new URLSearchParams({ chainId: String(chainId) });
      const spenderResponse = await fetch(`/api/integrations/1inch/approve/spender?${spenderParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const spenderJson = await spenderResponse.json();
      if (!spenderResponse.ok || !spenderJson?.success) {
        throw new Error(spenderJson?.error || 'Failed to fetch 1inch spender');
      }

      const spenderAddress = String(spenderJson.data?.spender?.address || '');
      if (!spenderAddress) {
        throw new Error('Invalid 1inch spender response');
      }

      const allowanceParams = new URLSearchParams({
        chainId: String(chainId),
        tokenAddress: normalizedTokenAddress,
        walletAddress,
      });

      const allowanceResponse = await fetch(`/api/integrations/1inch/approve/allowance?${allowanceParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const allowanceJson = await allowanceResponse.json();
      if (!allowanceResponse.ok || !allowanceJson?.success) {
        throw new Error(allowanceJson?.error || 'Failed to fetch 1inch allowance');
      }

      setSpender(spenderAddress);
      setAllowance(String(allowanceJson.data?.allowance?.allowance || '0'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load 1inch approval data';
      setError(message);
      setSpender(null);
      setAllowance('0');
    } finally {
      setLoading(false);
    }
  }, [enabled, walletAddress, normalizedTokenAddress, isSourceNative, chainId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const needsApproval = useMemo(() => {
    if (!enabled || isSourceNative) return false;
    if (!requiredAmount) return false;

    try {
      return BigInt(allowance || '0') < BigInt(requiredAmount);
    } catch {
      return true;
    }
  }, [enabled, isSourceNative, allowance, requiredAmount]);

  const prepareApproveTransaction = useCallback(async (amount?: string): Promise<OneInchApproveTx> => {
    if (isSourceNative) {
      throw new Error('Native ETH does not require token approval');
    }

    if (!normalizedTokenAddress) {
      throw new Error('Token address is required');
    }

    const params = new URLSearchParams({
      chainId: String(chainId),
      tokenAddress: normalizedTokenAddress,
    });

    if (amount) {
      params.set('amount', amount);
    }

    const response = await fetch(`/api/integrations/1inch/approve/transaction?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || 'Failed to prepare 1inch approval transaction');
    }

    const tx = json.data?.transaction as OneInchApproveTx | undefined;
    if (!tx?.to || !tx?.data) {
      throw new Error('Invalid 1inch approval transaction response');
    }

    return tx;
  }, [isSourceNative, normalizedTokenAddress, chainId]);

  return {
    spender,
    allowance,
    needsApproval,
    loading,
    error,
    isSourceNative,
    refresh,
    prepareApproveTransaction,
  };
}
