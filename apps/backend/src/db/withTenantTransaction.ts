import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { getDb } from './dbClient.js';
import { activeDb, getRootDb } from './dbConnection.js';
import { getRequestUserId } from '../lib/tenantContext.js';

type AppDb = NodePgDatabase<typeof schema>;

async function applyTenantRls(tx: AppDb, workspaceSubdomain: string | null): Promise<void> {
  if (workspaceSubdomain && workspaceSubdomain.trim()) {
    const tenant = workspaceSubdomain.trim().toLowerCase();
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenant}, true)`);
    await tx.execute(sql`SELECT set_config('app.rls_bypass', 'off', true)`);
  } else {
    await tx.execute(sql`SELECT set_config('app.rls_bypass', 'on', true)`);
    await tx.execute(sql`SELECT set_config('app.current_tenant', '', true)`);
  }

  const userId = getRequestUserId();
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId ?? ''}, true)`);
}

/**
 * Runs `fn` inside a transaction with tenant RLS GUC set via SET LOCAL.
 * When `workspaceSubdomain` is null, enables `app.rls_bypass` for migrations/admin paths.
 *
 * If a parent `runInTransaction` is already open, joins that transaction instead of
 * opening a second pool connection (required for atomic admin backup restore).
 */
export async function withTenantTransaction<T>(
  workspaceSubdomain: string | null,
  fn: (tx: AppDb) => Promise<T>,
): Promise<T> {
  const current = activeDb();
  if (current !== getRootDb()) {
    await applyTenantRls(current, workspaceSubdomain);
    return fn(current);
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const client = tx as AppDb;
    await applyTenantRls(client, workspaceSubdomain);
    return fn(client);
  });
}
