import { faculty } from '../schema.js';
import type { AppDb } from '../tenant-context.js';
import type { FacultyMember } from '@mms/shared';
import { mapAuditTimestamps, mapAuditToInsert } from './repositoryMappers.js';

export type FacultyInsert = typeof faculty.$inferInsert;

export const FACULTY_PROJECTION_COLUMNS = {
  id: faculty.id,
  workspaceSubdomain: faculty.workspaceSubdomain,
  contactId: faculty.contactId,
  userId: faculty.userId,
  employeeId: faculty.employeeId,
  status: faculty.status,
  specialization: faculty.specialization,
  department: faculty.department,
  designation: faculty.designation,
  reportingFacultyId: faculty.reportingFacultyId,
  hierarchyRank: faculty.hierarchyRank,
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
  const f = facultyMember as FacultyMember & { reportingFacultyId?: string | null; hierarchyRank?: number };
  const knownKeys = new Set([
    'id', 'contactId', 'userId', 'employeeId', 'status', 'specialization', 'department',
    'designation', 'designationId', 'designationStartsOn', 'designationEndsOn',
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
    contactId: facultyMember.contactId ? String(facultyMember.contactId) : null,
    userId: facultyMember.userId ? String(facultyMember.userId) : null,
    employeeId: facultyMember.employeeId ?? null,
    status: facultyMember.status ?? 'active',
    specialization: facultyMember.specialization ?? null,
    department: facultyMember.department ?? null,
    designation: facultyMember.designation ?? null,
    reportingFacultyId: f.reportingFacultyId ?? null,
    hierarchyRank: typeof f.hierarchyRank === 'number' ? f.hierarchyRank : 10,
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
    department: row.department ?? undefined,
    designation: row.designation ?? undefined,
    reportingFacultyId: row.reportingFacultyId ?? null,
    hierarchyRank: row.hierarchyRank ?? 10,
    qualification: row.qualification ?? undefined,
    joinDate: row.joinDate ?? undefined,
    notes: row.notes ?? undefined,
    ...mapAuditTimestamps(row),
  } satisfies FacultyMember;
}

export async function hydrateFacultyList(
  _tx: AppDb,
  _subdomain: string,
  rows: (typeof faculty.$inferSelect)[],
): Promise<FacultyMember[]> {
  return rows.map(facultyRowToRecord);
}

export function facultyUpdateSetValues(subdomain: string, facultyMember: FacultyMember) {
  const { id: _id, workspaceSubdomain: _subdomain, createdAt: _createdAt, createdBy: _createdBy, ...setFields } = facultyWriteValues(subdomain, facultyMember);
  return setFields;
}

export async function persistFacultyTx(
  tx: AppDb,
  subdomain: string,
  facultyMember: FacultyMember,
): Promise<void> {
  await tx
    .insert(faculty)
    .values(facultyWriteValues(subdomain, facultyMember))
    .onConflictDoUpdate({
      target: [faculty.workspaceSubdomain, faculty.id],
      set: facultyUpdateSetValues(subdomain, facultyMember),
    });
}
