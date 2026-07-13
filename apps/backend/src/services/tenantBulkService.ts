import type { ZodType } from 'zod';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

interface TenantBulkRepo<T> {
  listByWorkspace: (subdomain: string) => Promise<T[]>;
  replaceForWorkspace: (subdomain: string, records: T[]) => Promise<void>;
}

/**
 * Generates a `load()` and `replace()` function pair for a tenant-scoped
 * collection that is managed via bulk replace (GET all / PUT all).
 *
 * Centralises the four-line load boilerplate and five-line replace boilerplate
 * that was duplicated across accountingService, hasanatService,
 * obligationService, and questionBankService.
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
