import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { getOneInchService } from '@/services/integrations/oneinch/oneinch-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SwapBody {
  chainId?: number;
  src?: string;
  dst?: string;
  amount?: string;
  from?: string;
  slippage?: number;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
  includeProtocols?: boolean;
  includeTokensInfo?: boolean;
}

function parseBody(body: unknown): Required<Pick<SwapBody, 'chainId' | 'src' | 'dst' | 'amount' | 'from' | 'slippage'>> & Omit<SwapBody, 'chainId' | 'src' | 'dst' | 'amount' | 'from' | 'slippage'> {
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('Invalid request body');
  }

  const payload = body as SwapBody;

  const chainId = payload.chainId;
  if (typeof chainId !== 'number' || !Number.isInteger(chainId) || chainId <= 0) {
    throw new BadRequestError('chainId must be a positive integer');
  }

  if (!payload.src || typeof payload.src !== 'string') {
    throw new BadRequestError('src is required');
  }

  if (!payload.dst || typeof payload.dst !== 'string') {
    throw new BadRequestError('dst is required');
  }

  if (!payload.amount || typeof payload.amount !== 'string') {
    throw new BadRequestError('amount is required as base-unit string');
  }

  if (!payload.from || typeof payload.from !== 'string') {
    throw new BadRequestError('from is required');
  }

  const slippage = payload.slippage;
  if (typeof slippage !== 'number' || !Number.isFinite(slippage)) {
    throw new BadRequestError('slippage is required as number');
  }

  return {
    chainId,
    src: payload.src,
    dst: payload.dst,
    amount: payload.amount,
    from: payload.from,
    slippage,
    disableEstimate: payload.disableEstimate,
    allowPartialFill: payload.allowPartialFill,
    includeProtocols: payload.includeProtocols,
    includeTokensInfo: payload.includeTokensInfo,
  };
}

export const POST = apiHandler(async (request: NextRequest) => {
  const rawBody = await request.json();
  const body = parseBody(rawBody);

  const oneInch = getOneInchService();
  const swap = await oneInch.getSwap(body);

  return apiSuccess({
    provider: '1inch',
    chainId: body.chainId,
    src: body.src,
    dst: body.dst,
    amount: body.amount,
    from: body.from,
    slippage: body.slippage,
    swap,
  });
});
