import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type QuestionBankTest } from '@mms/shared';
import {
  tests,
  testQuestions,
  testSections,
  testSectionQuestions,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { syncTestChildren, testRowToRecord } from './questionBankTestsSync.js';

export { testRowToRecord } from './questionBankTestsSync.js';

export async function listTestsByWorkspace(tenant: string): Promise<QuestionBankTest[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(tests)
      .where(and(eq(tests.workspaceSubdomain, subdomain), isNull(tests.deletedAt)));
    if (rows.length === 0) return [];

    const tIds = rows.map((r) => r.id);
    const [allTQs, allSections] = await Promise.all([
      tx
        .select()
        .from(testQuestions)
        .where(
          and(
            eq(testQuestions.workspaceSubdomain, subdomain),
            inArray(testQuestions.testId, tIds),
          ),
        ),
      tx
        .select()
        .from(testSections)
        .where(
          and(
            eq(testSections.workspaceSubdomain, subdomain),
            inArray(testSections.testId, tIds),
          ),
        ),
    ]);

    const qByTest = new Map<string, Array<{ index: number; qId: string }>>();
    for (const tq of allTQs) {
      const arr = qByTest.get(tq.testId) ?? [];
      arr.push({ index: tq.sortOrder, qId: tq.questionId });
      qByTest.set(tq.testId, arr);
    }

    const secIds = allSections.map((s) => s.id);
    const allSecQs = secIds.length > 0
      ? await tx
          .select()
          .from(testSectionQuestions)
          .where(
            and(
              eq(testSectionQuestions.workspaceSubdomain, subdomain),
              inArray(testSectionQuestions.sectionId, secIds),
            ),
          )
      : [];

    const qBySec = new Map<string, Array<{ index: number; qId: string }>>();
    for (const sq of allSecQs) {
      const arr = qBySec.get(sq.sectionId) ?? [];
      arr.push({ index: sq.sortOrder, qId: sq.questionId });
      qBySec.set(sq.sectionId, arr);
    }

    const secByTest = new Map<string, typeof allSections>();
    for (const s of allSections) {
      const arr = secByTest.get(s.testId) ?? [];
      arr.push(s);
      secByTest.set(s.testId, arr);
    }

    return rows.map((r) => {
      const testQs = (qByTest.get(r.id) ?? [])
        .sort((a, b) => a.index - b.index)
        .map((q) => q.qId);

      const testSecs = (secByTest.get(r.id) ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => {
          const sqs = (qBySec.get(s.id) ?? [])
            .sort((a, b) => a.index - b.index)
            .map((q) => q.qId);
          return {
            id: s.id,
            title: s.title,
            instructions: s.instructions,
            questionIds: sqs,
          };
        });

      return testRowToRecord(r, testQs, testSecs);
    });
  });
}

export async function findTestById(tenant: string, id: string): Promise<QuestionBankTest | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(tests)
      .where(and(eq(tests.workspaceSubdomain, subdomain), eq(tests.id, id)));
    const row = rows[0];
    if (!row) return null;

    const [allTQs, allSections] = await Promise.all([
      tx
        .select()
        .from(testQuestions)
        .where(
          and(
            eq(testQuestions.workspaceSubdomain, subdomain),
            eq(testQuestions.testId, id),
          ),
        ),
      tx
        .select()
        .from(testSections)
        .where(
          and(
            eq(testSections.workspaceSubdomain, subdomain),
            eq(testSections.testId, id),
          ),
        ),
    ]);

    const testQs = allTQs.sort((a, b) => a.sortOrder - b.sortOrder).map((q) => q.questionId);
    const secIds = allSections.map((s) => s.id);
    const allSecQs = secIds.length > 0
      ? await tx
          .select()
          .from(testSectionQuestions)
          .where(
            and(
              eq(testSectionQuestions.workspaceSubdomain, subdomain),
              inArray(testSectionQuestions.sectionId, secIds),
            ),
          )
      : [];

    const qBySec = new Map<string, Array<{ index: number; qId: string }>>();
    for (const sq of allSecQs) {
      const arr = qBySec.get(sq.sectionId) ?? [];
      arr.push({ index: sq.sortOrder, qId: sq.questionId });
      qBySec.set(sq.sectionId, arr);
    }

    const testSecs = allSections
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => {
        const sqs = (qBySec.get(s.id) ?? [])
          .sort((a, b) => a.index - b.index)
          .map((q) => q.qId);
        return {
          id: s.id,
          title: s.title,
          instructions: s.instructions,
          questionIds: sqs,
        };
      });

    return testRowToRecord(row, testQs, testSecs);
  });
}

export async function saveTest(tenant: string, record: QuestionBankTest): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(tests)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        categoryId: record.categoryId ?? null,
        difficulty: record.difficulty ?? 'mixed',
        duration: record.duration ?? 60,
        examClass: record.examClass ?? null,
        totalMarks: record.totalMarks ?? null,
        instructions: record.instructions ?? null,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [tests.workspaceSubdomain, tests.id],
        set: {
          name: record.name,
          categoryId: record.categoryId ?? null,
          difficulty: record.difficulty ?? 'mixed',
          duration: record.duration ?? 60,
          examClass: record.examClass ?? null,
          totalMarks: record.totalMarks ?? null,
          instructions: record.instructions ?? null,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });

    await syncTestChildren(tx, subdomain, record);
  });
}

export async function bulkSaveTests(tenant: string, records: QuestionBankTest[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(tests)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          categoryId: record.categoryId ?? null,
          difficulty: record.difficulty ?? 'mixed',
          duration: record.duration ?? 60,
          examClass: record.examClass ?? null,
          totalMarks: record.totalMarks ?? null,
          instructions: record.instructions ?? null,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [tests.workspaceSubdomain, tests.id],
          set: {
            name: record.name,
            categoryId: record.categoryId ?? null,
            difficulty: record.difficulty ?? 'mixed',
            duration: record.duration ?? 60,
            examClass: record.examClass ?? null,
            totalMarks: record.totalMarks ?? null,
            instructions: record.instructions ?? null,
            deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
            deletedBy: record.deletedBy ?? null,
            deletionReason: record.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });

      await syncTestChildren(tx, subdomain, record);
    }
  });
}

export async function replaceTestsForWorkspace(tenant: string, records: QuestionBankTest[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(testSectionQuestions).where(eq(testSectionQuestions.workspaceSubdomain, subdomain));
    await tx.delete(testSections).where(eq(testSections.workspaceSubdomain, subdomain));
    await tx.delete(testQuestions).where(eq(testQuestions.workspaceSubdomain, subdomain));
    await tx.delete(tests).where(eq(tests.workspaceSubdomain, subdomain));

    for (const record of records) {
      await tx.insert(tests).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        categoryId: record.categoryId ?? null,
        difficulty: record.difficulty ?? 'mixed',
        duration: record.duration ?? 60,
        examClass: record.examClass ?? null,
        totalMarks: record.totalMarks ?? null,
        instructions: record.instructions ?? null,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      });

      await syncTestChildren(tx, subdomain, record);
    }
  });
}
