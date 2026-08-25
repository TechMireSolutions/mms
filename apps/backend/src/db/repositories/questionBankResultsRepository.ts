import { and, eq, inArray, isNull } from 'drizzle-orm';
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

  for (const qId of questionIds) {
    const ans = record.answers?.[qId] ?? '';
    const sc = record.scores?.[qId] ?? 0;
    await tx.insert(assessmentAnswers).values({
      workspaceSubdomain: subdomain,
      resultId: record.id,
      questionId: qId,
      studentAnswer: ans,
      score: String(sc),
    });
  }
}

export async function listResultsByWorkspace(tenant: string): Promise<QuestionBankResult[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(assessmentResults)
      .where(and(eq(assessmentResults.workspaceSubdomain, subdomain), isNull(assessmentResults.deletedAt)));
    if (rows.length === 0) return [];

    const resIds = rows.map((r) => r.id);
    const allAnswers = await tx
      .select()
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
      resultRowToRecord(r, answersByRes.get(r.id) ?? {}, scoresByRes.get(r.id) ?? {}),
    );
  });
}

export async function findResultById(tenant: string, id: string): Promise<QuestionBankResult | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(assessmentResults)
      .where(and(eq(assessmentResults.workspaceSubdomain, subdomain), eq(assessmentResults.id, id)));
    const row = rows[0];
    if (!row) return null;

    const allAnswers = await tx
      .select()
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

    return resultRowToRecord(row, ansMap, scoreMap);
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

export async function bulkSaveResults(tenant: string, records: QuestionBankResult[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
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
    }
  });
}

export async function replaceResultsForWorkspace(tenant: string, records: QuestionBankResult[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(assessmentAnswers).where(eq(assessmentAnswers.workspaceSubdomain, subdomain));
    await tx.delete(assessmentResults).where(eq(assessmentResults.workspaceSubdomain, subdomain));

    for (const record of records) {
      await tx.insert(assessmentResults).values({
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
      });

      await syncResultChildren(tx, subdomain, record);
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
