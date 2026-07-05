import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Teacher, applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { teachers } from '../schema.js';

function rowToTeacher(row: typeof teachers.$inferSelect): Teacher {
  return {
    ...(row.customData as Omit<Teacher, 'id'>),
    id: row.id,
  } as Teacher;
}

export async function listTeachersByWorkspace(workspaceSubdomain: string): Promise<Teacher[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(teachers)
    .where(eq(teachers.workspaceSubdomain, subdomain));
  return rows.map(rowToTeacher);
}

export async function findTeacherById(workspaceSubdomain: string, id: string): Promise<Teacher | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(teachers)
    .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)));
  const row = rows[0];
  return row ? rowToTeacher(row) : null;
}

export async function findTeachersByIds(workspaceSubdomain: string, ids: string[]): Promise<Teacher[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(teachers)
    .where(and(eq(teachers.workspaceSubdomain, subdomain), inArray(teachers.id, ids)));
  return rows.map(rowToTeacher);
}

export async function saveTeacher(workspaceSubdomain: string, teacher: Teacher): Promise<void> {
  const processedTeacher = applyTitleCaseRecursive(teacher) as Teacher;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedTeacher.id);
  const { id: _, ...extra } = processedTeacher;
  const db = getDb();

  const existing = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)));

  if (existing.length > 0) {
    await db
      .update(teachers)
      .set({
        customData: sql`COALESCE(${teachers.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)));
  } else {
    await db.insert(teachers).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function bulkSaveTeachers(workspaceSubdomain: string, list: Teacher[]): Promise<void> {
  if (list.length === 0) return;
  const processedList = applyTitleCaseRecursive(list) as Teacher[];
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  const values = processedList.map((teacher) => {
    const id = String(teacher.id);
    const { id: _, ...extra } = teacher;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db
    .insert(teachers)
    .values(values)
    .onConflictDoUpdate({
      target: teachers.id,
      set: {
        customData: sql`COALESCE(${teachers.customData}, '{}'::jsonb) || excluded.custom_data`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

export async function deleteTeacher(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(teachers)
    .where(and(eq(teachers.workspaceSubdomain, subdomain), eq(teachers.id, id)));
}

export async function replaceTeachersForWorkspace(
  workspaceSubdomain: string,
  list: Teacher[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(teachers).where(eq(teachers.workspaceSubdomain, subdomain));

  if (list.length === 0) return;

  const values = list.map((teacher) => {
    const id = String(teacher.id);
    const { id: _, ...extra } = teacher;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db.insert(teachers).values(values);
}

export async function deleteTeachersByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(teachers)
    .where(eq(teachers.workspaceSubdomain, subdomain));
}
