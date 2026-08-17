import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  type SQL,
  asc,
  desc,
  sql,
} from 'drizzle-orm';
import {
  isQueryFlagTrue,
  type QuestionBankListQuery,
  type QuestionBankListPageResult,
} from '@mms/shared';
import {
  questions,
  questionCategories,
  questionOptions,
  questionTags,
  questionCitations,
} from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { runListPage } from './listPageHelper.js';
import { questionRowToRecord } from './questionBankRepository.js';

function buildQuestionsListConditions(subdomain: string, query: QuestionBankListQuery): SQL[] {
  const conditions: SQL[] = [eq(questions.workspaceSubdomain, subdomain)];

  if (isQueryFlagTrue(query.includeDeleted)) {
    conditions.push(isNotNull(questions.deletedAt));
  } else {
    conditions.push(isNull(questions.deletedAt));
  }

  const search = query.search?.trim();
  if (search) {
    conditions.push(ilike(questions.text, `%${search}%`));
  }

  const categoryIds = query.categoryId?.split(',').map((c) => c.trim()).filter(Boolean) ?? [];
  if (categoryIds.length) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${questionCategories}
        WHERE ${questionCategories.workspaceSubdomain} = ${subdomain}
          AND ${questionCategories.questionId} = ${questions.id}
          AND ${inArray(questionCategories.categoryId, categoryIds)}
      )`,
    );
  }

  const difficulties = query.difficulty?.split(',').map((d) => d.trim()).filter(Boolean) ?? [];
  if (difficulties.length) {
    conditions.push(inArray(questions.difficulty, difficulties));
  }

  return conditions;
}

const QUESTION_SORT_FIELDS = new Set([
  'text',
  'difficulty',
  'type',
  'questionLanguage',
  'updatedAt',
  'createdAt',
]);

function buildQuestionsOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim();
  let column: SQL;
  if (field && QUESTION_SORT_FIELDS.has(field)) {
    switch (field) {
      case 'updatedAt':
        column = questions.updatedAt as unknown as SQL;
        break;
      case 'createdAt':
        column = questions.createdAt as unknown as SQL;
        break;
      case 'text':
        column = questions.text as unknown as SQL;
        break;
      case 'difficulty':
        column = questions.difficulty as unknown as SQL;
        break;
      case 'type':
        column = questions.type as unknown as SQL;
        break;
      case 'questionLanguage':
        column = questions.questionLanguage as unknown as SQL;
        break;
      default:
        column = questions.updatedAt as unknown as SQL;
    }
  } else {
    column = questions.updatedAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

export async function listQuestionsPage(
  tenant: string,
  query: QuestionBankListQuery,
): Promise<QuestionBankListPageResult> {
  const subdomain = tenant.trim().toLowerCase();

  return withTenantTransaction(subdomain, async (tx) => {
    const result = await runListPage(tx, questions, {
      conditions: buildQuestionsListConditions(subdomain, query),
      orderBy: buildQuestionsOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 15,
      rowMapper: (row) => row as typeof questions.$inferSelect,
    });

    if (result.items.length === 0) {
      return {
        questions: [],
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: false,
      };
    }

    const qIds = result.items.map((r) => r.id);
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

    const items = result.items.map((r) => {
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

    return {
      questions: items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}