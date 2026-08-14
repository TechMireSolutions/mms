import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { getDb } from './dbClient.js';
import { activeDb, getRootDb } from './dbConnection.js';
import { applyTenantTransactionGuards } from './tenantTransactionGuards.js';
import { getRequestTenant } from '../lib/tenantContext.js';

export type AppDb = NodePgDatabase<typeof schema>;
export type TenantTransactionCallback<T> = (tx: AppDb) => Promise<T>;

/**
 * Runs `fn` inside a transaction with tenant RLS GUC set via SET LOCAL.
 * If `workspaceSubdomain` is omitted, automatically resolves from `AsyncLocalStorage` tenant context.
 * When `workspaceSubdomain` is explicitly `null`, enables `app.rls_bypass` for migrations/admin paths.
 */
export async function withTenantTransaction<T>(
  fn: TenantTransactionCallback<T>,
): Promise<T>;
export async function withTenantTransaction<T>(
  workspaceSubdomain: string | null | undefined,
  fn: TenantTransactionCallback<T>,
): Promise<T>;
export async function withTenantTransaction<T>(
  arg1: (string | null | undefined) | TenantTransactionCallback<T>,
  arg2?: TenantTransactionCallback<T>,
): Promise<T> {
  const workspaceSubdomain = typeof arg1 === 'function' ? getRequestTenant() : arg1;
  const fn = typeof arg1 === 'function' ? arg1 : arg2!;

  const current = activeDb();
  if (current !== getRootDb()) {
    await applyTenantTransactionGuards(current, workspaceSubdomain ?? null);
    return fn(current);
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const client = tx as AppDb;
    await applyTenantTransactionGuards(client, workspaceSubdomain ?? null);
    return fn(client);
  });
}
