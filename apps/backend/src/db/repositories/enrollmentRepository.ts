import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Enrollment, applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { enrollments } from '../schema.js';

function rowToEnrollment(row: typeof enrollments.$inferSelect): Enrollment {
  return {
    ...(row.customData as Omit<Enrollment, 'id'>),
    id: row.id,
  } as Enrollment;
}

export async function listEnrollmentsByWorkspace(workspaceSubdomain: string): Promise<Enrollment[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(enrollments)
    .where(eq(enrollments.workspaceSubdomain, subdomain));
  return rows.map(rowToEnrollment);
}

export async function findEnrollmentById(workspaceSubdomain: string, id: string): Promise<Enrollment | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.workspaceSubdomain, subdomain), eq(enrollments.id, id)));
  const row = rows[0];
  return row ? rowToEnrollment(row) : null;
}

export async function findEnrollmentsByIds(workspaceSubdomain: string, ids: string[]): Promise<Enrollment[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.workspaceSubdomain, subdomain), inArray(enrollments.id, ids)));
  return rows.map(rowToEnrollment);
}

export async function saveEnrollment(workspaceSubdomain: string, record: Enrollment): Promise<void> {
  const processedRecord = applyTitleCaseRecursive(record) as Enrollment;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedRecord.id);
  const { id: _, ...extra } = processedRecord;
  const db = getDb();

  const existing = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.workspaceSubdomain, subdomain), eq(enrollments.id, id)));

  if (existing.length > 0) {
    await db
      .update(enrollments)
      .set({
        customData: sql`COALESCE(${enrollments.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(enrollments.workspaceSubdomain, subdomain), eq(enrollments.id, id)));
  } else {
    await db.insert(enrollments).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function bulkSaveEnrollments(workspaceSubdomain: string, list: Enrollment[]): Promise<void> {
  if (list.length === 0) return;
  const processedList = applyTitleCaseRecursive(list) as Enrollment[];
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
    .insert(enrollments)
    .values(values)
    .onConflictDoUpdate({
      target: enrollments.id,
      set: {
        customData: sql`COALESCE(${enrollments.customData}, '{}'::jsonb) || excluded.custom_data`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

export async function deleteEnrollment(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(enrollments)
    .where(and(eq(enrollments.workspaceSubdomain, subdomain), eq(enrollments.id, id)));
}

export async function replaceEnrollmentsForWorkspace(
  workspaceSubdomain: string,
  list: Enrollment[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(enrollments).where(eq(enrollments.workspaceSubdomain, subdomain));

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

  await db.insert(enrollments).values(values);
}

export async function deleteEnrollmentsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(enrollments)
    .where(eq(enrollments.workspaceSubdomain, subdomain));
}
