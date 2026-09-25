import { teachers } from '../schema.js';
import type { AppDb } from '../tenant-context.js';
import type { Teacher } from '@mms/shared';
import { mapAuditTimestamps, mapAuditToInsert } from './repositoryMappers.js';

export type TeacherInsert = typeof teachers.$inferInsert;

export const TEACHER_PROJECTION_COLUMNS = {
  id: teachers.id,
  workspaceSubdomain: teachers.workspaceSubdomain,
  contactId: teachers.contactId,
  userId: teachers.userId,
  employeeId: teachers.employeeId,
  status: teachers.status,
  specialization: teachers.specialization,
  department: teachers.department,
  designation: teachers.designation,
  reportingFacultyId: teachers.reportingFacultyId,
  hierarchyRank: teachers.hierarchyRank,
  qualification: teachers.qualification,
  joinDate: teachers.joinDate,
  notes: teachers.notes,
  customData: teachers.customData,
  deletedAt: teachers.deletedAt,
  deletedBy: teachers.deletedBy,
  deletionReason: teachers.deletionReason,
  restoredAt: teachers.restoredAt,
  restoredBy: teachers.restoredBy,
  deletedWithCascade: teachers.deletedWithCascade,
  createdAt: teachers.createdAt,
  updatedAt: teachers.updatedAt,
  createdBy: teachers.createdBy,
  updatedBy: teachers.updatedBy,
} as const;

export function teacherWriteValues(subdomain: string, teacher: Teacher): TeacherInsert {
  const audit = mapAuditToInsert(teacher);
  const t = teacher as Teacher & { reportingFacultyId?: string | null; hierarchyRank?: number };
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
    Object.entries(teacher as Record<string, unknown>).filter(([key]) => !knownKeys.has(key)),
  );
  return {
    id: String(teacher.id),
    workspaceSubdomain: subdomain,
    contactId: teacher.contactId ? String(teacher.contactId) : null,
    userId: teacher.userId ? String(teacher.userId) : null,
    employeeId: teacher.employeeId ?? null,
    status: teacher.status ?? 'active',
    specialization: teacher.specialization ?? null,
    department: teacher.department ?? null,
    designation: teacher.designation ?? null,
    reportingFacultyId: t.reportingFacultyId ?? null,
    hierarchyRank: typeof t.hierarchyRank === 'number' ? t.hierarchyRank : 10,
    qualification: teacher.qualification ?? null,
    joinDate: teacher.joinDate ?? null,
    notes: teacher.notes ?? null,
    customData,
    ...audit,
    createdAt: audit.createdAt ?? new Date(),
  } satisfies TeacherInsert;
}

export function teacherRowToRecord(row: typeof teachers.$inferSelect): Teacher {
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
  } satisfies Teacher;
}

export async function hydrateTeachersList(
  _tx: AppDb,
  _subdomain: string,
  rows: (typeof teachers.$inferSelect)[],
): Promise<Teacher[]> {
  return rows.map(teacherRowToRecord);
}

export function teacherUpdateSetValues(subdomain: string, teacher: Teacher) {
  const { id: _id, workspaceSubdomain: _subdomain, createdAt: _createdAt, createdBy: _createdBy, ...setFields } = teacherWriteValues(subdomain, teacher);
  return setFields;
}

export async function persistTeacherTx(
  tx: AppDb,
  subdomain: string,
  teacher: Teacher,
): Promise<void> {
  await tx
    .insert(teachers)
    .values(teacherWriteValues(subdomain, teacher))
    .onConflictDoUpdate({
      target: [teachers.workspaceSubdomain, teachers.id],
      set: teacherUpdateSetValues(subdomain, teacher),
    });
}
