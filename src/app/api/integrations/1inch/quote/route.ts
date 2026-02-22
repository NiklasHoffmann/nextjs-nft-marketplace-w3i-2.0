import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, BadRequestError } from '@/lib/api';
import { getOneInchService } from '@/services/integrations/oneinch/oneinch-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new BadRequestError('Boolean query params must be true or false');
}

export const GET = apiHandler(async (request: NextRequest) => {
  const chainIdRaw = getQueryParam(request, 'chainId', true);
  const src = getQueryParam(request, 'src', true);
  const dst = getQueryParam(request, 'dst', true);
  const amount = getQueryParam(request, 'amount', true);

  const includeProtocolsRaw = getQueryParam(request, 'includeProtocols');
  const includeTokensInfoRaw = getQueryParam(request, 'includeTokensInfo');

  const chainId = Number.parseInt(chainIdRaw, 10);
  if (Number.isNaN(chainId)) {
    throw new BadRequestError('chainId must be an integer');
  }

  const includeProtocols = parseBoolean(includeProtocolsRaw);
  const includeTokensInfo = parseBoolean(includeTokensInfoRaw);

  const oneInch = getOneInchService();
  const quote = await oneInch.getQuote({
    chainId,
    src,
    dst,
    amount,
    includeProtocols,
    includeTokensInfo,
  });

  return apiSuccess({
    chainId,
    src,
    dst,
    amount,
    quote,
    provider: '1inch',
  });
});
