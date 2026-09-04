import { and, eq } from 'drizzle-orm';
import { type QuestionBankQuestion } from '@mms/shared';
import {
  type questions,
  questionCategories,
  questionOptions,
  questionTags,
  questionCitations,
} from '../schema.js';
import { type withTenant } from '../tenant-context.js';

type QuestionRow = typeof questions.$inferSelect;
type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

export function questionRowToRecord(
  row: QuestionRow,
  categories: string[] = [],
  options: string[] = [],
  tags: string[] = [],
  citations: Array<{ bookId: string; citation: Record<string, unknown> }> = [],
): QuestionBankQuestion {
  const question: QuestionBankQuestion = {
    id: row.id,
    categoryIds: categories,
    type: row.type as QuestionBankQuestion['type'],
    difficulty: row.difficulty as QuestionBankQuestion['difficulty'],
    questionLanguage: row.questionLanguage as QuestionBankQuestion['questionLanguage'],
    text: row.text,
    options,
    answer: row.answer,
    marks: row.marks,
  };

  if (categories[0]) question.categoryId = categories[0];
  if (tags.length > 0) question.tags = tags;
  if (citations.length > 0) question.sourceCitations = citations;
  if (row.deletedAt) question.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) question.deletedBy = row.deletedBy;
  if (row.deletionReason) question.deletionReason = row.deletionReason;

  return question;
}

export async function syncQuestionChildren(
  tx: Transaction,
  subdomain: string,
  record: QuestionBankQuestion,
): Promise<void> {
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

  const catIds = record.categoryIds ?? (record.categoryId ? [record.categoryId] : []);
  if (catIds.length > 0) {
    await tx.insert(questionCategories).values(
      catIds.map((catId) => ({
        workspaceSubdomain: subdomain,
        questionId: record.id,
        categoryId: catId,
      })),
    );
  }

  if (record.options && record.options.length > 0) {
    await tx.insert(questionOptions).values(
      record.options.map((opt, i) => ({
        id: `${record.id}_opt_${i}`,
        workspaceSubdomain: subdomain,
        questionId: record.id,
        optionIndex: i,
        optionText: opt,
      })),
    );
  }

  if (record.tags && record.tags.length > 0) {
    await tx.insert(questionTags).values(
      record.tags.map((tag) => ({
        workspaceSubdomain: subdomain,
        questionId: record.id,
        tag,
      })),
    );
  }

  if (record.sourceCitations && record.sourceCitations.length > 0) {
    await tx.insert(questionCitations).values(
      record.sourceCitations.map((cit, i) => ({
        id: `${record.id}_cit_${i}`,
        workspaceSubdomain: subdomain,
        questionId: record.id,
        bookId: cit.bookId,
        citation: JSON.stringify(cit.citation ?? {}),
      })),
    );
  }
}
