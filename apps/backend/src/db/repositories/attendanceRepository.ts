import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { attendance, attendanceLeaves } from '../schema.js';
import type { AttendanceRecord } from '@mms/shared';
import { withTenant } from '../tenant-context.js';

type AttendanceRow = typeof attendance.$inferSelect;
type AttendanceInsert = typeof attendance.$inferInsert;

function rowToRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    classId: row.classId,
    studentId: row.studentId,
    studentName: row.studentName,
    rollNo: row.rollNo,
    date: row.date,
    status: row.status as AttendanceRecord['status'],
    timeIn: row.timeIn,
    timeOut: row.timeOut,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    deletedBy: row.deletedBy ?? null,
    deletionReason: row.deletionReason ?? null,
  };
}

function recordToInsert(tenant: string, record: AttendanceRecord): AttendanceInsert {
  return {
    id: String(record.id),
    workspaceSubdomain: tenant.trim().toLowerCase(),
    classId: String(record.classId || ''),
    studentId: String(record.studentId || ''),
    studentName: String(record.studentName || ''),
    rollNo: String(record.rollNo || ''),
    date: String(record.date || ''),
    status: String(record.status || 'present'),
    timeIn: String(record.timeIn || ''),
    timeOut: String(record.timeOut || ''),
    notes: String(record.notes || ''),
    deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
    deletedBy: record.deletedBy ?? null,
    deletionReason: record.deletionReason ?? null,
    updatedAt: new Date(),
  };
}

export async function listAttendanceRecordsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number; includeDeleted?: boolean },
): Promise<AttendanceRecord[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(attendance.workspaceSubdomain, subdomain)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(attendance.deletedAt));
    }
    const rows = await tx
      .select({
        id: attendance.id,
        workspaceSubdomain: attendance.workspaceSubdomain,
        classId: attendance.classId,
        studentId: attendance.studentId,
        studentName: attendance.studentName,
        rollNo: attendance.rollNo,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        notes: attendance.notes,
        deletedAt: attendance.deletedAt,
        deletedBy: attendance.deletedBy,
        deletionReason: attendance.deletionReason,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
    return rows.map(rowToRecord);
  });
}

export async function findAttendanceRecordById(
  tenant: string,
  id: string,
): Promise<AttendanceRecord | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: attendance.id,
        workspaceSubdomain: attendance.workspaceSubdomain,
        classId: attendance.classId,
        studentId: attendance.studentId,
        studentName: attendance.studentName,
        rollNo: attendance.rollNo,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        notes: attendance.notes,
        deletedAt: attendance.deletedAt,
        deletedBy: attendance.deletedBy,
        deletionReason: attendance.deletionReason,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceSubdomain, subdomain),
          eq(attendance.id, id),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? rowToRecord(row) : null;
  });
}

export async function findAttendanceRecordsByIds(
  tenant: string,
  ids: string[],
): Promise<AttendanceRecord[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: attendance.id,
        workspaceSubdomain: attendance.workspaceSubdomain,
        classId: attendance.classId,
        studentId: attendance.studentId,
        studentName: attendance.studentName,
        rollNo: attendance.rollNo,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        notes: attendance.notes,
        deletedAt: attendance.deletedAt,
        deletedBy: attendance.deletedBy,
        deletionReason: attendance.deletionReason,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceSubdomain, subdomain),
          inArray(attendance.id, ids),
        ),
      );
    return rows.map(rowToRecord);
  });
}

export async function saveAttendanceRecord(
  tenant: string,
  record: AttendanceRecord,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    const values = recordToInsert(subdomain, record);
    await tx
      .insert(attendance)
      .values(values)
      .onConflictDoUpdate({
        target: [attendance.workspaceSubdomain, attendance.id],
        set: {
          classId: values.classId,
          studentId: values.studentId,
          studentName: values.studentName,
          rollNo: values.rollNo,
          date: values.date,
          status: values.status,
          timeIn: values.timeIn,
          timeOut: values.timeOut,
          notes: values.notes,
          deletedAt: values.deletedAt,
          deletedBy: values.deletedBy,
          deletionReason: values.deletionReason,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveAttendanceRecords(
  tenant: string,
  records: AttendanceRecord[],
): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(attendance)
      .values(records.map((record) => recordToInsert(subdomain, record)))
      .onConflictDoUpdate({
        target: [attendance.workspaceSubdomain, attendance.id],
        set: {
          classId: sql`excluded.class_id`,
          studentId: sql`excluded.student_id`,
          studentName: sql`excluded.student_name`,
          rollNo: sql`excluded.roll_no`,
          date: sql`excluded.date`,
          status: sql`excluded.status`,
          timeIn: sql`excluded.time_in`,
          timeOut: sql`excluded.time_out`,
          notes: sql`excluded.notes`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function deleteAttendanceRecord(
  tenant: string,
  id: string,
): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const result = await tx
      .delete(attendance)
      .where(
        and(
          eq(attendance.workspaceSubdomain, subdomain),
          eq(attendance.id, id),
        ),
      );
    return Boolean(result.rowCount && result.rowCount > 0);
  });
}

export async function replaceAttendanceRecordsForWorkspace(
  tenant: string,
  records: AttendanceRecord[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(attendanceLeaves).where(eq(attendanceLeaves.workspaceSubdomain, subdomain));
    await tx.delete(attendance).where(eq(attendance.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(attendance).values(records.map((record) => recordToInsert(subdomain, record)));
    }
  });
}

export async function deleteAttendanceRecordsByWorkspace(tenant: string): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(attendanceLeaves).where(eq(attendanceLeaves.workspaceSubdomain, subdomain));
    await tx.delete(attendance).where(eq(attendance.workspaceSubdomain, subdomain));
  });
}
