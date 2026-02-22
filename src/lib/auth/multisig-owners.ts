import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { getMultisigAddress } from '@/config/networks';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';

export async function getOnchainMultisigOwners(): Promise<string[]> {
  const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', 10);
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_RPC_SEPOLIA;
  const multisigAddress = getMultisigAddress(chainId);

  if (!multisigAddress || !rpcUrl) {
    return [];
  }

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

  return owners.map((owner) => owner.toLowerCase());
}

export async function isOnchainMultisigOwner(address: string): Promise<boolean> {
  if (!address) return false;

  const owners = await getOnchainMultisigOwners();
  return owners.includes(address.toLowerCase());
}
