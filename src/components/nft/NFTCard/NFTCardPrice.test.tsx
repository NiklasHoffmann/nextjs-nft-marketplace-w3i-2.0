import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { NFTCardPrice } from './NFTCardPrice';

vi.mock('wagmi', () => ({
  useChainId: () => 11155111,
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatPrice: (value: number) => `$${value.toFixed(2)}`,
    convertTokenToUSD: vi.fn().mockResolvedValue(0),
    convertFromUSD: vi.fn().mockResolvedValue(0),
  }),
}));

vi.mock('@/config/tokens', () => ({
  getCurrencySymbolByAddress: () => 'ETH',
  getTokenDecimalsByAddress: () => 18,
}));

afterEach(() => {
  cleanup();
});

describe('NFTCardPrice swap/sell badge', () => {
  const baseProps = {
    price: '1000000000000000000',
    isListed: true,
  } as const;

  it('shows Sell for PURE_ETH listing', () => {
    render(
      <NFTCardPrice
        {...baseProps}
        listingType="PURE_ETH"
      />
    );

    expect(screen.getByText('Sell')).toBeTruthy();
  });

  it('shows Swap for PURE_SWAP listing', () => {
    render(
      <NFTCardPrice
        {...baseProps}
        listingType="PURE_SWAP"
      />
    );

    expect(screen.getByText('Swap')).toBeTruthy();
  });

  it('shows Swap for SWAP_AND_ETH listing', () => {
    render(
      <NFTCardPrice
        {...baseProps}
        listingType="SWAP_AND_ETH"
      />
    );

    expect(screen.getByText('Swap')).toBeTruthy();
  });

  it('shows Swap for legacy data when desired contract and token id are present', () => {
    render(
      <NFTCardPrice
        {...baseProps}
        listingType={null}
        desiredContractAddress="0x1234567890123456789012345678901234567890"
        desiredTokenId="42"
      />
    );

    expect(screen.getByText('Swap')).toBeTruthy();
  });

  it('shows Swap for legacy data when desired contract exists but token id is missing', () => {
    render(
      <NFTCardPrice
        {...baseProps}
        listingType={null}
        desiredContractAddress="0x1234567890123456789012345678901234567890"
      />
    );

    expect(screen.getByText('Swap')).toBeTruthy();
  });

  it('shows Sell when there is no swap signal at all', () => {
    render(
      <NFTCardPrice
        {...baseProps}
        listingType={null}
        desiredContractAddress={null}
        desiredTokenId={null}
      />
    );

    expect(screen.getByText('Sell')).toBeTruthy();
  });
});
