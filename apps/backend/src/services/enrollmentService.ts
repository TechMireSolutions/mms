import {
  type Enrollment,
  enrollmentRecordSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listEnrollmentsByWorkspace,
  findEnrollmentById,
  saveEnrollment,
  deleteEnrollment,
} from '../db/repositories/enrollmentRepository.js';

export async function loadEnrollments(): Promise<Enrollment[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listEnrollmentsByWorkspace(tenant);
}

export async function createEnrollment(record: Enrollment): Promise<Enrollment> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `enr-${Date.now()}`);
  const normalized = enrollmentRecordSchema.parse({ ...record, id: resolvedId });
  await saveEnrollment(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return normalized;
}

export async function updateEnrollmentById(id: string, record: Enrollment): Promise<Enrollment | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findEnrollmentById(tenant, id);
  if (!existing) return null;
  const normalized = enrollmentRecordSchema.parse({ ...record, id });
  await saveEnrollment(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return normalized;
}

export async function deleteEnrollmentById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findEnrollmentById(tenant, id);
  if (!existing) return false;
  await deleteEnrollment(tenant, id);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'enrollments');
  return true;
}
