import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';
import { loadServerConfig } from '../config/serverConfig.js';
import { getRequestUserId } from '../lib/tenantContext.js';

type AppDb = NodePgDatabase<typeof schema>;

/**
 * SET LOCAL tenant RLS GUCs (+ statement/idle budgets when tenant-bound).
 * Null/empty subdomain enables `app.rls_bypass` and skips timeouts (migrations / admin).
 */
export async function applyTenantTransactionGuards(
  tx: AppDb,
  workspaceSubdomain: string | null | undefined,
  options?: { statementTimeoutMs?: number },
): Promise<void> {
  if (workspaceSubdomain && workspaceSubdomain.trim()) {
    const tenant = workspaceSubdomain.trim().toLowerCase();
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenant}, true)`);
    await tx.execute(sql`SELECT set_config('app.rls_bypass', 'off', true)`);

    const config = loadServerConfig();
    const statementTimeout = options?.statementTimeoutMs ?? config.pgStatementTimeoutMs;
    await tx.execute(
      sql`SELECT set_config('statement_timeout', ${String(statementTimeout)}, true)`,
    );
    await tx.execute(
      sql`SELECT set_config('idle_in_transaction_session_timeout', ${String(config.pgIdleInTxTimeoutMs)}, true)`,
    );
  } else {
    await tx.execute(sql`SELECT set_config('app.rls_bypass', 'on', true)`);
    await tx.execute(sql`SELECT set_config('app.current_tenant', '', true)`);
  }

  const userId = getRequestUserId();
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId ?? ''}, true)`);
}
