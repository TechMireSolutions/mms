import { and, eq, inArray, isNull } from 'drizzle-orm';
import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
} from '@mms/shared';
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

// --- Questions ---

type QuestionRow = typeof questions.$inferSelect;

export function questionRowToRecord(
  row: QuestionRow,
  categories: string[] = [],
  options: string[] = [],
  tags: string[] = [],
  citations: Array<{ bookId: string; citation: Record<string, unknown> }> = [],
): QuestionBankQuestion {
  return {
    id: row.id,
    categoryIds: categories,
    categoryId: categories[0] ?? undefined,
    type: row.type as QuestionBankQuestion['type'],
    difficulty: row.difficulty as QuestionBankQuestion['difficulty'],
    questionLanguage: row.questionLanguage as QuestionBankQuestion['questionLanguage'],
    text: row.text,
    options,
    answer: row.answer,
    marks: row.marks,
    tags: tags.length > 0 ? tags : undefined,
    sourceCitations: citations.length > 0 ? citations : undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
  };
}

async function syncQuestionChildren(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  subdomain: string,
  record: QuestionBankQuestion,
): Promise<void> {
  // Delete existing child records
  await Promise.all([
    tx
      .delete(questionCategories)
      .where(
        and(
          eq(questionCategories.workspaceSubdomain, subdomain),
          eq(questionCategories.questionId, record.id),
        ),
      ),
    tx
      .delete(questionOptions)
      .where(
        and(
          eq(questionOptions.workspaceSubdomain, subdomain),
          eq(questionOptions.questionId, record.id),
        ),
      ),
    tx
      .delete(questionTags)
      .where(
        and(
          eq(questionTags.workspaceSubdomain, subdomain),
          eq(questionTags.questionId, record.id),
        ),
      ),
    tx
      .delete(questionCitations)
      .where(
        and(
          eq(questionCitations.workspaceSubdomain, subdomain),
          eq(questionCitations.questionId, record.id),
        ),
      ),
  ]);

  // Insert categories
  const catIds = record.categoryIds ?? (record.categoryId ? [record.categoryId] : []);
  for (const catId of catIds) {
    await tx.insert(questionCategories).values({
      workspaceSubdomain: subdomain,
      questionId: record.id,
      categoryId: catId,
    });
  }

  // Insert options
  if (record.options && record.options.length > 0) {
    for (let i = 0; i < record.options.length; i++) {
      const opt = record.options[i]!;
      await tx.insert(questionOptions).values({
        id: `${record.id}_opt_${i}`,
        workspaceSubdomain: subdomain,
        questionId: record.id,
        optionIndex: i,
        optionText: opt,
      });
    }
  }

  // Insert tags
  if (record.tags && record.tags.length > 0) {
    for (const tag of record.tags) {
      await tx.insert(questionTags).values({
        workspaceSubdomain: subdomain,
        questionId: record.id,
        tag,
      });
    }
  }

  // Insert citations
  if (record.sourceCitations && record.sourceCitations.length > 0) {
    for (let i = 0; i < record.sourceCitations.length; i++) {
      const cit = record.sourceCitations[i]!;
      await tx.insert(questionCitations).values({
        id: `${record.id}_cit_${i}`,
        workspaceSubdomain: subdomain,
        questionId: record.id,
        bookId: cit.bookId,
        citation: JSON.stringify(cit.citation ?? {}),
      });
    }
  }
}

export async function listQuestionsByWorkspace(tenant: string): Promise<QuestionBankQuestion[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(questions)
      .where(and(eq(questions.workspaceSubdomain, subdomain), isNull(questions.deletedAt)));
    if (rows.length === 0) return [];

    const qIds = rows.map((r) => r.id);
    const [allCats, allOpts, allTags, allCits] = await Promise.all([
      tx
        .select()
        .from(questionCategories)
        .where(
          and(
            eq(questionCategories.workspaceSubdomain, subdomain),
            inArray(questionCategories.questionId, qIds),
          ),
        ),
      tx
        .select()
        .from(questionOptions)
        .where(
          and(
            eq(questionOptions.workspaceSubdomain, subdomain),
            inArray(questionOptions.questionId, qIds),
          ),
        ),
      tx
        .select()
        .from(questionTags)
        .where(
          and(
            eq(questionTags.workspaceSubdomain, subdomain),
            inArray(questionTags.questionId, qIds),
          ),
        ),
      tx
        .select()
        .from(questionCitations)
        .where(
          and(
            eq(questionCitations.workspaceSubdomain, subdomain),
            inArray(questionCitations.questionId, qIds),
          ),
        ),
    ]);

    const catsByQ = new Map<string, string[]>();
    for (const c of allCats) {
      const arr = catsByQ.get(c.questionId) ?? [];
      arr.push(c.categoryId);
      catsByQ.set(c.questionId, arr);
    }

    const optsByQ = new Map<string, Array<{ index: number; text: string }>>();
    for (const o of allOpts) {
      const arr = optsByQ.get(o.questionId) ?? [];
      arr.push({ index: o.optionIndex, text: o.optionText });
      optsByQ.set(o.questionId, arr);
    }

    const tagsByQ = new Map<string, string[]>();
    for (const t of allTags) {
      const arr = tagsByQ.get(t.questionId) ?? [];
      arr.push(t.tag);
      tagsByQ.set(t.questionId, arr);
    }

    const citsByQ = new Map<string, Array<{ bookId: string; citation: Record<string, unknown> }>>();
    for (const ci of allCits) {
      const arr = citsByQ.get(ci.questionId) ?? [];
      let parsedCit: Record<string, unknown> = {};
      try {
        parsedCit = JSON.parse(ci.citation || '{}');
      } catch {
        // ignore
      }
      arr.push({ bookId: ci.bookId, citation: parsedCit });
      citsByQ.set(ci.questionId, arr);
    }

    return rows.map((r) => {
      const sortedOpts = (optsByQ.get(r.id) ?? [])
        .sort((a, b) => a.index - b.index)
        .map((o) => o.text);
      return questionRowToRecord(
        r,
        catsByQ.get(r.id) ?? [],
        sortedOpts,
        tagsByQ.get(r.id) ?? [],
        citsByQ.get(r.id) ?? [],
      );
    });
  });
}

export async function findQuestionById(tenant: string, id: string): Promise<QuestionBankQuestion | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(questions)
      .where(and(eq(questions.workspaceSubdomain, subdomain), eq(questions.id, id)));
    const row = rows[0];
    if (!row) return null;

    const [allCats, allOpts, allTags, allCits] = await Promise.all([
      tx
        .select()
        .from(questionCategories)
        .where(
          and(
            eq(questionCategories.workspaceSubdomain, subdomain),
            eq(questionCategories.questionId, id),
          ),
        ),
      tx
        .select()
        .from(questionOptions)
        .where(
          and(
            eq(questionOptions.workspaceSubdomain, subdomain),
            eq(questionOptions.questionId, id),
          ),
        ),
      tx
        .select()
        .from(questionTags)
        .where(
          and(
            eq(questionTags.workspaceSubdomain, subdomain),
            eq(questionTags.questionId, id),
          ),
        ),
      tx
        .select()
        .from(questionCitations)
        .where(
          and(
            eq(questionCitations.workspaceSubdomain, subdomain),
            eq(questionCitations.questionId, id),
          ),
        ),
    ]);

    const sortedOpts = allOpts
      .sort((a, b) => a.optionIndex - b.optionIndex)
      .map((o) => o.optionText);

    const parsedCits = allCits.map((ci) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(ci.citation || '{}');
      } catch {
        // ignore
      }
      return { bookId: ci.bookId, citation: parsed };
    });

    return questionRowToRecord(
      row,
      allCats.map((c) => c.categoryId),
      sortedOpts,
      allTags.map((t) => t.tag),
      parsedCits,
    );
  });
}

export async function saveQuestion(tenant: string, record: QuestionBankQuestion): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(questions)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        type: record.type,
        difficulty: record.difficulty,
        questionLanguage: record.questionLanguage ?? 'en',
        text: record.text,
        answer: record.answer,
        marks: record.marks ?? 1,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [questions.workspaceSubdomain, questions.id],
        set: {
          type: record.type,
          difficulty: record.difficulty,
          questionLanguage: record.questionLanguage ?? 'en',
          text: record.text,
          answer: record.answer,
          marks: record.marks ?? 1,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });

    await syncQuestionChildren(tx, subdomain, record);
  });
}

export async function bulkSaveQuestions(tenant: string, records: QuestionBankQuestion[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(questions)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          type: record.type,
          difficulty: record.difficulty,
          questionLanguage: record.questionLanguage ?? 'en',
          text: record.text,
          answer: record.answer,
          marks: record.marks ?? 1,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [questions.workspaceSubdomain, questions.id],
          set: {
            type: record.type,
            difficulty: record.difficulty,
            questionLanguage: record.questionLanguage ?? 'en',
            text: record.text,
            answer: record.answer,
            marks: record.marks ?? 1,
            deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
            deletedBy: record.deletedBy ?? null,
            deletionReason: record.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });

      await syncQuestionChildren(tx, subdomain, record);
    }
  });
}

export async function replaceQuestionsForWorkspace(tenant: string, records: QuestionBankQuestion[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(questionCitations).where(eq(questionCitations.workspaceSubdomain, subdomain));
    await tx.delete(questionTags).where(eq(questionTags.workspaceSubdomain, subdomain));
    await tx.delete(questionOptions).where(eq(questionOptions.workspaceSubdomain, subdomain));
    await tx.delete(questionCategories).where(eq(questionCategories.workspaceSubdomain, subdomain));
    await tx.delete(questions).where(eq(questions.workspaceSubdomain, subdomain));

    for (const record of records) {
      await tx.insert(questions).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        type: record.type,
        difficulty: record.difficulty,
        questionLanguage: record.questionLanguage ?? 'en',
        text: record.text,
        answer: record.answer,
        marks: record.marks ?? 1,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      });

      await syncQuestionChildren(tx, subdomain, record);
    }
  });
}

// --- Tests ---

type TestRow = typeof tests.$inferSelect;

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

async function syncTestChildren(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  subdomain: string,
  record: QuestionBankTest,
): Promise<void> {
  // Delete existing
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

  // Insert test questions
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

  // Insert sections
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

// --- Assessment Results ---

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
