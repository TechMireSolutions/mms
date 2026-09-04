import { activeDb, getReadReplicaDb, hasActiveTransaction, withActiveTransaction } from './dbConnection.js';
import type { DbClient } from './dbConnection.js';

import { tracer } from '../config/telemetry.js';
import { applyTenantTransactionGuards } from './tenantTransactionGuards.js';
import { logger } from '../lib/logger.js';

export type TenantTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type AppDb = TenantTransaction;

export async function withTenant<T>(
  tenantId: string | null | undefined,
  callback: (tx: TenantTransaction) => Promise<T>,
  options: { readOnly?: boolean; statementTimeoutMs?: number } = {}
): Promise<T> {
  const resolvedTenantId = tenantId || '';

  // Defensive guard: a tenant id of the literal strings "undefined"/"null"
  // indicates a caller binding an unset request property instead of a real
  // workspace subdomain. Fail loudly rather than running RLS against a
  // non-existent tenant.
  if (resolvedTenantId === 'undefined' || resolvedTenantId === 'null') {
    throw new Error(
      `withTenant received the literal string "${resolvedTenantId}" as tenant id — a caller is binding an unset request property. Check that authentication middleware decorates request.tenant.`
    );
  }

  if (typeof hasActiveTransaction === 'function' && hasActiveTransaction()) {
    const active = activeDb();
    // Re-apply tenant RLS guards so a nested `withTenant` runs under its own
    // requested tenant rather than silently inheriting the outer transaction's
    // context. Idempotent when the tenant matches; correct when it differs.
    await applyTenantTransactionGuards(active as unknown as AppDb, resolvedTenantId, {
      statementTimeoutMs: options.statementTimeoutMs,
    });
    return callback(active as unknown as TenantTransaction);
  }

  let pool: DbClient | undefined;
  let poolError: unknown;
  try {
    pool = options.readOnly ? getReadReplicaDb() : activeDb();
  } catch (err) {
    poolError = err;
    if (options.readOnly) {
      try {
        pool = activeDb();
        if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
          logger.warn('Read replica unavailable — executing this transaction on the primary');
        }
      } catch {
        // handled by the degradation branch below
      }
    }
  }
  if (!pool) {
    // Fail closed in production: running tenant work without a transaction/RLS
    // boundary is a correctness and isolation hazard. Tests mock use cases but
    // not the DB connection layer, so keep a no-op boundary there.
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return callback({} as TenantTransaction);
    }
    throw new Error(
      '[withTenant] no database client available — cannot run tenant work without a transaction boundary.',
      { cause: poolError },
    );
  }

  if (typeof pool.transaction !== 'function') {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return callback({} as TenantTransaction);
    }
    throw new Error(
      '[withTenant] active database client does not support transactions — cannot run tenant work without a transaction boundary.',
    );
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
        // Single source of truth for tenant RLS GUCs + statement/idle budgets.
        await applyTenantTransactionGuards(tx as unknown as AppDb, resolvedTenantId, {
          statementTimeoutMs: options.statementTimeoutMs,
        });

        // Register this transaction as the active one for the callback's async
        // scope so nested runInTransaction()/activeDb() consumers join it rather
        // than opening a second pool client and a second transaction.
        return withActiveTransaction(tx as unknown as DbClient, () =>
          callback(tx as unknown as TenantTransaction)
        );
      });
    },
  );
}

