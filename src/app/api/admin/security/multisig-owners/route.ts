import { apiHandler, apiSuccess } from '@/lib/api';
import { getMultisigAddress } from '@/config/networks';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

function parseAddressList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export const GET = apiHandler(async () => {
  const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', 10);
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_RPC_SEPOLIA;
  const multisigAddress = getMultisigAddress(chainId);

  const additionalAdmins = parseAddressList(
    process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_ADMIN_ADDRESSES
  );

  if (!multisigAddress || !rpcUrl) {
    return apiSuccess({
      owners: [],
      ownersCount: 0,
      multisigAddress: multisigAddress || null,
      source: 'unavailable',
      additionalAdmins,
      additionalAdminsCount: additionalAdmins.length,
      reason: 'Multisig address or RPC URL missing',
    });
  }

  try {
    const chain = chainId === 1 ? mainnet : sepolia;
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const owners = (await client.readContract({
      address: multisigAddress as `0x${string}`,
      abi: MULTISIG_WALLET_ABI as any,
      functionName: 'getOwners',
    })) as string[];

    const normalizedOwners = owners.map((owner) => owner.toLowerCase());

    return apiSuccess({
      owners: normalizedOwners,
      ownersCount: normalizedOwners.length,
      multisigAddress,
      source: 'onchain',
      additionalAdmins,
      additionalAdminsCount: additionalAdmins.length,
    });
  } catch (error) {
    return apiSuccess({
      owners: [],
      ownersCount: 0,
      multisigAddress,
      source: 'error',
      additionalAdmins,
      additionalAdminsCount: additionalAdmins.length,
      reason: 'Failed to read owners from multisig contract',
    });
  }
}, { admin: true });
