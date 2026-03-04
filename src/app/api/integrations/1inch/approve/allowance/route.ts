import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, BadRequestError } from '@/lib/api';
import { getOneInchService } from '@/services/integrations/oneinch/oneinch-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = apiHandler(async (request: NextRequest) => {
  const chainIdRaw = getQueryParam(request, 'chainId', true);
  const tokenAddress = getQueryParam(request, 'tokenAddress', true);
  const walletAddress = getQueryParam(request, 'walletAddress', true);

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (Number.isNaN(chainId)) {
    throw new BadRequestError('chainId must be an integer');
  }

  const oneInch = getOneInchService();
  const allowance = await oneInch.getApprovalAllowance(chainId, tokenAddress, walletAddress);

  return apiSuccess({
    chainId,
    tokenAddress,
    walletAddress,
    allowance,
    provider: '1inch',
  });
});
