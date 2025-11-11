/**
 * Currency and price related types
 */

export interface Currency {
  symbol: string;
  name: string;
  coingeckoId: string;
  decimals: number;
}

export interface PriceData {
  usd: number;
  eur: number;
  btc: number;
  change24h: number;
}

export interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  priceData: Record<string, PriceData>;
  isLoading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
}

export interface FormattedPrice {
  value: string;
  symbol: string;
  usdValue?: string;
}
