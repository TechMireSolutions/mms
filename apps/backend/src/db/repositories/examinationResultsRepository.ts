import { and, eq } from 'drizzle-orm';
import { type ExamResult } from '@mms/shared';
import { examResults, examClasses, exams } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ResultRow = typeof examResults.$inferSelect;

function resultRowToRecord(row: ResultRow): ExamResult {
  return {
    id: row.id,
    examId: row.examId,
    studentId: row.studentId,
    marksObtained: row.marksObtained,
  };
}

export async function listExamResultsByWorkspace(tenant: string): Promise<ExamResult[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(examResults)
      .where(eq(examResults.workspaceSubdomain, subdomain));
    return rows.map(resultRowToRecord);
  });
}

export async function findExamResultById(tenant: string, id: string): Promise<ExamResult | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(examResults)
      .where(
        and(
          eq(examResults.workspaceSubdomain, subdomain),
          eq(examResults.id, id),
        ),
      );
    const row = rows[0];
    return row ? resultRowToRecord(row) : null;
  });
}

export async function saveExamResult(tenant: string, record: ExamResult): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(examResults)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        examId: record.examId,
        studentId: record.studentId,
        marksObtained: record.marksObtained ?? 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [examResults.workspaceSubdomain, examResults.id],
        set: {
          examId: record.examId,
          studentId: record.studentId,
          marksObtained: record.marksObtained ?? 0,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveExamResults(tenant: string, records: ExamResult[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(examResults)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          examId: r.examId,
          studentId: r.studentId,
          marksObtained: r.marksObtained ?? 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [examResults.workspaceSubdomain, examResults.id],
          set: {
            examId: r.examId,
            studentId: r.studentId,
            marksObtained: r.marksObtained ?? 0,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceExamResultsForWorkspace(tenant: string, records: ExamResult[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(examResults).where(eq(examResults.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(examResults).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        examId: r.examId,
        studentId: r.studentId,
        marksObtained: r.marksObtained ?? 0,
        updatedAt: new Date(),
      });
    }
  });
}

export async function deleteExaminationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(examResults).where(eq(examResults.workspaceSubdomain, subdomain));
    await tx.delete(examClasses).where(eq(examClasses.workspaceSubdomain, subdomain));
    await tx.delete(exams).where(eq(exams.workspaceSubdomain, subdomain));
  });
}
