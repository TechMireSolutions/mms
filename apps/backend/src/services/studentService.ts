import {
  normalizeStoredStudent,
  computeStudentsWidgetAggregates,
  paginateStudents,
  computeNextGrNumber,
  findStudentRegistrationConflict,
  collectStudentLinkedContactIds,
  hydrateStudentFromContacts,
  type StudentGrNumberSettings,
  type StudentDuplicateCheckInput,
  type StudentsListQuery,
  type StudentsWidgetQuery,
} from '@mms/shared';
import {
  type StudentRecord,
} from '../validation/studentSchemas.js';
import { loadContacts } from './contactService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listStudentsByWorkspace,
  findStudentById,
  findStudentsByIds,
  saveStudent,
} from '../db/repositories/studentRepository.js';

export async function loadStudents(options?: { includeDeleted?: boolean }): Promise<StudentRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listStudentsByWorkspace(tenant);
  const filtered = options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
  const contactsData = await loadContacts();
  if (!contactsData || !Array.isArray(contactsData)) {
    return filtered as unknown as StudentRecord[];
  }
  return filtered.map((row) =>
    hydrateStudentFromContacts(row as never, contactsData as never)
  ) as unknown as StudentRecord[];
}

export async function createStudent(record: StudentRecord): Promise<StudentRecord> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `st-${Date.now()}`);
  const normalized = normalizeStoredStudent({ ...record, id: resolvedId }) as StudentRecord;
  await saveStudent(tenant, normalized as any);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return normalized;
}

export async function updateStudentById(id: string, record: StudentRecord): Promise<StudentRecord | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findStudentById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = normalizeStoredStudent({ ...record, id }) as StudentRecord;
  await saveStudent(tenant, normalized as any);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return normalized;
}

export async function deleteStudentById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findStudentById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  } as any;
  await saveStudent(tenant, updated);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return true;
}

export async function restoreStudentById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findStudentById(tenant, id);
  if (!existing || !existing.deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
  const restored = rest as any;
  await saveStudent(tenant, restored);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return true;
}

export async function loadStudentsWidgetAggregates(
  queries: StudentsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').StudentsWidgetAggregateResult>> {
  const rows = await loadStudents();
  return computeStudentsWidgetAggregates(rows as Record<string, unknown>[], queries);
}

export async function loadStudentsPage(query: StudentsListQuery & { includeDeleted?: boolean }) {
  const rows = await loadStudents({ includeDeleted: query.includeDeleted });
  return paginateStudents(rows as import('@mms/shared').Student[], query);
}

export async function loadStudentsByIds(ids: string[]) {
  const tenant = getRequestTenant();
  if (!tenant || ids.length === 0) return [];
  const matched = await findStudentsByIds(tenant, ids);
  const contactsData = await loadContacts();
  if (!contactsData || !Array.isArray(contactsData)) {
    return matched as unknown as StudentRecord[];
  }
  return matched.map((row) =>
    hydrateStudentFromContacts(row as never, contactsData as never)
  ) as unknown as StudentRecord[];
}

export async function loadStudentById(id: string, includeDeleted = false) {
  const all = await loadStudents({ includeDeleted });
  return all.find((row) => String(row.id) === String(id)) ?? null;
}

export async function loadStudentLinkedContactIds(excludeStudentId?: string) {
  const all = await loadStudents();
  return collectStudentLinkedContactIds(all, excludeStudentId);
}

export async function computeNextGrNumberForDate(regDate: string, settings: StudentGrNumberSettings) {
  const all = await loadStudents();
  return computeNextGrNumber(all, settings, regDate);
}

export async function checkStudentRegistrationDuplicate(input: StudentDuplicateCheckInput) {
  const all = await loadStudents();
  return { reason: findStudentRegistrationConflict(all, input) };
}
