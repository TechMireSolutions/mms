import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  asc,
  desc,
  type SQL,
} from 'drizzle-orm';
import {
  isQueryFlagTrue,
  type Exam,
  type ExaminationsListQuery,
  type ExaminationsListPageResult,
} from '@mms/shared';
import { exams, examClasses } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { runListPage } from './listPageHelper.js';
import { examRowToRecord } from './examinationRepository.js';

function buildExamsListConditions(subdomain: string, query: ExaminationsListQuery): SQL[] {
  const conditions: SQL[] = [eq(exams.workspaceSubdomain, subdomain)];

  // Manifest softDelete.workExcludesDeleted — Work = active, trash = deleted-only.
  if (isQueryFlagTrue(query.includeDeleted)) {
    conditions.push(isNotNull(exams.deletedAt));
  } else {
    conditions.push(isNull(exams.deletedAt));
  }

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(exams.name, pattern),
        ilike(exams.subject, pattern),
      ) as SQL,
    );
  }

  const statuses = query.status?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (statuses.length) {
    conditions.push(inArray(exams.status, statuses));
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
        column = exams.name as unknown as SQL;
        break;
      case 'subject':
        column = exams.subject as unknown as SQL;
        break;
      case 'status':
        column = exams.status as unknown as SQL;
        break;
      case 'date':
        column = exams.date as unknown as SQL;
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
    const result = await runListPage<ExamRow, ExamRow>(tx, exams, {
      conditions: buildExamsListConditions(subdomain, query),
      orderBy: buildExamsOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 12,
      rowMapper: (row) => row,
    });

    const examRows = result.items;
    let examRecords: Exam[] = [];

    if (examRows.length > 0) {
      const examIds = examRows.map((e) => e.id);
      const classRows = await tx
        .select()
        .from(examClasses)
        .where(
          and(
            eq(examClasses.workspaceSubdomain, subdomain),
            inArray(examClasses.examId, examIds),
          ),
        );

      const classMap = new Map<string, string[]>();
      for (const c of classRows) {
        const list = classMap.get(c.examId) ?? [];
        list.push(c.classId);
        classMap.set(c.examId, list);
      }

      examRecords = examRows.map((row) => examRowToRecord(row, classMap.get(row.id) ?? []));
    }

    return {
      exams: examRecords,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}