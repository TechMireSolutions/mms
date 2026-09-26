import { randomUUID } from 'node:crypto';
import { and, eq, getTableName } from 'drizzle-orm';
import {
  FACULTY_LOOKUP_KINDS,
  defaultFacultyLookupItems,
  emptyFacultyLookupsMap,
  type FacultyLookupKind,
  type FacultyLookupsMap,
} from '@mms/shared';
import { createModuleStringListLookupsService } from '../../lib/createModuleStringListLookupsService.js';
import {
  listFacultyLookupsByKind,
  listFacultyLookupsByWorkspace,
  replaceFacultyLookupsForKind,
} from '../../db/repositories/facultyLookupsRepository.js';
import { facultyLookups } from '../../db/schema.js';
import { withTenant, type TenantTransaction } from '../../db/tenant-context.js';
import { invalidateMultiTierCache } from '../../lib/cache/index.js';

const stringListLookups = createModuleStringListLookupsService<
  FacultyLookupKind,
  FacultyLookupsMap
>({
  kinds: FACULTY_LOOKUP_KINDS,
  emptyMap: emptyFacultyLookupsMap,
  defaultItems: defaultFacultyLookupItems,
  listByWorkspace: listFacultyLookupsByWorkspace,
  listByKind: listFacultyLookupsByKind,
  replaceForKind: replaceFacultyLookupsForKind,
  broadcastKey: 'faculty',
});

export const loadFacultyLookupsMap = stringListLookups.loadMap;

export const replaceFacultyLookupKind = stringListLookups.replaceKind;

/**
 * Ensures a custom designation is persisted in faculty_lookups under kind 'designations'
 * with case-insensitive matching (LOWER(TRIM(value))).
 */
export async function ensureFacultyDesignationLookup(
  tenant: string,
  designation: string,
  tx?: TenantTransaction,
): Promise<void> {
  const trimmed = designation.trim();
  if (!trimmed) return;

  const performUpsert = async (client: TenantTransaction) => {
    if (!client || typeof client.select !== 'function') return;
    const existing = await client
      .select({
        id: facultyLookups.id,
        label: facultyLookups.label,
        sortOrder: facultyLookups.sortOrder,
      })
      .from(facultyLookups)
      .where(
        and(
          eq(facultyLookups.workspaceSubdomain, tenant),
          eq(facultyLookups.kind, 'designations'),
        ),
      );

    const lower = trimmed.toLowerCase();
    const found = existing.some((r) => r.label.trim().toLowerCase() === lower);
    if (!found) {
      const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder ?? 0), -1);
      await client.insert(facultyLookups).values({
        id: `des-${randomUUID()}`,
        workspaceSubdomain: tenant,
        kind: 'designations',
        label: trimmed,
        sortOrder: maxSort + 1,
        meta: null,
      });
      const tableName = getTableName(facultyLookups);
      await invalidateMultiTierCache({
        tenantId: tenant,
        domain: tableName,
      });
    }
  };

  if (tx) {
    await performUpsert(tx);
  } else {
    await withTenant(tenant, performUpsert);
  }
}
