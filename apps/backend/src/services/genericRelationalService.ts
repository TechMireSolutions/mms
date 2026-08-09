import { randomUUID } from 'node:crypto';
import { getRequestTenant } from '../lib/tenantContext.js';
import type { ZodType } from 'zod';
import type { ListByWorkspaceOptions } from '../db/repositories/genericRepository.js';

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

/**
 * Hydrates generic database records using contact profile data if available.
 * Loads only linked contact ids for the current record set (never a full-tenant dump).
 */
export async function hydrateRecordsFromContacts<TRaw, THydrated>(
  records: TRaw[],
  collectContactIdsFn: (record: TRaw) => Array<string | number | null | undefined>,
  hydrate: (record: TRaw, contacts: unknown[]) => THydrated,
  loadContactsByIdsFn: (ids: string[]) => Promise<unknown[]>,
): Promise<THydrated[]> {
  if (records.length === 0) return [];

  const ids = [
    ...new Set(
      records
        .flatMap((record) => collectContactIdsFn(record))
        .filter((id): id is string | number => id != null && id !== '')
        .map(String),
    ),
  ];
  const contactsData = ids.length === 0 ? [] : await loadContactsByIdsFn(ids);
  if (!Array.isArray(contactsData)) {
    return records as unknown as THydrated[];
  }
  return records.map((row) => hydrate(row, contactsData));
}

export type ListByWorkspaceWithDeletedFn<TRaw> = (
  subdomain: string,
  options?: ListByWorkspaceOptions,
) => Promise<TRaw[]>;

/**
 * Loads database records (SQL soft-delete scoped) and hydrates them from contacts.
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function loadHydratedAll<TRaw extends { deletedAt?: string | null | undefined }, THydrated>(
  listFn: ListByWorkspaceWithDeletedFn<TRaw>,
  collectContactIdsFn: (record: TRaw) => Array<string | number | null | undefined>,
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated,
  loadContactsByIdsFn: (ids: string[]) => Promise<unknown[]>,
  options?: { includeDeleted?: boolean },
): Promise<THydrated[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listFn(tenant, {
    deleted: options?.includeDeleted ? 'deleted' : 'active',
  });
  return hydrateRecordsFromContacts(rawRows, collectContactIdsFn, hydrateFn, loadContactsByIdsFn);
}

/**
 * Loads a single database record by ID and hydrates it from contacts.
 */
export async function loadHydratedById<TRaw extends { deletedAt?: string | null | undefined }, THydrated>(
  id: string,
  findByIdFn: (subdomain: string, id: string) => Promise<TRaw | null>,
  collectContactIdsFn: (record: TRaw) => Array<string | number | null | undefined>,
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated,
  loadContactsByIdsFn: (ids: string[]) => Promise<unknown[]>,
  includeDeleted = false,
): Promise<THydrated | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findByIdFn(tenant, id);
  if (!existing || (!includeDeleted && existing.deletedAt)) return null;
  const hydrated = await hydrateRecordsFromContacts(
    [existing],
    collectContactIdsFn,
    hydrateFn,
    loadContactsByIdsFn,
  );
  return hydrated[0] ?? null;
}

/**
 * Loads database records by IDs and hydrates them from contacts.
 */
export async function loadHydratedByIds<TRaw, THydrated>(
  ids: string[],
  findByIdsFn: (subdomain: string, ids: string[]) => Promise<TRaw[]>,
  collectContactIdsFn: (record: TRaw) => Array<string | number | null | undefined>,
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated,
  loadContactsByIdsFn: (ids: string[]) => Promise<unknown[]>,
): Promise<THydrated[]> {
  const tenant = getRequestTenant();
  if (!tenant || ids.length === 0) return [];
  const matched = await findByIdsFn(tenant, ids);
  return hydrateRecordsFromContacts(matched, collectContactIdsFn, hydrateFn, loadContactsByIdsFn);
}

export interface ContactHydratedServiceOptions<TRaw, THydrated> {
  listByWorkspaceFn: ListByWorkspaceWithDeletedFn<TRaw>;
  findByIdFn: (subdomain: string, id: string) => Promise<TRaw | null>;
  findByIdsFn: (subdomain: string, ids: string[]) => Promise<TRaw[]>;
  collectContactIdsFn: (record: TRaw) => Array<string | number | null | undefined>;
  loadContactsByIdsFn: (ids: string[]) => Promise<unknown[]>;
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated;
}

/**
 * Creates a generic set of hydration queries for a collection linked to contacts.
 */
export function createContactHydratedService<
  TRaw extends { deletedAt?: string | null | undefined },
  THydrated,
>(options: ContactHydratedServiceOptions<TRaw, THydrated>) {
  const {
    listByWorkspaceFn,
    findByIdFn,
    findByIdsFn,
    collectContactIdsFn,
    loadContactsByIdsFn,
    hydrateFn,
  } = options;

  async function loadAll(opts?: { includeDeleted?: boolean }): Promise<THydrated[]> {
    return loadHydratedAll(
      listByWorkspaceFn,
      collectContactIdsFn,
      hydrateFn,
      loadContactsByIdsFn,
      opts,
    );
  }

  async function loadById(id: string, includeDeleted = false): Promise<THydrated | null> {
    return loadHydratedById(
      id,
      findByIdFn,
      collectContactIdsFn,
      hydrateFn,
      loadContactsByIdsFn,
      includeDeleted,
    );
  }

  async function loadByIds(ids: string[]): Promise<THydrated[]> {
    return loadHydratedByIds(ids, findByIdsFn, collectContactIdsFn, hydrateFn, loadContactsByIdsFn);
  }

  return {
    loadAll,
    loadById,
    loadByIds,
  };
}
