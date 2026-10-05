import { faculty } from '../schema.js';
import type { AppDb } from '../tenant-context.js';
import type { FacultyMember } from '@mms/shared';
import { mapAuditTimestamps, mapAuditToInsert } from './repositoryMappers.js';
import { attachPrimaryAppointmentFields } from './facultyPrimaryAppointmentHydrate.js';

export type FacultyInsert = typeof faculty.$inferInsert;

export const FACULTY_PROJECTION_COLUMNS = {
  id: faculty.id,
  workspaceSubdomain: faculty.workspaceSubdomain,
  contactId: faculty.contactId,
  userId: faculty.userId,
  employeeId: faculty.employeeId,
  status: faculty.status,
  specialization: faculty.specialization,
  qualification: faculty.qualification,
  joinDate: faculty.joinDate,
  notes: faculty.notes,
  customData: faculty.customData,
  deletedAt: faculty.deletedAt,
  deletedBy: faculty.deletedBy,
  deletionReason: faculty.deletionReason,
  restoredAt: faculty.restoredAt,
  restoredBy: faculty.restoredBy,
  deletedWithCascade: faculty.deletedWithCascade,
  createdAt: faculty.createdAt,
  updatedAt: faculty.updatedAt,
  createdBy: faculty.createdBy,
  updatedBy: faculty.updatedBy,
} as const;

export function facultyWriteValues(subdomain: string, facultyMember: FacultyMember): FacultyInsert {
  const audit = mapAuditToInsert(facultyMember);
  const knownKeys = new Set([
    'id', 'contactId', 'userId', 'employeeId', 'status', 'specialization', 'department',
    'designation', 'designationId', 'designationStartsOn', 'designationEndsOn',
    'designations', 'departmentId',
    'designationAssignableRoles', 'customDesignation', 'reportingFacultyId',
    'reportingFacultyName', 'subordinateCount', 'subordinates', 'hierarchyRank',
    'qualification', 'joinDate', 'notes', 'name', 'phone', 'email', 'gender', 'avatar',
    'contact', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'deletedAt',
    'deletedBy', 'deletionReason', 'restoredAt', 'restoredBy', 'deletedWithCascade',
  ]);
  const customData = Object.fromEntries(
    Object.entries(facultyMember as Record<string, unknown>).filter(([key]) => !knownKeys.has(key)),
  );
  return {
    id: String(facultyMember.id),
    workspaceSubdomain: subdomain,
    contactId: String(facultyMember.contactId),
    userId: facultyMember.userId ? String(facultyMember.userId) : null,
    employeeId: facultyMember.employeeId ?? null,
    status: facultyMember.status ?? 'active',
    specialization: facultyMember.specialization ?? null,
    qualification: facultyMember.qualification ?? null,
    joinDate: facultyMember.joinDate ?? null,
    notes: facultyMember.notes ?? null,
    customData,
    ...audit,
    createdAt: audit.createdAt ?? new Date(),
  } satisfies FacultyInsert;
}

export function facultyRowToRecord(row: typeof faculty.$inferSelect): FacultyMember {
  return {
    ...(row.customData ?? {}),
    id: row.id,
    contactId: row.contactId ?? '',
    userId: row.userId ?? null,
    status: row.status ?? 'active',
    employeeId: row.employeeId ?? undefined,
    specialization: row.specialization ?? undefined,
    qualification: row.qualification ?? undefined,
    joinDate: row.joinDate ?? undefined,
    notes: row.notes ?? undefined,
    ...mapAuditTimestamps(row),
  } satisfies FacultyMember;
}

export async function hydrateFacultyList(
  tx: AppDb,
  subdomain: string,
  rows: (typeof faculty.$inferSelect)[],
): Promise<FacultyMember[]> {
  const mapped = rows.map(facultyRowToRecord);
  return attachPrimaryAppointmentFields(tx, subdomain, mapped);
}

export async function attachPrimaryAppointmentToFacultyList(
  tx: AppDb,
  subdomain: string,
  rows: FacultyMember[],
): Promise<FacultyMember[]> {
  return attachPrimaryAppointmentFields(tx, subdomain, rows);
}

export function facultyUpdateSetValues(subdomain: string, facultyMember: FacultyMember) {
  const { id: _id, workspaceSubdomain: _subdomain, createdAt: _createdAt, createdBy: _createdBy, ...setFields } = facultyWriteValues(subdomain, facultyMember);
  return setFields;
}

export async function persistFacultyTx(
  tx: AppDb,
  subdomain: string,
  facultyMember: FacultyMember,
  options?: { createOnly?: boolean },
): Promise<void> {
  if (options?.createOnly) {
    await tx.insert(faculty).values(facultyWriteValues(subdomain, facultyMember));
    return;
  }
  await tx
    .insert(faculty)
    .values(facultyWriteValues(subdomain, facultyMember))
    .onConflictDoUpdate({
      target: [faculty.workspaceSubdomain, faculty.id],
      set: facultyUpdateSetValues(subdomain, facultyMember),
    });
}
