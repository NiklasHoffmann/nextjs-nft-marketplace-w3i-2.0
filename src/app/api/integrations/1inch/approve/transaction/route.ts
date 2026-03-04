import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, BadRequestError } from '@/lib/api';
import { getOneInchService } from '@/services/integrations/oneinch/oneinch-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = apiHandler(async (request: NextRequest) => {
  const chainIdRaw = getQueryParam(request, 'chainId', true);
  const tokenAddress = getQueryParam(request, 'tokenAddress', true);
  const amount = getQueryParam(request, 'amount');

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (Number.isNaN(chainId)) {
    throw new BadRequestError('chainId must be an integer');
  }

  const oneInch = getOneInchService();
  const transaction = await oneInch.getApprovalTransaction(chainId, tokenAddress, amount);

  return apiSuccess({
    chainId,
    tokenAddress,
    amount,
    transaction,
    provider: '1inch',
  });
});
