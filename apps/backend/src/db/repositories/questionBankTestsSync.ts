import { and, eq, inArray } from 'drizzle-orm';
import { type QuestionBankTest } from '@mms/shared';
import {
  type tests,
  testQuestions,
  testSections,
  testSectionQuestions,
} from '../schema.js';
import { type withTenant } from '../tenant-context.js';

type TestRow = typeof tests.$inferSelect;
type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

export function testRowToRecord(
  row: TestRow,
  questionIds: string[] = [],
  sections: Array<{ id: string; title: string; instructions: string; questionIds: string[] }> = [],
): QuestionBankTest {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    questionIds,
    difficulty: row.difficulty as QuestionBankTest['difficulty'],
    duration: row.duration,
    createdAt: row.createdAt.toISOString(),
    examClass: row.examClass ?? undefined,
    totalMarks: row.totalMarks ?? undefined,
    instructions: row.instructions ?? undefined,
    sections: sections.length > 0 ? sections : undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
  };
}

export async function syncTestChildren(
  tx: Transaction,
  subdomain: string,
  record: QuestionBankTest,
): Promise<void> {
  const existingSections = await tx
    .select({ id: testSections.id })
    .from(testSections)
    .where(and(eq(testSections.workspaceSubdomain, subdomain), eq(testSections.testId, record.id)));

  if (existingSections.length > 0) {
    const sIds = existingSections.map((s) => s.id);
    await tx
      .delete(testSectionQuestions)
      .where(
        and(
          eq(testSectionQuestions.workspaceSubdomain, subdomain),
          inArray(testSectionQuestions.sectionId, sIds),
        ),
      );
  }

  await tx
    .delete(testSections)
    .where(and(eq(testSections.workspaceSubdomain, subdomain), eq(testSections.testId, record.id)));
  await tx
    .delete(testQuestions)
    .where(and(eq(testQuestions.workspaceSubdomain, subdomain), eq(testQuestions.testId, record.id)));

  if (record.questionIds && record.questionIds.length > 0) {
    for (let i = 0; i < record.questionIds.length; i++) {
      const qId = record.questionIds[i]!;
      await tx.insert(testQuestions).values({
        workspaceSubdomain: subdomain,
        testId: record.id,
        questionId: qId,
        sortOrder: i,
      });
    }
  }

  if (record.sections && record.sections.length > 0) {
    for (let i = 0; i < record.sections.length; i++) {
      const sec = record.sections[i]!;
      await tx.insert(testSections).values({
        id: sec.id,
        workspaceSubdomain: subdomain,
        testId: record.id,
        title: sec.title,
        instructions: sec.instructions ?? '',
        sortOrder: i,
      });

      if (sec.questionIds && sec.questionIds.length > 0) {
        for (let j = 0; j < sec.questionIds.length; j++) {
          const sqId = sec.questionIds[j]!;
          await tx.insert(testSectionQuestions).values({
            workspaceSubdomain: subdomain,
            sectionId: sec.id,
            questionId: sqId,
            sortOrder: j,
          });
        }
      }
    }
  }
}
