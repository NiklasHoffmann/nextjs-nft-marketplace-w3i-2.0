import { randomUUID } from 'crypto';

export interface AdminSessionRecord {
  jti: string;
  address: string;
  createdAt: number;
  expiresAt: number;
  nonce?: string;
  userAgent?: string;
  ip?: string;
  revokedAt?: number | null;
  revokedBy?: string | null;
}

async function getSessionsCollection() {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  const { getCollection } = await import('@/lib/mongodb');
  return getCollection('admin_sessions');
}

export function createSessionJti(): string {
  return randomUUID();
}

export async function registerAdminSession(record: AdminSessionRecord): Promise<void> {
  const collection = await getSessionsCollection();
  if (!collection) return;

  await collection.updateOne(
    { jti: record.jti },
    {
      $set: {
        ...record,
        address: record.address.toLowerCase(),
      },
    },
    { upsert: true }
  );
}

export async function isAdminSessionRevoked(jti: string): Promise<boolean> {
  const collection = await getSessionsCollection();
  if (!collection) return false;

  const session = await collection.findOne(
    { jti },
    { projection: { revokedAt: 1, expiresAt: 1 } }
  );

  if (!session) {
    return false;
  }

  if (typeof session.expiresAt === 'number' && session.expiresAt < Date.now()) {
    return true;
  }

  return Boolean(session.revokedAt);
}

export async function revokeAdminSessionByJti(
  jti: string,
  revokedBy?: string
): Promise<boolean> {
  const collection = await getSessionsCollection();
  if (!collection) return false;

  const now = Date.now();
  const result = await collection.updateOne(
    { jti, revokedAt: { $in: [null, undefined] } },
    { $set: { revokedAt: now, revokedBy: revokedBy?.toLowerCase() || null } }
  );

  return result.modifiedCount > 0;
}

export async function revokeAllAdminSessions(
  revokedBy: string,
  exceptJti?: string
): Promise<number> {
  const collection = await getSessionsCollection();
  if (!collection) return 0;

  const now = Date.now();
  const filter: Record<string, unknown> = {
    revokedAt: { $in: [null, undefined] },
    expiresAt: { $gt: now },
  };

  if (exceptJti) {
    filter.jti = { $ne: exceptJti };
  }

  const result = await collection.updateMany(filter, {
    $set: { revokedAt: now, revokedBy: revokedBy.toLowerCase() },
  });

  return result.modifiedCount;
}

export async function listAdminSessions(limit = 50): Promise<AdminSessionRecord[]> {
  const collection = await getSessionsCollection();
  if (!collection) return [];

  const docs = await collection
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 200)))
    .toArray();

  return docs.map((doc: any) => ({
    jti: String(doc.jti || ''),
    address: String(doc.address || '').toLowerCase(),
    createdAt: Number(doc.createdAt || 0),
    expiresAt: Number(doc.expiresAt || 0),
    nonce: doc.nonce ? String(doc.nonce) : undefined,
    userAgent: doc.userAgent ? String(doc.userAgent) : undefined,
    ip: doc.ip ? String(doc.ip) : undefined,
    revokedAt: typeof doc.revokedAt === 'number' ? doc.revokedAt : null,
    revokedBy: doc.revokedBy ? String(doc.revokedBy).toLowerCase() : null,
  }));
}
