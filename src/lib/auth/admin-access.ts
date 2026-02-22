import { getCollection } from '@/lib/mongodb';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

interface AdminConfigDocument {
  key: 'additional_admin_addresses';
  addresses: string[];
  updatedAt: number;
  updatedBy?: string;
}

function normalizeAddresses(addresses: string[]): string[] {
  return [...new Set(
    addresses
      .map((address) => address.trim().toLowerCase())
      .filter((address) => ETH_ADDRESS_REGEX.test(address))
  )];
}

function parseAddressList(value: string | undefined): string[] {
  if (!value) return [];
  return normalizeAddresses(value.split(','));
}

export async function getStoredAdditionalAdminAddresses(): Promise<string[]> {
  try {
    const collection = await getCollection('admin_config');
    const doc = await collection.findOne<AdminConfigDocument>({ key: 'additional_admin_addresses' });
    return normalizeAddresses(doc?.addresses || []);
  } catch {
    return [];
  }
}

export async function setStoredAdditionalAdminAddresses(addresses: string[], updatedBy: string): Promise<string[]> {
  const normalized = normalizeAddresses(addresses);
  const collection = await getCollection('admin_config');

  await collection.updateOne(
    { key: 'additional_admin_addresses' },
    {
      $set: {
        key: 'additional_admin_addresses',
        addresses: normalized,
        updatedAt: Date.now(),
        updatedBy: updatedBy.toLowerCase(),
      },
    },
    { upsert: true }
  );

  return normalized;
}

export async function getAdminAddressSources() {
  const multisigOwners = parseAddressList(
    process.env.NEXT_PUBLIC_MULTISIG_OWNER_ADDRESSES || process.env.MULTISIG_OWNER_ADDRESSES
  );

  const envAdditional = parseAddressList(
    process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_ADMIN_ADDRESSES
  );

  const storedAdditional = await getStoredAdditionalAdminAddresses();

  const effective = normalizeAddresses([
    ...multisigOwners,
    ...envAdditional,
    ...storedAdditional,
  ]);

  return {
    multisigOwners,
    envAdditional,
    storedAdditional,
    effective,
  };
}

export async function hasAdminAccess(address: string): Promise<boolean> {
  const normalized = address.toLowerCase();
  if (!ETH_ADDRESS_REGEX.test(normalized)) {
    return false;
  }

  const { effective } = await getAdminAddressSources();
  return effective.includes(normalized);
}
