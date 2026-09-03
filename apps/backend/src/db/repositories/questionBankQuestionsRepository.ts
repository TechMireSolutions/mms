import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type QuestionBankQuestion } from '@mms/shared';
import {
  questions,
  questionCategories,
  questionOptions,
  questionTags,
  questionCitations,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { questionRowToRecord, syncQuestionChildren } from './questionBankQuestionsSync.js';

export { questionRowToRecord } from './questionBankQuestionsSync.js';

export async function listQuestionsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<QuestionBankQuestion[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: questions.id,
        workspaceSubdomain: questions.workspaceSubdomain,
        type: questions.type,
        difficulty: questions.difficulty,
        questionLanguage: questions.questionLanguage,
        text: questions.text,
        answer: questions.answer,
        marks: questions.marks,
        deletedAt: questions.deletedAt,
        deletedBy: questions.deletedBy,
        deletionReason: questions.deletionReason,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
      .from(questions)
      .where(and(eq(questions.workspaceSubdomain, subdomain), isNull(questions.deletedAt)))
      .limit(limit)
      .offset(offset);
    if (rows.length === 0) return [];

    const qIds = rows.map((r) => r.id);
    const [allCats, allOpts, allTags, allCits] = await Promise.all([
      tx
        .select({
          questionId: questionCategories.questionId,
          categoryId: questionCategories.categoryId,
        })
        .from(questionCategories)
        .where(
          and(
            eq(questionCategories.workspaceSubdomain, subdomain),
            inArray(questionCategories.questionId, qIds),
          ),
        ),
      tx
        .select({
          questionId: questionOptions.questionId,
          optionIndex: questionOptions.optionIndex,
          optionText: questionOptions.optionText,
        })
        .from(questionOptions)
        .where(
          and(
            eq(questionOptions.workspaceSubdomain, subdomain),
            inArray(questionOptions.questionId, qIds),
          ),
        ),
      tx
        .select({
          questionId: questionTags.questionId,
          tag: questionTags.tag,
        })
        .from(questionTags)
        .where(
          and(
            eq(questionTags.workspaceSubdomain, subdomain),
            inArray(questionTags.questionId, qIds),
          ),
        ),
      tx
        .select({
          questionId: questionCitations.questionId,
          bookId: questionCitations.bookId,
          citation: questionCitations.citation,
        })
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

    const optsByQ = new Map<string, Array<{ optionIndex: number; optionText: string }>>();
    for (const o of allOpts) {
      const arr = optsByQ.get(o.questionId) ?? [];
      arr.push({ optionIndex: o.optionIndex, optionText: o.optionText });
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
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(ci.citation || '{}');
      } catch {
        // ignore
      }
      const arr = citsByQ.get(ci.questionId) ?? [];
      arr.push({ bookId: ci.bookId, citation: parsed });
      citsByQ.set(ci.questionId, arr);
    }

    return rows.map((r) => {
      const sortedOpts = (optsByQ.get(r.id) ?? [])
        .sort((a, b) => a.optionIndex - b.optionIndex)
        .map((o) => o.optionText);
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
      .select({
        id: questions.id,
        workspaceSubdomain: questions.workspaceSubdomain,
        type: questions.type,
        difficulty: questions.difficulty,
        questionLanguage: questions.questionLanguage,
        text: questions.text,
        answer: questions.answer,
        marks: questions.marks,
        deletedAt: questions.deletedAt,
        deletedBy: questions.deletedBy,
        deletionReason: questions.deletionReason,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
      .from(questions)
      .where(and(eq(questions.workspaceSubdomain, subdomain), eq(questions.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const [allCats, allOpts, allTags, allCits] = await Promise.all([
      tx
        .select({
          categoryId: questionCategories.categoryId,
        })
        .from(questionCategories)
        .where(
          and(
            eq(questionCategories.workspaceSubdomain, subdomain),
            eq(questionCategories.questionId, id),
          ),
        ),
      tx
        .select({
          optionIndex: questionOptions.optionIndex,
          optionText: questionOptions.optionText,
        })
        .from(questionOptions)
        .where(
          and(
            eq(questionOptions.workspaceSubdomain, subdomain),
            eq(questionOptions.questionId, id),
          ),
        ),
      tx
        .select({
          tag: questionTags.tag,
        })
        .from(questionTags)
        .where(
          and(
            eq(questionTags.workspaceSubdomain, subdomain),
            eq(questionTags.questionId, id),
          ),
        ),
      tx
        .select({
          bookId: questionCitations.bookId,
          citation: questionCitations.citation,
        })
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

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

async function insertQuestionChildrenTx(
  tx: Transaction,
  subdomain: string,
  records: QuestionBankQuestion[],
): Promise<void> {
  const allCatRows = records.flatMap((record) => {
    const catIds = record.categoryIds ?? (record.categoryId ? [record.categoryId] : []);
    return catIds.map((catId) => ({
      workspaceSubdomain: subdomain,
      questionId: record.id,
      categoryId: catId,
    }));
  });
  if (allCatRows.length > 0) {
    await tx.insert(questionCategories).values(allCatRows);
  }

  const allOptRows = records.flatMap((record) =>
    (record.options ?? []).map((opt, i) => ({
      id: `${record.id}_opt_${i}`,
      workspaceSubdomain: subdomain,
      questionId: record.id,
      optionIndex: i,
      optionText: opt,
    })),
  );
  if (allOptRows.length > 0) {
    await tx.insert(questionOptions).values(allOptRows);
  }

  const allTagRows = records.flatMap((record) =>
    (record.tags ?? []).map((tag) => ({
      workspaceSubdomain: subdomain,
      questionId: record.id,
      tag,
    })),
  );
  if (allTagRows.length > 0) {
    await tx.insert(questionTags).values(allTagRows);
  }

  const allCitRows = records.flatMap((record) =>
    (record.sourceCitations ?? []).map((c, i) => ({
      id: `${record.id}_cit_${i}`,
      workspaceSubdomain: subdomain,
      questionId: record.id,
      bookId: c.bookId,
      citation: JSON.stringify(c.citation ?? {}),
    })),
  );
  if (allCitRows.length > 0) {
    await tx.insert(questionCitations).values(allCitRows);
  }
}

export async function bulkSaveQuestions(tenant: string, records: QuestionBankQuestion[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    const qIds = records.map((r) => r.id);

    await tx
      .insert(questions)
      .values(
        records.map((record) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [questions.workspaceSubdomain, questions.id],
        set: {
          type: sql`excluded.type`,
          difficulty: sql`excluded.difficulty`,
          questionLanguage: sql`excluded.question_language`,
          text: sql`excluded.text`,
          answer: sql`excluded.answer`,
          marks: sql`excluded.marks`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });

    await Promise.all([
      tx.delete(questionCategories).where(and(eq(questionCategories.workspaceSubdomain, subdomain), inArray(questionCategories.questionId, qIds))),
      tx.delete(questionOptions).where(and(eq(questionOptions.workspaceSubdomain, subdomain), inArray(questionOptions.questionId, qIds))),
      tx.delete(questionTags).where(and(eq(questionTags.workspaceSubdomain, subdomain), inArray(questionTags.questionId, qIds))),
      tx.delete(questionCitations).where(and(eq(questionCitations.workspaceSubdomain, subdomain), inArray(questionCitations.questionId, qIds))),
    ]);

    await insertQuestionChildrenTx(tx, subdomain, records);
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

    if (records.length === 0) return;

    await tx.insert(questions).values(
      records.map((record) => ({
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
      })),
    );

    await insertQuestionChildrenTx(tx, subdomain, records);
  });
}
