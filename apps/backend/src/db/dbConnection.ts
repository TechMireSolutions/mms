import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { loadServerConfig } from '../config/serverConfig.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { getDb, setDb } from './dbClient.js';
import * as schema from './schema.js';
import { applyTenantTransactionGuards } from './tenantTransactionGuards.js';

export type DbClient = NodePgDatabase<typeof schema>;

const txStorage = new AsyncLocalStorage<DbClient>();
let pool: pg.Pool | null = null;
let rootDb: DbClient | null = null;

export function initializeDatabaseConnection(): void {
  if (pool) return;

  const config = loadServerConfig();
  pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: config.pgPoolMax,
  });
  pool.on('error', (error) => {
    // Idle clients can be terminated during platform DB reset; log and continue.
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

/** Interface representing active DB connection pool utilization metrics. */
export interface PoolMetrics {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

/** Returns connection count telemetry for database health checks. */
export function getPoolMetrics(): PoolMetrics | null {
  if (!pool) return null;
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/** Lightweight DB connectivity check for `/ready`. */
export async function pingDatabase(): Promise<boolean> {
  try {
    if (!pool || !rootDb) return false;
    await rootDb.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

/** Gracefully close the database on shutdown or before a full schema wipe. */
export async function closeDatabase(): Promise<void> {
  if (!pool) return;
  const ending = pool;
  pool = null;
  rootDb = null;
  setDb(null);
  try {
    await ending.end();
  } catch (error) {
    console.error('Error closing database pool:', error);
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

const SLOW_QUERY_THRESHOLD_MS = 200;

async function runTransaction<T>(cb: () => Promise<T>, readSnapshot: boolean): Promise<T> {
  const existing = txStorage.getStore();
  if (existing) return cb();

  const tenant = getRequestTenant();
  const startTime = Date.now();
  try {
    return await getDb().transaction(async (tx) => {
      await applyTenantTransactionGuards(tx, tenant);
      return await txStorage.run(tx, cb);
    }, readSnapshot ? { isolationLevel: 'repeatable read' } : undefined);
  } finally {
    const duration = Date.now() - startTime;
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(
        `[SLOW DB TX] Transaction for tenant "${tenant || 'none'}" took ${duration}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`,
      );
    }
  }
}
