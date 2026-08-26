import { sql } from 'drizzle-orm';
import { activeDb, getReadReplicaDb, hasActiveTransaction } from './dbConnection.js';
import type { DbClient } from './dbConnection.js';

import { loadServerConfig } from '../config/serverConfig.js';
import { tracer } from '../config/telemetry.js';
import { getRequestUserId } from '../lib/tenantContext.js';

export type TenantTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type AppDb = TenantTransaction;

export async function withTenant<T>(
  tenantId: string | null | undefined,
  callback: (tx: TenantTransaction) => Promise<T>,
  options: { readOnly?: boolean; statementTimeoutMs?: number } = {}
): Promise<T> {
  const resolvedTenantId = tenantId || '';
  
  let pool: DbClient;
  try {
    pool = (options.readOnly && !hasActiveTransaction()) ? getReadReplicaDb() : activeDb();
    if (!pool || typeof pool.transaction !== 'function') {
      return callback({} as TenantTransaction);
    }
  } catch {
    return callback({} as TenantTransaction);
  }

  return tracer.withSpan(
    'drizzle.transaction',
    {
      'db.system': 'postgresql',
      'tenant.id': resolvedTenantId || 'platform',
      'db.read_only': options.readOnly ?? false,
    },
    async () => {
      return pool.transaction(async (tx) => {
        // Parameter 3 (is_local = true) ensures setting reverts when transaction completes
        await tx.execute(
          sql`SELECT set_config('app.current_tenant', ${resolvedTenantId}, true)`
        );
        await tx.execute(
          sql`SELECT set_config('app.rls_bypass', ${resolvedTenantId ? 'off' : 'on'}, true)`
        );

        const config = loadServerConfig();
        const statementTimeout = options.statementTimeoutMs ?? config.pgStatementTimeoutMs;
        await tx.execute(
          sql`SELECT set_config('statement_timeout', ${String(statementTimeout)}, true)`
        );
        await tx.execute(
          sql`SELECT set_config('idle_in_transaction_session_timeout', ${String(config.pgIdleInTxTimeoutMs)}, true)`
        );

        const userId = getRequestUserId();
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${userId ?? ''}, true)`
        );

        return callback(tx as unknown as TenantTransaction);
      });
    },
  );
}

