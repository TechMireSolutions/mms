import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type QuestionBankResult } from '@mms/shared';
import {
  questions,
  questionCategories,
  questionOptions,
  questionTags,
  questionCitations,
  tests,
  testQuestions,
  testSections,
  testSectionQuestions,
  assessmentResults,
  assessmentAnswers,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ResultRow = typeof assessmentResults.$inferSelect;

export function resultRowToRecord(
  row: ResultRow,
  answers: Record<string, string> = {},
  scores: Record<string, number> = {},
): QuestionBankResult {
  return {
    id: row.id,
    testId: row.testId,
    studentId: row.studentId,
    studentName: row.studentName,
    submittedAt: row.submittedAt,
    answers,
    scores,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
  };
}

async function syncResultChildren(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  subdomain: string,
  record: QuestionBankResult,
): Promise<void> {
  await tx
    .delete(assessmentAnswers)
    .where(
      and(
        eq(assessmentAnswers.workspaceSubdomain, subdomain),
        eq(assessmentAnswers.resultId, record.id),
      ),
    );

  const questionIds = new Set<string>([
    ...Object.keys(record.answers ?? {}),
    ...Object.keys(record.scores ?? {}),
  ]);

  const answerRows = Array.from(questionIds).map((qId) => ({
    workspaceSubdomain: subdomain,
    resultId: record.id,
    questionId: qId,
    studentAnswer: record.answers?.[qId] ?? '',
    score: String(record.scores?.[qId] ?? 0),
  }));
  if (answerRows.length > 0) {
    await tx.insert(assessmentAnswers).values(answerRows);
  }
}

export async function listResultsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<QuestionBankResult[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: assessmentResults.id,
        testId: assessmentResults.testId,
        studentId: assessmentResults.studentId,
        studentName: assessmentResults.studentName,
        submittedAt: assessmentResults.submittedAt,
        deletedAt: assessmentResults.deletedAt,
        deletedBy: assessmentResults.deletedBy,
        deletionReason: assessmentResults.deletionReason,
      })
      .from(assessmentResults)
      .where(and(eq(assessmentResults.workspaceSubdomain, subdomain), isNull(assessmentResults.deletedAt)))
      .limit(limit)
      .offset(offset);
    if (rows.length === 0) return [];

    const resIds = rows.map((r) => r.id);
    const allAnswers = await tx
      .select({
        resultId: assessmentAnswers.resultId,
        questionId: assessmentAnswers.questionId,
        studentAnswer: assessmentAnswers.studentAnswer,
        score: assessmentAnswers.score,
      })
      .from(assessmentAnswers)
      .where(
        and(
          eq(assessmentAnswers.workspaceSubdomain, subdomain),
          inArray(assessmentAnswers.resultId, resIds),
        ),
      );

    const answersByRes = new Map<string, Record<string, string>>();
    const scoresByRes = new Map<string, Record<string, number>>();

    for (const a of allAnswers) {
      const ansMap = answersByRes.get(a.resultId) ?? {};
      ansMap[a.questionId] = a.studentAnswer;
      answersByRes.set(a.resultId, ansMap);

      const scoreMap = scoresByRes.get(a.resultId) ?? {};
      scoreMap[a.questionId] = Number(a.score ?? 0);
      scoresByRes.set(a.resultId, scoreMap);
    }

    return rows.map((r) =>
      resultRowToRecord(r as unknown as ResultRow, answersByRes.get(r.id) ?? {}, scoresByRes.get(r.id) ?? {}),
    );
  });
}

export async function findResultById(tenant: string, id: string): Promise<QuestionBankResult | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: assessmentResults.id,
        testId: assessmentResults.testId,
        studentId: assessmentResults.studentId,
        studentName: assessmentResults.studentName,
        submittedAt: assessmentResults.submittedAt,
        deletedAt: assessmentResults.deletedAt,
        deletedBy: assessmentResults.deletedBy,
        deletionReason: assessmentResults.deletionReason,
      })
      .from(assessmentResults)
      .where(and(eq(assessmentResults.workspaceSubdomain, subdomain), eq(assessmentResults.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const allAnswers = await tx
      .select({
        resultId: assessmentAnswers.resultId,
        questionId: assessmentAnswers.questionId,
        studentAnswer: assessmentAnswers.studentAnswer,
        score: assessmentAnswers.score,
      })
      .from(assessmentAnswers)
      .where(
        and(
          eq(assessmentAnswers.workspaceSubdomain, subdomain),
          eq(assessmentAnswers.resultId, id),
        ),
      );

    const ansMap: Record<string, string> = {};
    const scoreMap: Record<string, number> = {};

    for (const a of allAnswers) {
      ansMap[a.questionId] = a.studentAnswer;
      scoreMap[a.questionId] = Number(a.score ?? 0);
    }

    return resultRowToRecord(row as unknown as ResultRow, ansMap, scoreMap);
  });
}

export async function saveResult(tenant: string, record: QuestionBankResult): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(assessmentResults)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        testId: record.testId,
        studentId: record.studentId,
        studentName: record.studentName ?? '',
        submittedAt: record.submittedAt,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [assessmentResults.workspaceSubdomain, assessmentResults.id],
        set: {
          testId: record.testId,
          studentId: record.studentId,
          studentName: record.studentName ?? '',
          submittedAt: record.submittedAt,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });

    await syncResultChildren(tx, subdomain, record);
  });
}

function flattenAnswerRows(subdomain: string, records: QuestionBankResult[]) {
  return records.flatMap((record) => {
    const questionIds = new Set<string>([
      ...Object.keys(record.answers ?? {}),
      ...Object.keys(record.scores ?? {}),
    ]);
    return Array.from(questionIds).map((qId) => ({
      workspaceSubdomain: subdomain,
      resultId: record.id,
      questionId: qId,
      studentAnswer: record.answers?.[qId] ?? '',
      score: record.scores?.[qId] != null ? String(record.scores[qId]) : '0',
    }));
  });
}

export async function bulkSaveResults(tenant: string, records: QuestionBankResult[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    const resIds = records.map((r) => r.id);

    await tx
      .insert(assessmentResults)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          testId: record.testId,
          studentId: record.studentId,
          studentName: record.studentName ?? '',
          submittedAt: record.submittedAt,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [assessmentResults.workspaceSubdomain, assessmentResults.id],
        set: {
          testId: sql`excluded.test_id`,
          studentId: sql`excluded.student_id`,
          studentName: sql`excluded.student_name`,
          submittedAt: sql`excluded.submitted_at`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });

    await tx
      .delete(assessmentAnswers)
      .where(
        and(
          eq(assessmentAnswers.workspaceSubdomain, subdomain),
          inArray(assessmentAnswers.resultId, resIds),
        ),
      );

    const allAnswerRows = flattenAnswerRows(subdomain, records);
    if (allAnswerRows.length > 0) {
      await tx.insert(assessmentAnswers).values(allAnswerRows);
    }
  });
}

export async function replaceResultsForWorkspace(tenant: string, records: QuestionBankResult[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(assessmentAnswers).where(eq(assessmentAnswers.workspaceSubdomain, subdomain));
    await tx.delete(assessmentResults).where(eq(assessmentResults.workspaceSubdomain, subdomain));

    if (records.length === 0) return;

    await tx.insert(assessmentResults).values(
      records.map((record) => ({
        id: record.id,
        workspaceSubdomain: subdomain,
        testId: record.testId,
        studentId: record.studentId,
        studentName: record.studentName ?? '',
        submittedAt: record.submittedAt,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })),
    );

    const allAnswerRows = flattenAnswerRows(subdomain, records);
    if (allAnswerRows.length > 0) {
      await tx.insert(assessmentAnswers).values(allAnswerRows);
    }
  });
}

export async function deleteQuestionBankByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(assessmentAnswers).where(eq(assessmentAnswers.workspaceSubdomain, subdomain));
    await tx.delete(assessmentResults).where(eq(assessmentResults.workspaceSubdomain, subdomain));
    await tx.delete(testSectionQuestions).where(eq(testSectionQuestions.workspaceSubdomain, subdomain));
    await tx.delete(testSections).where(eq(testSections.workspaceSubdomain, subdomain));
    await tx.delete(testQuestions).where(eq(testQuestions.workspaceSubdomain, subdomain));
    await tx.delete(tests).where(eq(tests.workspaceSubdomain, subdomain));
    await tx.delete(questionCitations).where(eq(questionCitations.workspaceSubdomain, subdomain));
    await tx.delete(questionTags).where(eq(questionTags.workspaceSubdomain, subdomain));
    await tx.delete(questionOptions).where(eq(questionOptions.workspaceSubdomain, subdomain));
    await tx.delete(questionCategories).where(eq(questionCategories.workspaceSubdomain, subdomain));
    await tx.delete(questions).where(eq(questions.workspaceSubdomain, subdomain));
  });
}
