import { randomUUID } from 'node:crypto';
import { and, eq, getTableName } from 'drizzle-orm';
import {
  TEACHER_LOOKUP_KINDS,
  defaultTeacherLookupItems,
  emptyTeacherLookupsMap,
  type TeacherLookupKind,
  type TeacherLookupsMap,
} from '@mms/shared';
import { createModuleStringListLookupsService } from '../../lib/createModuleStringListLookupsService.js';
import {
  listTeacherLookupsByKind,
  listTeacherLookupsByWorkspace,
  replaceTeacherLookupsForKind,
} from '../../db/repositories/facultyLookupsRepository.js';
import { teacherLookups } from '../../db/schema.js';
import { withTenant, type TenantTransaction } from '../../db/tenant-context.js';
import { invalidateMultiTierCache } from '../../lib/cache/index.js';

const stringListLookups = createModuleStringListLookupsService<
  TeacherLookupKind,
  TeacherLookupsMap
>({
  kinds: TEACHER_LOOKUP_KINDS,
  emptyMap: emptyTeacherLookupsMap,
  defaultItems: defaultTeacherLookupItems,
  listByWorkspace: listTeacherLookupsByWorkspace,
  listByKind: listTeacherLookupsByKind,
  replaceForKind: replaceTeacherLookupsForKind,
  broadcastKey: 'teachers',
});

export const loadFacultyLookupsMap = stringListLookups.loadMap;
export const loadTeacherLookupsMap = loadFacultyLookupsMap;

export const replaceFacultyLookupKind = stringListLookups.replaceKind;
export const replaceTeacherLookupKind = replaceFacultyLookupKind;

/**
 * Ensures a custom designation is persisted in teacher_lookups under kind 'designations'
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
        id: teacherLookups.id,
        label: teacherLookups.label,
        sortOrder: teacherLookups.sortOrder,
      })
      .from(teacherLookups)
      .where(
        and(
          eq(teacherLookups.workspaceSubdomain, tenant),
          eq(teacherLookups.kind, 'designations'),
        ),
      );

    const lower = trimmed.toLowerCase();
    const found = existing.some((r) => r.label.trim().toLowerCase() === lower);
    if (!found) {
      const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder ?? 0), -1);
      await client.insert(teacherLookups).values({
        id: `des-${randomUUID()}`,
        workspaceSubdomain: tenant,
        kind: 'designations',
        label: trimmed,
        sortOrder: maxSort + 1,
        meta: null,
      });
      const tableName = getTableName(teacherLookups);
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

export const ensureTeacherDesignationLookup = ensureFacultyDesignationLookup;

