import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { getDb } from './dbClient.js';

type AppDb = NodePgDatabase<typeof schema>;

/**
 * Runs `fn` inside a transaction with tenant RLS GUC set via SET LOCAL.
 * When `workspaceSubdomain` is null, enables `app.rls_bypass` for migrations/admin paths.
 */
export async function withTenantTransaction<T>(
  workspaceSubdomain: string | null,
  fn: (tx: AppDb) => Promise<T>,
): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const client = tx as AppDb;
    if (workspaceSubdomain && workspaceSubdomain.trim()) {
      const tenant = workspaceSubdomain.trim().toLowerCase();
      await client.execute(sql`SELECT set_config('app.current_tenant', ${tenant}, true)`);
      await client.execute(sql`SELECT set_config('app.rls_bypass', 'off', true)`);
    } else {
      await client.execute(sql`SELECT set_config('app.rls_bypass', 'on', true)`);
      await client.execute(sql`SELECT set_config('app.current_tenant', '', true)`);
    }
    return fn(client);
  });
}
