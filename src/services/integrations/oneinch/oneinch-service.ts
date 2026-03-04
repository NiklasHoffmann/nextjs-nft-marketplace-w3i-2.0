import { InternalError, BadRequestError } from '@/lib/api';

const ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
export const ONEINCH_NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface OneInchQuoteRequest {
  chainId: number;
  src: string;
  dst: string;
  amount: string;
  includeTokensInfo?: boolean;
  includeProtocols?: boolean;
}

export interface OneInchQuoteResponse {
  srcToken: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI?: string;
  };
  dstToken: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI?: string;
  };
  dstAmount: string;
  srcAmount: string;
  protocols?: unknown;
  estimatedGas?: number;
}

export interface OneInchSwapRequest {
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

export interface OneInchSwapResponse {
  srcToken: OneInchQuoteResponse['srcToken'];
  dstToken: OneInchQuoteResponse['dstToken'];
  dstAmount: string;
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice?: string;
    gas?: string;
  };
  protocols?: unknown;
}

export interface OneInchApprovalSpenderResponse {
  address: string;
}

export interface OneInchApprovalAllowanceResponse {
  allowance: string;
}

export interface OneInchApprovalTransactionResponse {
  data: string;
  gasPrice?: string;
  to: string;
  value: string;
}

function toBooleanParam(value: boolean | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value ? 'true' : 'false';
}

function validateAddress(address: string, field: string): void {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new BadRequestError(`${field} must be a valid address`);
  }
}

function normalizeOneInchTokenAddress(address: string): string {
  const normalized = address.trim().toLowerCase();
  if (normalized === ZERO_ADDRESS) {
    return ONEINCH_NATIVE_TOKEN_ADDRESS;
  }

  return address;
}

function validateAmount(amount: string): void {
  if (!/^\d+$/.test(amount) || amount === '0') {
    throw new BadRequestError('amount must be a positive integer string in token base units');
  }
}

function validateSlippage(slippage: number): void {
  if (!Number.isFinite(slippage) || slippage <= 0 || slippage > 50) {
    throw new BadRequestError('slippage must be a number between 0 and 50');
  }
}

export class OneInchService {
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.ONEINCH_API_KEY || process.env.ONE_INCH_API_KEY;
    if (!apiKey) {
      throw new InternalError('ONEINCH_API_KEY is not configured');
    }
    this.apiKey = apiKey;
  }

  async getQuote(params: OneInchQuoteRequest): Promise<OneInchQuoteResponse> {
    const { chainId, src, dst, amount, includeProtocols, includeTokensInfo } = params;

    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new BadRequestError('chainId must be a positive integer');
    }

    validateAddress(src, 'src');
    validateAddress(dst, 'dst');
    validateAmount(amount);

    const srcTokenAddress = normalizeOneInchTokenAddress(src);
    const dstTokenAddress = normalizeOneInchTokenAddress(dst);

    const query = new URLSearchParams({
      src: srcTokenAddress,
      dst: dstTokenAddress,
      amount,
    });

    const includeProtocolsValue = toBooleanParam(includeProtocols);
    const includeTokensInfoValue = toBooleanParam(includeTokensInfo);

    if (includeProtocolsValue) query.set('includeProtocols', includeProtocolsValue);
    if (includeTokensInfoValue) query.set('includeTokensInfo', includeTokensInfoValue);

    const url = `${ONEINCH_BASE_URL}/${chainId}/quote?${query.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let details = '';
      try {
        details = await response.text();
      } catch {
        details = '';
      }
      throw new BadRequestError(`1inch quote failed (${response.status}): ${details || response.statusText}`);
    }

    return (await response.json()) as OneInchQuoteResponse;
  }

  async getSwap(params: OneInchSwapRequest): Promise<OneInchSwapResponse> {
    const {
      chainId,
      src,
      dst,
      amount,
      from,
      slippage,
      disableEstimate,
      allowPartialFill,
      includeProtocols,
      includeTokensInfo,
    } = params;

    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new BadRequestError('chainId must be a positive integer');
    }

    validateAddress(src, 'src');
    validateAddress(dst, 'dst');
    validateAddress(from, 'from');
    validateAmount(amount);
    validateSlippage(slippage);

    const srcTokenAddress = normalizeOneInchTokenAddress(src);
    const dstTokenAddress = normalizeOneInchTokenAddress(dst);

    const query = new URLSearchParams({
      src: srcTokenAddress,
      dst: dstTokenAddress,
      amount,
      from,
      slippage: String(slippage),
    });

    const disableEstimateValue = toBooleanParam(disableEstimate);
    const allowPartialFillValue = toBooleanParam(allowPartialFill);
    const includeProtocolsValue = toBooleanParam(includeProtocols);
    const includeTokensInfoValue = toBooleanParam(includeTokensInfo);

    if (disableEstimateValue) query.set('disableEstimate', disableEstimateValue);
    if (allowPartialFillValue) query.set('allowPartialFill', allowPartialFillValue);
    if (includeProtocolsValue) query.set('includeProtocols', includeProtocolsValue);
    if (includeTokensInfoValue) query.set('includeTokensInfo', includeTokensInfoValue);

    const url = `${ONEINCH_BASE_URL}/${chainId}/swap?${query.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let details = '';
      try {
        details = await response.text();
      } catch {
        details = '';
      }
      throw new BadRequestError(`1inch swap failed (${response.status}): ${details || response.statusText}`);
    }

    return (await response.json()) as OneInchSwapResponse;
  }

  async getApprovalSpender(chainId: number): Promise<OneInchApprovalSpenderResponse> {
    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new BadRequestError('chainId must be a positive integer');
    }

    const url = `${ONEINCH_BASE_URL}/${chainId}/approve/spender`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new BadRequestError(`1inch approval spender failed (${response.status}): ${details || response.statusText}`);
    }

    return (await response.json()) as OneInchApprovalSpenderResponse;
  }

  async getApprovalAllowance(chainId: number, tokenAddress: string, walletAddress: string): Promise<OneInchApprovalAllowanceResponse> {
    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new BadRequestError('chainId must be a positive integer');
    }

    validateAddress(tokenAddress, 'tokenAddress');
    validateAddress(walletAddress, 'walletAddress');

    const query = new URLSearchParams({
      tokenAddress: normalizeOneInchTokenAddress(tokenAddress),
      walletAddress,
    });

    const url = `${ONEINCH_BASE_URL}/${chainId}/approve/allowance?${query.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new BadRequestError(`1inch approval allowance failed (${response.status}): ${details || response.statusText}`);
    }

    return (await response.json()) as OneInchApprovalAllowanceResponse;
  }

  async getApprovalTransaction(chainId: number, tokenAddress: string, amount?: string): Promise<OneInchApprovalTransactionResponse> {
    if (!Number.isFinite(chainId) || chainId <= 0) {
      throw new BadRequestError('chainId must be a positive integer');
    }

    validateAddress(tokenAddress, 'tokenAddress');
    if (amount !== undefined) {
      validateAmount(amount);
    }

    const query = new URLSearchParams({
      tokenAddress: normalizeOneInchTokenAddress(tokenAddress),
    });

    if (amount !== undefined) {
      query.set('amount', amount);
    }

    const url = `${ONEINCH_BASE_URL}/${chainId}/approve/transaction?${query.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new BadRequestError(`1inch approval transaction failed (${response.status}): ${details || response.statusText}`);
    }

    return (await response.json()) as OneInchApprovalTransactionResponse;
  }
}

let oneInchService: OneInchService | null = null;

export function getOneInchService(): OneInchService {
  if (!oneInchService) {
    oneInchService = new OneInchService();
  }
  return oneInchService;
}
