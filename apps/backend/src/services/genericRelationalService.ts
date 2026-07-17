import { getRequestTenant } from '../lib/tenantContext.js';
import type { ZodType } from 'zod';

interface SoftDeleteFields {
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
}

export interface GenericServiceOptions<T> {
  repo: {
    listByWorkspace: (subdomain: string) => Promise<T[]>;
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
    const all = await repo.listByWorkspace(tenant);
    return opts?.includeDeleted ? all : all.filter((row) => !row.deletedAt);
  }

  async function create(record: T): Promise<T> {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const resolvedId = String(record.id ?? `${idPrefix}-${Date.now()}`);
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
    const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
    await repo.save(tenant, rest as T);
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', websocketCollection);
    return true;
  }

  return {
    loadAll,
    create,
    updateById,
    deleteById,
    restoreById,
  };
}

/**
 * Hydrates generic database records using contact profile data if available.
 */
export async function hydrateRecordsFromContacts<TRaw, THydrated>(
  records: TRaw[],
  loadContactsFn: () => Promise<unknown>,
  hydrate: (record: TRaw, contacts: unknown[]) => THydrated,
): Promise<THydrated[]> {
  const contactsData = await loadContactsFn();
  if (!contactsData || !Array.isArray(contactsData)) {
    return records as unknown as THydrated[];
  }
  return records.map((row) => hydrate(row, contactsData));
}

/**
 * Loads all database records (optionally including deleted) and hydrates them from contacts.
 */
export async function loadHydratedAll<TRaw extends Record<string, any>, THydrated>(
  listFn: (subdomain: string) => Promise<TRaw[]>,
  loadContactsFn: () => Promise<unknown>,
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated,
  options?: { includeDeleted?: boolean },
): Promise<THydrated[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listFn(tenant);
  const filtered = options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
  return hydrateRecordsFromContacts(filtered, loadContactsFn, hydrateFn);
}

/**
 * Loads a single database record by ID and hydrates it from contacts.
 */
export async function loadHydratedById<TRaw extends Record<string, any>, THydrated>(
  id: string,
  findByIdFn: (subdomain: string, id: string) => Promise<TRaw | null>,
  loadContactsFn: () => Promise<unknown>,
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated,
  includeDeleted = false,
): Promise<THydrated | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findByIdFn(tenant, id);
  if (!existing || (!includeDeleted && existing.deletedAt)) return null;
  const hydrated = await hydrateRecordsFromContacts([existing], loadContactsFn, hydrateFn);
  return hydrated[0] ?? null;
}

/**
 * Loads database records by IDs and hydrates them from contacts.
 */
export async function loadHydratedByIds<TRaw extends Record<string, any>, THydrated>(
  ids: string[],
  findByIdsFn: (subdomain: string, ids: string[]) => Promise<TRaw[]>,
  loadContactsFn: () => Promise<unknown>,
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated,
): Promise<THydrated[]> {
  const tenant = getRequestTenant();
  if (!tenant || ids.length === 0) return [];
  const matched = await findByIdsFn(tenant, ids);
  return hydrateRecordsFromContacts(matched, loadContactsFn, hydrateFn);
}

export interface ContactHydratedServiceOptions<TRaw, THydrated> {
  listByWorkspaceFn: (subdomain: string) => Promise<TRaw[]>;
  findByIdFn: (subdomain: string, id: string) => Promise<TRaw | null>;
  findByIdsFn: (subdomain: string, ids: string[]) => Promise<TRaw[]>;
  loadContactsFn: () => Promise<unknown>;
  hydrateFn: (record: TRaw, contacts: unknown[]) => THydrated;
}

/**
 * Creates a generic set of hydration queries for a collection linked to contacts.
 */
export function createContactHydratedService<
  TRaw extends Record<string, any>,
  THydrated,
>(options: ContactHydratedServiceOptions<TRaw, THydrated>) {
  const { listByWorkspaceFn, findByIdFn, findByIdsFn, loadContactsFn, hydrateFn } = options;

  async function loadAll(opts?: { includeDeleted?: boolean }): Promise<THydrated[]> {
    return loadHydratedAll(listByWorkspaceFn, loadContactsFn, hydrateFn, opts);
  }

  async function loadById(id: string, includeDeleted = false): Promise<THydrated | null> {
    return loadHydratedById(id, findByIdFn, loadContactsFn, hydrateFn, includeDeleted);
  }

  async function loadByIds(ids: string[]): Promise<THydrated[]> {
    return loadHydratedByIds(ids, findByIdsFn, loadContactsFn, hydrateFn);
  }

  return {
    loadAll,
    loadById,
    loadByIds,
  };
}


