import {
  type Enrollment,
} from '@mms/shared';
import { enrollmentRecordSchema } from '../validation/enrollmentSchemas.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listEnrollmentsByWorkspace,
  findEnrollmentById,
  saveEnrollment,
} from '../db/repositories/enrollmentRepository.js';

export async function loadEnrollments(options?: { includeDeleted?: boolean }): Promise<Enrollment[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const rawRows = await listEnrollmentsByWorkspace(tenant);
  return options?.includeDeleted ? rawRows : rawRows.filter((row) => !row.deletedAt);
}

export async function createEnrollment(record: Enrollment): Promise<Enrollment> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `enr-${Date.now()}`);
  const normalized = enrollmentRecordSchema.parse({ ...record, id: resolvedId }) as Enrollment;
  await saveEnrollment(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return normalized;
}

export async function updateEnrollmentById(id: string, record: Enrollment): Promise<Enrollment | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findEnrollmentById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = enrollmentRecordSchema.parse({ ...record, id }) as Enrollment;
  await saveEnrollment(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return normalized;
}

export async function deleteEnrollmentById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findEnrollmentById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  } as Enrollment;
  await saveEnrollment(tenant, updated);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return true;
}

export async function restoreEnrollmentById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findEnrollmentById(tenant, id);
  if (!existing || !existing.deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
  await saveEnrollment(tenant, rest as Enrollment);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return true;
}
