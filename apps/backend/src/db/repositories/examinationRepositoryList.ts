import {
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  asc,
  desc,
  type SQL,
} from 'drizzle-orm';
import type {
  Exam,
  ExaminationsListQuery,
  ExaminationsListPageResult,
} from '@mms/shared';
import { exams } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { mergeCustomData, runListPage } from './listPageHelper.js';

function buildExamsListConditions(subdomain: string, query: ExaminationsListQuery): SQL[] {
  const conditions: SQL[] = [eq(exams.workspaceSubdomain, subdomain)];

  // Manifest softDelete.workExcludesDeleted — Work = active, trash = deleted-only.
  if (query.includeDeleted) {
    conditions.push(isNotNull(sql`(${exams.customData}->>'deletedAt')`));
  } else {
    conditions.push(isNull(sql`(${exams.customData}->>'deletedAt')`));
  }

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(sql`(${exams.customData}->>'name')`, pattern),
        ilike(sql`(${exams.customData}->>'subject')`, pattern),
      ) as SQL,
    );
  }

  const statuses = query.status?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (statuses.length) {
    conditions.push(inArray(sql`(${exams.customData}->>'status')`, statuses));
  }

  return conditions;
}

const EXAM_SORT_FIELDS = new Set(['name', 'subject', 'status', 'date', 'updatedAt']);

function buildExamsOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim();
  let column: SQL;
  if (field && EXAM_SORT_FIELDS.has(field)) {
    switch (field) {
      case 'updatedAt':
        column = exams.updatedAt as unknown as SQL;
        break;
      case 'name':
        column = sql`(${exams.customData}->>'name')`;
        break;
      case 'subject':
        column = sql`(${exams.customData}->>'subject')`;
        break;
      case 'status':
        column = sql`(${exams.customData}->>'status')`;
        break;
      case 'date':
        column = sql`(${exams.customData}->>'date')`;
        break;
      default:
        column = exams.updatedAt as unknown as SQL;
    }
  } else {
    column = exams.updatedAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

type ExamRow = typeof exams.$inferSelect;

export async function listExamsPage(
  tenant: string,
  query: ExaminationsListQuery,
): Promise<ExaminationsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const result = await runListPage<ExamRow, Exam>(tx, exams, {
      conditions: buildExamsListConditions(subdomain, query),
      orderBy: buildExamsOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 12,
      rowMapper: (row) => mergeCustomData(row) as unknown as Exam,
    });
    return {
      exams: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}