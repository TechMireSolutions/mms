import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { loadServerConfig } from '../config/serverConfig.js';
import { getRequestTenant, getRequestUserId } from '../lib/tenantContext.js';
import { getDb, setDb } from './dbClient.js';
import * as schema from './schema.js';

export type DbClient = NodePgDatabase<typeof schema>;

const txStorage = new AsyncLocalStorage<DbClient>();
let pool: pg.Pool;
let rootDb: DbClient;

export function initializeDatabaseConnection(): void {
  const config = loadServerConfig();
  pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: config.pgPoolMax,
  });
  pool.on('error', (error) => {
    console.error('Unexpected database pool client error:', error);
  });

  rootDb = drizzle(pool, { schema });
  setDb(rootDb);
}

export function getRootDb(): DbClient {
  if (!rootDb) throw new Error('Database not initialized');
  return rootDb;
}

export function activeDb(): DbClient {
  return txStorage.getStore() ?? getRootDb();
}

export function getPool(): pg.Pool {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
}

/** Lightweight DB connectivity check for `/ready`. */
export async function pingDatabase(): Promise<boolean> {
  try {
    if (!pool) return false;
    await rootDb.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

/** Gracefully close the database on shutdown. */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

/**
 * Runs a callback within a database transaction.
 * Uses AsyncLocalStorage to propagate the tx client to all nested helper calls
 * so they participate in the same transaction rather than the root connection.
 * Nested calls are no-ops (they reuse the active tx).
 */
export async function runInTransaction<T>(cb: () => Promise<T>): Promise<T> {
  return await runTransaction(cb, false);
}

/**
 * Read-only variant of `runInTransaction` using REPEATABLE READ, so every statement
 * observes one consistent snapshot (backup exports must not tear across tables).
 */
export async function runInReadSnapshotTransaction<T>(cb: () => Promise<T>): Promise<T> {
  return await runTransaction(cb, true);
}

async function runTransaction<T>(cb: () => Promise<T>, readSnapshot: boolean): Promise<T> {
  const existing = txStorage.getStore();
  if (existing) return cb();

  const tenant = getRequestTenant();
  return await getDb().transaction(async (tx) => {
    if (tenant && tenant.trim()) {
      const normalized = tenant.trim().toLowerCase();
      await tx.execute(sql`SELECT set_config('app.current_tenant', ${normalized}, true)`);
      await tx.execute(sql`SELECT set_config('app.rls_bypass', 'off', true)`);
    } else {
      await tx.execute(sql`SELECT set_config('app.rls_bypass', 'on', true)`);
    }
    const userId = getRequestUserId();
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId ?? ''}, true)`);
    return await txStorage.run(tx, cb);
  }, readSnapshot ? { isolationLevel: 'repeatable read' } : undefined);
}
