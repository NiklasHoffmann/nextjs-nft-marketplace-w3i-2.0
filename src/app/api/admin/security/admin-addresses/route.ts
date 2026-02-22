import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError, ForbiddenError } from '@/lib/api';
import {
  getAdminAddressSources,
  setStoredAdditionalAdminAddresses,
} from '@/lib/auth/admin-access';
import { isOnchainMultisigOwner } from '@/lib/auth/multisig-owners';

interface UpdateAddressesBody {
  addresses: string[];
}

export const GET = apiHandler(async () => {
  const sources = await getAdminAddressSources();

  return apiSuccess({
    multisigOwners: sources.multisigOwners,
    envAdditional: sources.envAdditional,
    storedAdditional: sources.storedAdditional,
    effective: sources.effective,
  });
}, { admin: true });

export const PUT = apiHandler(async (request: NextRequest) => {
  const body = await parseJsonBody<UpdateAddressesBody>(request);
  const addresses = Array.isArray(body.addresses) ? body.addresses : null;
  const actor = (request.userAddress as string).toLowerCase();

  if (!addresses) {
    throw new BadRequestError('addresses must be an array');
  }

  const canManage = await isOnchainMultisigOwner(actor);
  if (!canManage) {
    throw new ForbiddenError('Only on-chain multisig owners can modify additional admin addresses');
  }

  if (addresses.length > 200) {
    throw new BadRequestError('addresses length must be <= 200');
  }

  const storedAdditional = await setStoredAdditionalAdminAddresses(addresses, actor);
  const sources = await getAdminAddressSources();

  return apiSuccess({
    storedAdditional,
    effective: sources.effective,
  });
}, { admin: true });
