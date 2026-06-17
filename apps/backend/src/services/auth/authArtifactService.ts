import { randomBytes } from 'node:crypto';
import { eq, lt, sql } from 'drizzle-orm';
import { authArtifacts } from '../../db/schema.js';
import { getDb } from '../../db/dbClient.js';

export type AuthArtifactKind =
  | 'handoff'
  | 'two_factor_challenge'
  | 'refresh_token'
  | 'platform_setup'
  | 'platform_password_reset';

export interface AuthArtifactRecord<T> {
  id: string;
  kind: AuthArtifactKind;
  payload: T;
  expiresAt: Date;
}

function db() {
  return getDb();
}

export function createArtifactId(): string {
  return randomBytes(24).toString('hex');
}

export async function putAuthArtifact<T>(
  kind: AuthArtifactKind,
  payload: T,
  ttlMs: number,
  id: string = createArtifactId(),
): Promise<string> {
  const expiresAt = new Date(Date.now() + ttlMs);
  await db()
    .insert(authArtifacts)
    .values({
      id,
      kind,
      payload: JSON.stringify(payload),
      expiresAt,
    });
  return id;
}

export async function takeAuthArtifact<T>(
  id: string,
  kind: AuthArtifactKind,
): Promise<AuthArtifactRecord<T> | null> {
  const rows = await db()
    .select()
    .from(authArtifacts)
    .where(eq(authArtifacts.id, id));
  const row = rows[0];
  if (!row || row.kind !== kind) return null;

  await db().delete(authArtifacts).where(eq(authArtifacts.id, id));

  if (row.expiresAt.getTime() < Date.now()) return null;

  return {
    id: row.id,
    kind: row.kind as AuthArtifactKind,
    payload: JSON.parse(row.payload) as T,
    expiresAt: row.expiresAt,
  };
}

export async function getAuthArtifact<T>(
  id: string,
  kind: AuthArtifactKind,
): Promise<AuthArtifactRecord<T> | null> {
  const rows = await db()
    .select()
    .from(authArtifacts)
    .where(eq(authArtifacts.id, id));
  const row = rows[0];
  if (!row || row.kind !== kind) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db().delete(authArtifacts).where(eq(authArtifacts.id, id));
    return null;
  }
  return {
    id: row.id,
    kind: row.kind as AuthArtifactKind,
    payload: JSON.parse(row.payload) as T,
    expiresAt: row.expiresAt,
  };
}

export async function deleteAuthArtifact(id: string): Promise<void> {
  await db().delete(authArtifacts).where(eq(authArtifacts.id, id));
}

export async function purgeExpiredAuthArtifacts(): Promise<void> {
  await db().delete(authArtifacts).where(lt(authArtifacts.expiresAt, sql`now()`));
}

/** Finds a non-expired refresh-token artifact by its stored hash. */
export async function findRefreshTokenByHash<T>(
  tokenHash: string,
): Promise<AuthArtifactRecord<T> | null> {
  const rows = await db()
    .select()
    .from(authArtifacts)
    .where(eq(authArtifacts.kind, 'refresh_token'));

  for (const row of rows) {
    if (row.expiresAt.getTime() < Date.now()) continue;
    const payload = JSON.parse(row.payload) as T & { tokenHash?: string };
    if ((payload as { tokenHash: string }).tokenHash === tokenHash) {
      return {
        id: row.id,
        kind: row.kind as AuthArtifactKind,
        payload: payload as T,
        expiresAt: row.expiresAt,
      };
    }
  }
  return null;
}
