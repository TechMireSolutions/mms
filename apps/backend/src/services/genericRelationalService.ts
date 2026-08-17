import { randomUUID } from 'node:crypto';
import { getRequestTenant } from '../lib/tenantContext.js';
import type { ZodType } from 'zod';

export type SoftDeleteListFilter = 'active' | 'deleted' | 'all';

export interface ListByWorkspaceOptions {
  deleted?: SoftDeleteListFilter;
  includeDeleted?: boolean;
}

interface SoftDeleteFields {
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
}

export interface GenericServiceOptions<T> {
  repo: {
    listByWorkspace: (subdomain: string, options?: ListByWorkspaceOptions) => Promise<T[]>;
    findById: (subdomain: string, id: string) => Promise<T | null>;
    save: (subdomain: string, record: T) => Promise<void>;
  };
  schema: ZodType<T>;
  websocketCollection: string;
  idPrefix: string;
  normalizeFn?: (record: T) => T;
}

/**
 * Creates a generic set of CRUD functions for a relational database collection.
 */
export function createGenericRelationalService<
  T extends SoftDeleteFields & {
    id?: string | number;
  },
>(options: GenericServiceOptions<T>) {
  const { repo, schema, websocketCollection, idPrefix, normalizeFn } = options;

  async function loadAll(opts?: { includeDeleted?: boolean }): Promise<T[]> {
    const tenant = getRequestTenant();
    if (!tenant) return [];
    // includeDeleted matches Contacts: trash = deleted-only (not active+deleted).
    return repo.listByWorkspace(tenant, {
      deleted: opts?.includeDeleted ? 'deleted' : 'active',
    });
  }

  async function create(record: T): Promise<T> {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const resolvedId = String(record.id ?? `${idPrefix}-${randomUUID()}`);
    const parsed = schema.parse({ ...record, id: resolvedId }) as T;
    const normalized = normalizeFn ? normalizeFn(parsed) : parsed;
    await repo.save(tenant, normalized);
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', websocketCollection);
    return normalized;
  }

  async function updateById(id: string, record: T): Promise<T | null> {
    const tenant = getRequestTenant();
    if (!tenant) return null;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) return null;
    const parsed = schema.parse({ ...record, id }) as T;
    const normalized = normalizeFn ? normalizeFn(parsed) : parsed;
    await repo.save(tenant, normalized);
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', websocketCollection);
    return normalized;
  }

  async function deleteById(
    id: string,
    deletedBy: string,
    deletionReason?: string,
  ): Promise<boolean> {
    const tenant = getRequestTenant();
    if (!tenant) return false;
    const existing = await repo.findById(tenant, id);
    if (!existing || existing.deletedAt) return false;
    const updated = {
      ...existing,
      deletedAt: new Date().toISOString(),
      deletedBy,
      deletionReason: deletionReason || undefined,
    } as T;
    await repo.save(tenant, updated);
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', websocketCollection);
    return true;
  }

  async function restoreById(id: string): Promise<boolean> {
    const tenant = getRequestTenant();
    if (!tenant) return false;
    const existing = await repo.findById(tenant, id);
    if (!existing || !existing.deletedAt) return false;
    const restored = {
      ...existing,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    } as T;
    await repo.save(tenant, restored);
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', websocketCollection);
    return true;
  }

  async function bulkDeleteByIds(
    ids: string[],
    deletedBy: string,
    deletionReason?: string,
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;
    for (const id of ids) {
      const ok = await deleteById(id, deletedBy, deletionReason);
      if (ok) succeeded += 1;
      else failed += 1;
    }
    return { succeeded, failed };
  }

  async function bulkRestoreByIds(ids: string[]): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;
    for (const id of ids) {
      const ok = await restoreById(id);
      if (ok) succeeded += 1;
      else failed += 1;
    }
    return { succeeded, failed };
  }

  return {
    loadAll,
    create,
    updateById,
    deleteById,
    restoreById,
    bulkDeleteByIds,
    bulkRestoreByIds,
  };
}
