import {
  attendanceRecordSchema,
  type AttendanceRecord,
} from '../validation/attendanceSchemas.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listAttendanceRecordsByWorkspace,
  findAttendanceRecordById,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  replaceAttendanceRecordsForWorkspace,
} from '../db/repositories/attendanceRepository.js';

export async function loadAttendanceRecords(options?: { includeDeleted?: boolean }): Promise<AttendanceRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const all = await listAttendanceRecordsByWorkspace(tenant);
  return options?.includeDeleted ? all : all.filter((row) => !row.deletedAt);
}

export async function createAttendanceRecord(record: AttendanceRecord): Promise<AttendanceRecord> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `att-${Date.now()}`);
  const normalized = attendanceRecordSchema.parse({ ...record, id: resolvedId });
  await saveAttendanceRecord(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'attendance_records');
  return normalized;
}

export async function updateAttendanceRecordById(id: string, record: AttendanceRecord): Promise<AttendanceRecord | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findAttendanceRecordById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = attendanceRecordSchema.parse({ ...record, id });
  await saveAttendanceRecord(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'attendance_records');
  return normalized;
}

export async function deleteAttendanceRecordById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findAttendanceRecordById(tenant, id);
  if (!existing) return false;
  await deleteAttendanceRecord(tenant, id);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'attendance_records');
  return true;
}

/** Replace full attendance collection (mark-attendance batch save). */
export async function replaceAttendanceRecords(records: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = records.map((record) => attendanceRecordSchema.parse(record));
  await replaceAttendanceRecordsForWorkspace(tenant, parsed);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'attendance_records');
  return parsed;
}
