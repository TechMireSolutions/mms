import { and, eq } from 'drizzle-orm';
import { type Exam, type ExamResult } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { exams, examResults } from '../schema.js';

// --- Helper row mappers ---
function rowToExam(row: typeof exams.$inferSelect): Exam {
  return { ...(row.customData as Omit<Exam, 'id'>), id: row.id } as Exam;
}
function rowToExamResult(row: typeof examResults.$inferSelect): ExamResult {
  return { ...(row.customData as Omit<ExamResult, 'id'>), id: row.id } as ExamResult;
}

// ==========================================
// 1. Exams
// ==========================================
export async function listExamsByWorkspace(workspaceSubdomain: string): Promise<Exam[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(exams).where(eq(exams.workspaceSubdomain, subdomain));
  return rows.map(rowToExam);
}

export async function findExamById(workspaceSubdomain: string, id: string): Promise<Exam | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(exams).where(and(eq(exams.workspaceSubdomain, subdomain), eq(exams.id, id)));
  const row = rows[0];
  return row ? rowToExam(row) : null;
}

export async function saveExam(workspaceSubdomain: string, record: Exam): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(record.id);
  const { id: _, ...extra } = record;
  const db = getDb();

  const existing = await db
    .select({ id: exams.id })
    .from(exams)
    .where(and(eq(exams.workspaceSubdomain, subdomain), eq(exams.id, id)));

  if (existing.length > 0) {
    await db
      .update(exams)
      .set({
        customData: extra,
        updatedAt: new Date(),
      })
      .where(and(eq(exams.workspaceSubdomain, subdomain), eq(exams.id, id)));
  } else {
    await db.insert(exams).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function replaceExamsForWorkspace(workspaceSubdomain: string, list: Exam[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(exams).where(eq(exams.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(exams).values(values);
}

// ==========================================
// 2. Exam Results
// ==========================================
export async function listExamResultsByWorkspace(workspaceSubdomain: string): Promise<ExamResult[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(examResults).where(eq(examResults.workspaceSubdomain, subdomain));
  return rows.map(rowToExamResult);
}

export async function findExamResultById(workspaceSubdomain: string, id: string): Promise<ExamResult | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(examResults).where(and(eq(examResults.workspaceSubdomain, subdomain), eq(examResults.id, id)));
  const row = rows[0];
  return row ? rowToExamResult(row) : null;
}

export async function saveExamResult(workspaceSubdomain: string, record: ExamResult): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(record.id);
  const { id: _, ...extra } = record;
  const db = getDb();

  const existing = await db
    .select({ id: examResults.id })
    .from(examResults)
    .where(and(eq(examResults.workspaceSubdomain, subdomain), eq(examResults.id, id)));

  if (existing.length > 0) {
    await db
      .update(examResults)
      .set({
        customData: extra,
        updatedAt: new Date(),
      })
      .where(and(eq(examResults.workspaceSubdomain, subdomain), eq(examResults.id, id)));
  } else {
    await db.insert(examResults).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function replaceExamResultsForWorkspace(workspaceSubdomain: string, list: ExamResult[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(examResults).where(eq(examResults.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(examResults).values(values);
}

// ==========================================
// 3. Workspace Purge
// ==========================================
export async function deleteExaminationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(exams).where(eq(exams.workspaceSubdomain, subdomain));
  await db.delete(examResults).where(eq(examResults.workspaceSubdomain, subdomain));
}
