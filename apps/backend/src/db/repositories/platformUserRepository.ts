import { eq } from 'drizzle-orm';
import type { StoredPlatformUser } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { platformUsers } from '../schema.js';

function rowToStored(row: typeof platformUsers.$inferSelect): StoredPlatformUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
    emailVerifiedAt: row.emailVerifiedAt?.toISOString(),
  };
}

export async function countPlatformUserRows(): Promise<number> {
  const rows = await getDb().select({ id: platformUsers.id }).from(platformUsers);
  return rows.length;
}

export async function listPlatformUsers(): Promise<StoredPlatformUser[]> {
  const rows = await getDb().select().from(platformUsers);
  return rows.map(rowToStored);
}

export async function findPlatformUserRowByEmail(email: string): Promise<StoredPlatformUser | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.email, normalized));
  const row = rows[0];
  return row ? rowToStored(row) : null;
}

export async function findPlatformUserRowById(id: string): Promise<StoredPlatformUser | null> {
  const rows = await getDb().select().from(platformUsers).where(eq(platformUsers.id, id));
  const row = rows[0];
  return row ? rowToStored(row) : null;
}

export async function insertPlatformUser(user: StoredPlatformUser): Promise<void> {
  await getDb().insert(platformUsers).values({
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    passwordHash: user.passwordHash,
    emailVerifiedAt: user.emailVerifiedAt ? new Date(user.emailVerifiedAt) : null,
    createdAt: new Date(user.createdAt),
  });
}

export async function updatePlatformUserRow(
  userId: string,
  patch: Partial<Pick<StoredPlatformUser, 'name' | 'passwordHash' | 'emailVerifiedAt'>>,
): Promise<StoredPlatformUser | null> {
  const existing = await findPlatformUserRowById(userId);
  if (!existing) return null;

  const next: StoredPlatformUser = {
    ...existing,
    ...patch,
  };

  await getDb()
    .update(platformUsers)
    .set({
      name: next.name,
      passwordHash: next.passwordHash,
      emailVerifiedAt: next.emailVerifiedAt ? new Date(next.emailVerifiedAt) : null,
    })
    .where(eq(platformUsers.id, userId));

  return next;
}
