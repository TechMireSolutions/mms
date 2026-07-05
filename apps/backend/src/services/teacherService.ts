import {
  normalizeStoredTeacher,
  paginateTeachers,
  computeTeachersWidgetAggregates,
  computeNextTeacherEmployeeId,
  collectTeacherLinkedContactIds,
  hydrateTeacherFromContact,
  type TeacherEmployeeIdSettings,
  type TeachersListQuery,
  type TeachersWidgetQuery,
  type Teacher,
} from '@mms/shared';
import {
  type TeacherRecord,
} from '../validation/teacherSchemas.js';
import { loadContacts } from './contactService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listTeachersByWorkspace,
  findTeacherById,
  saveTeacher,
} from '../db/repositories/teacherRepository.js';

export async function loadTeachers(options?: { includeDeleted?: boolean }): Promise<TeacherRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listTeachersByWorkspace(tenant);
  const filtered = options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
  const contactsData = await loadContacts();
  if (!contactsData || !Array.isArray(contactsData)) {
    return filtered as unknown as TeacherRecord[];
  }
  return filtered.map((row) =>
    hydrateTeacherFromContact(row as never, contactsData as never)
  ) as unknown as TeacherRecord[];
}

export async function createTeacher(record: TeacherRecord): Promise<TeacherRecord> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `tch-${Date.now()}`);
  const normalized = normalizeStoredTeacher({ ...record, id: resolvedId }) as TeacherRecord;
  await saveTeacher(tenant, normalized as Teacher);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'teachers');
  return normalized;
}

export async function updateTeacherById(id: string, record: TeacherRecord): Promise<TeacherRecord | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findTeacherById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = normalizeStoredTeacher({ ...record, id }) as TeacherRecord;
  await saveTeacher(tenant, normalized as Teacher);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'teachers');
  return normalized;
}

export async function deleteTeacherById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findTeacherById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  } as Teacher;
  await saveTeacher(tenant, updated);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'teachers');
  return true;
}

export async function restoreTeacherById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findTeacherById(tenant, id);
  if (!existing || !existing.deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
  const restored = rest as Teacher;
  await saveTeacher(tenant, restored);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'teachers');
  return true;
}

export async function loadTeachersWidgetAggregates(
  queries: TeachersWidgetQuery[],
): Promise<Record<string, import('@mms/shared').TeachersWidgetAggregateResult>> {
  const rows = await loadTeachers();
  return computeTeachersWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadTeachersPage(query: TeachersListQuery & { includeDeleted?: boolean }) {
  const rows = await loadTeachers({ includeDeleted: query.includeDeleted });
  return paginateTeachers(rows as import('@mms/shared').Teacher[], query);
}

export async function loadTeachersByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const wanted = new Set(ids.map(String));
  const all = await loadTeachers({ includeDeleted: true });
  return all.filter((row) => wanted.has(String(row.id)));
}

export async function loadTeacherById(id: string, includeDeleted = false) {
  const all = await loadTeachers({ includeDeleted });
  return all.find((row) => String(row.id) === String(id)) ?? null;
}

export async function loadTeacherLinkedContactIds(excludeTeacherId?: string) {
  const all = await loadTeachers();
  return collectTeacherLinkedContactIds(all, excludeTeacherId);
}

export async function computeNextTeacherEmployeeIdForSettings(settings: TeacherEmployeeIdSettings) {
  const all = await loadTeachers();
  return computeNextTeacherEmployeeId(all, settings);
}
