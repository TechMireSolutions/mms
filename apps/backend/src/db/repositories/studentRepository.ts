import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Student, applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { students } from '../schema.js';

function rowToStudent(row: typeof students.$inferSelect): Student {
  return {
    ...(row.customData as Omit<Student, 'id'>),
    id: row.id,
  } as Student;
}

export async function listStudentsByWorkspace(workspaceSubdomain: string): Promise<Student[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(students)
    .where(eq(students.workspaceSubdomain, subdomain));
  return rows.map(rowToStudent);
}

export async function findStudentById(workspaceSubdomain: string, id: string): Promise<Student | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(students)
    .where(and(eq(students.workspaceSubdomain, subdomain), eq(students.id, id)));
  const row = rows[0];
  return row ? rowToStudent(row) : null;
}

export async function findStudentsByIds(workspaceSubdomain: string, ids: string[]): Promise<Student[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(students)
    .where(and(eq(students.workspaceSubdomain, subdomain), inArray(students.id, ids)));
  return rows.map(rowToStudent);
}

export async function saveStudent(workspaceSubdomain: string, student: Student): Promise<void> {
  const processedStudent = applyTitleCaseRecursive(student) as Student;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedStudent.id);
  const { id: _, ...extra } = processedStudent;
  const db = getDb();

  const existing = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.workspaceSubdomain, subdomain), eq(students.id, id)));

  if (existing.length > 0) {
    await db
      .update(students)
      .set({
        customData: sql`COALESCE(${students.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(students.workspaceSubdomain, subdomain), eq(students.id, id)));
  } else {
    await db.insert(students).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function bulkSaveStudents(workspaceSubdomain: string, list: Student[]): Promise<void> {
  if (list.length === 0) return;
  const processedList = applyTitleCaseRecursive(list) as Student[];
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  const values = processedList.map((student) => {
    const id = String(student.id);
    const { id: _, ...extra } = student;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db
    .insert(students)
    .values(values)
    .onConflictDoUpdate({
      target: students.id,
      set: {
        customData: sql`COALESCE(${students.customData}, '{}'::jsonb) || excluded.custom_data`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

export async function deleteStudent(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(students)
    .where(and(eq(students.workspaceSubdomain, subdomain), eq(students.id, id)));
}

export async function replaceStudentsForWorkspace(
  workspaceSubdomain: string,
  list: Student[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(students).where(eq(students.workspaceSubdomain, subdomain));

  if (list.length === 0) return;

  const values = list.map((student) => {
    const id = String(student.id);
    const { id: _, ...extra } = student;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db.insert(students).values(values);
}

export async function deleteStudentsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(students)
    .where(eq(students.workspaceSubdomain, subdomain));
}
