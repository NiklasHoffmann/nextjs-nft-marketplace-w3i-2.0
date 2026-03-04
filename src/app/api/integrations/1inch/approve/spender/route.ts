import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, BadRequestError } from '@/lib/api';
import { getOneInchService } from '@/services/integrations/oneinch/oneinch-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = apiHandler(async (request: NextRequest) => {
  const chainIdRaw = getQueryParam(request, 'chainId', true);
  const chainId = Number.parseInt(chainIdRaw, 10);

  if (Number.isNaN(chainId)) {
    throw new BadRequestError('chainId must be an integer');
  }

  const oneInch = getOneInchService();
  const spender = await oneInch.getApprovalSpender(chainId);

  return apiSuccess({
    chainId,
    spender,
    provider: '1inch',
  });
});
