import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { getDb } from './dbClient.js';
import { activeDb, getRootDb } from './dbConnection.js';
import { applyTenantTransactionGuards } from './tenantTransactionGuards.js';

type AppDb = NodePgDatabase<typeof schema>;

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
    await applyTenantTransactionGuards(current, workspaceSubdomain);
    return fn(current);
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const client = tx as AppDb;
    await applyTenantTransactionGuards(client, workspaceSubdomain);
    return fn(client);
  });
}
