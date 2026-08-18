import { and, eq, inArray, isNull } from 'drizzle-orm';
import { activeDb } from '../dbConnection.js';
import { attendance, attendanceLeaves } from '../schema.js';
import type { AttendanceRecord } from '@mms/shared';
import { withTenantTransaction } from '../withTenantTransaction.js';

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

export async function listAttendanceRecordsByWorkspace(tenant: string): Promise<AttendanceRecord[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceSubdomain, subdomain),
          isNull(attendance.deletedAt),
        ),
      );
    return rows.map(rowToRecord);
  });
}

export async function findAttendanceRecordById(
  tenant: string,
  id: string,
): Promise<AttendanceRecord | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceSubdomain, subdomain),
          eq(attendance.id, id),
        ),
      );
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
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
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
  await withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
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
    }
  });
}

export async function deleteAttendanceRecord(
  tenant: string,
  id: string,
): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
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
  await withTenantTransaction(subdomain, async (tx) => {
    await tx.delete(attendanceLeaves).where(eq(attendanceLeaves.workspaceSubdomain, subdomain));
    await tx.delete(attendance).where(eq(attendance.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      for (const record of records) {
        const values = recordToInsert(subdomain, record);
        await tx.insert(attendance).values(values);
      }
    }
  });
}

export async function deleteAttendanceRecordsByWorkspace(tenant: string): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  const db = activeDb();
  await db.delete(attendanceLeaves).where(eq(attendanceLeaves.workspaceSubdomain, subdomain));
  await db.delete(attendance).where(eq(attendance.workspaceSubdomain, subdomain));
}
