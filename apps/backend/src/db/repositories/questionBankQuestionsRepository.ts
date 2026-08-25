import { and, eq, inArray, isNull } from 'drizzle-orm';
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
