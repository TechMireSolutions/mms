import type { ZodType } from 'zod';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

interface TenantBulkRepo<T> {
  listByWorkspace: (subdomain: string) => Promise<T[]>;
  replaceForWorkspace: (subdomain: string, records: T[]) => Promise<void>;
}

/**
 * Filters soft-deleted rows for Work vs trash list semantics.
 * `includeDeleted: true` returns only archived rows; otherwise active rows.
 */
export function scopeDeleted<T extends { deletedAt?: string | null }>(
  rows: T[],
  includeDeleted?: boolean,
): T[] {
  if (includeDeleted) return rows.filter((row) => Boolean(row.deletedAt));
  return rows.filter((row) => !row.deletedAt);
}

/**
 * Parses, bulk-saves, and broadcasts a tenant collection upsert.
 */
export async function upsertWithBroadcast<T>(
  schema: { parse: (data: unknown) => T[] },
  records: T[],
  bulkSave: (tenant: string, list: T[]) => Promise<void>,
  collection: string,
): Promise<T[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = schema.parse(records);
  await bulkSave(tenant, parsed);
  await broadcastCollection(collection);
  return parsed;
}

/**
 * Generates a `load()` and `replace()` function pair for a tenant-scoped
 * collection that is managed via bulk replace (GET all / PUT all).
 *
 * Prefer {@link upsertWithBroadcast} for API bulk write paths.
 */
export function defineTenantBulkCollectionService<T>(
  repo: TenantBulkRepo<T>,
  schema: ZodType<T[]>,
  broadcastKey: string,
) {
  async function load(): Promise<T[]> {
    const tenant = getRequestTenant();
    if (!tenant) return [];
    return repo.listByWorkspace(tenant);
  }

  async function replace(records: T[]): Promise<T[]> {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const parsed = schema.parse(records);
    await repo.replaceForWorkspace(tenant, parsed);
    await broadcastCollection(broadcastKey);
    return parsed;
  }

  return { load, replace };
}
