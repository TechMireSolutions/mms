import { and, eq, inArray, sql } from 'drizzle-orm';
import { applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { attendance } from '../schema.js';
import type { AttendanceRecord } from '../../validation/attendanceSchemas.js';

function rowToAttendanceRecord(row: typeof attendance.$inferSelect): AttendanceRecord {
  return {
    ...(row.customData as Omit<AttendanceRecord, 'id'>),
    id: row.id,
  } as AttendanceRecord;
}

export async function listAttendanceRecordsByWorkspace(workspaceSubdomain: string): Promise<AttendanceRecord[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(attendance)
    .where(eq(attendance.workspaceSubdomain, subdomain));
  return rows.map(rowToAttendanceRecord);
}

export async function findAttendanceRecordById(workspaceSubdomain: string, id: string): Promise<AttendanceRecord | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(attendance)
    .where(and(eq(attendance.workspaceSubdomain, subdomain), eq(attendance.id, id)));
  const row = rows[0];
  return row ? rowToAttendanceRecord(row) : null;
}

export async function findAttendanceRecordsByIds(workspaceSubdomain: string, ids: string[]): Promise<AttendanceRecord[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(attendance)
    .where(and(eq(attendance.workspaceSubdomain, subdomain), inArray(attendance.id, ids)));
  return rows.map(rowToAttendanceRecord);
}

export async function saveAttendanceRecord(workspaceSubdomain: string, record: AttendanceRecord): Promise<void> {
  const processedRecord = applyTitleCaseRecursive(record) as AttendanceRecord;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedRecord.id);
  const { id: _, ...extra } = processedRecord;
  const db = getDb();

  const existing = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(and(eq(attendance.workspaceSubdomain, subdomain), eq(attendance.id, id)));

  if (existing.length > 0) {
    await db
      .update(attendance)
      .set({
        customData: sql`COALESCE(${attendance.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(attendance.workspaceSubdomain, subdomain), eq(attendance.id, id)));
  } else {
    await db.insert(attendance).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function bulkSaveAttendanceRecords(workspaceSubdomain: string, list: AttendanceRecord[]): Promise<void> {
  if (list.length === 0) return;
  const processedList = applyTitleCaseRecursive(list) as AttendanceRecord[];
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  const values = processedList.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db
    .insert(attendance)
    .values(values)
    .onConflictDoUpdate({
      target: attendance.id,
      set: {
        customData: sql`COALESCE(${attendance.customData}, '{}'::jsonb) || excluded.custom_data`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

export async function deleteAttendanceRecord(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(attendance)
    .where(and(eq(attendance.workspaceSubdomain, subdomain), eq(attendance.id, id)));
}

export async function replaceAttendanceRecordsForWorkspace(
  workspaceSubdomain: string,
  list: AttendanceRecord[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(attendance).where(eq(attendance.workspaceSubdomain, subdomain));

  if (list.length === 0) return;

  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db.insert(attendance).values(values);
}

export async function deleteAttendanceRecordsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(attendance)
    .where(eq(attendance.workspaceSubdomain, subdomain));
}
