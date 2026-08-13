import {
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  sql,
  asc,
  desc,
  type SQL,
} from 'drizzle-orm';
import type {
  QuestionBankQuestion,
  QuestionBankListQuery,
  QuestionBankListPageResult,
} from '@mms/shared';
import { questions } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { mergeCustomData, runListPage } from './listPageHelper.js';

function buildQuestionsListConditions(subdomain: string, query: QuestionBankListQuery): SQL[] {
  const conditions: SQL[] = [eq(questions.workspaceSubdomain, subdomain)];

  // Manifest softDelete.workExcludesDeleted — Work = active, trash = deleted-only.
  if (query.includeDeleted) {
    conditions.push(isNotNull(sql`(${questions.customData}->>'deletedAt')`));
  } else {
    conditions.push(isNull(sql`(${questions.customData}->>'deletedAt')`));
  }

  const search = query.search?.trim();
  if (search) {
    conditions.push(ilike(sql`(${questions.customData}->>'text')`, `%${search}%`));
  }

  // JSONB array overlap on `categoryIds` — parameterized text[] literal (no sql.raw).
  const categoryIds = query.categoryId?.split(',').map((c) => c.trim()).filter(Boolean) ?? [];
  if (categoryIds.length) {
    conditions.push(
      sql`(${questions.customData}->'categoryIds') ?| ARRAY[${sql.join(
        categoryIds.map((c) => sql`${c}`),
        sql`, `,
      )}]::text[]`,
    );
  }

  const difficulties = query.difficulty?.split(',').map((d) => d.trim()).filter(Boolean) ?? [];
  if (difficulties.length) {
    conditions.push(inArray(sql`(${questions.customData}->>'difficulty')`, difficulties));
  }

  return conditions;
}

const QUESTION_SORT_FIELDS = new Set([
  'text',
  'difficulty',
  'type',
  'questionLanguage',
  'updatedAt',
]);

function buildQuestionsOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim();
  let column: SQL;
  if (field && QUESTION_SORT_FIELDS.has(field)) {
    switch (field) {
      case 'updatedAt':
        column = questions.updatedAt as unknown as SQL;
        break;
      case 'text':
        column = sql`(${questions.customData}->>'text')`;
        break;
      case 'difficulty':
        column = sql`(${questions.customData}->>'difficulty')`;
        break;
      case 'type':
        column = sql`(${questions.customData}->>'type')`;
        break;
      case 'questionLanguage':
        column = sql`(${questions.customData}->>'questionLanguage')`;
        break;
      default:
        column = questions.updatedAt as unknown as SQL;
    }
  } else {
    column = questions.updatedAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

type QuestionRow = typeof questions.$inferSelect;

export async function listQuestionsPage(
  tenant: string,
  query: QuestionBankListQuery,
): Promise<QuestionBankListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const result = await runListPage<QuestionRow, QuestionBankQuestion>(tx, questions, {
      conditions: buildQuestionsListConditions(subdomain, query),
      orderBy: buildQuestionsOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 15,
      rowMapper: (row) => mergeCustomData(row) as unknown as QuestionBankQuestion,
    });
    return {
      questions: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}