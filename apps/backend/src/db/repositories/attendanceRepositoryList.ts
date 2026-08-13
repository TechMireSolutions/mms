import { and, eq, ilike, inArray, isNotNull, isNull, or, sql, type SQL, asc, desc } from 'drizzle-orm';
import type { AttendanceRecord, AttendanceListQuery, AttendanceListPageResult } from '@mms/shared';
import { attendance } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { mergeCustomData, runListPage } from './listPageHelper.js';

function buildAttendanceListConditions(subdomain: string, query: AttendanceListQuery): SQL[] {
  const conditions: SQL[] = [eq(attendance.workspaceSubdomain, subdomain)];

  // Manifest softDelete.workExcludesDeleted — Work = active, trash = deleted-only.
  if (query.includeDeleted) {
    conditions.push(isNotNull(sql`(${attendance.customData}->>'deletedAt')`));
  } else {
    conditions.push(isNull(sql`(${attendance.customData}->>'deletedAt')`));
  }

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(sql`(${attendance.customData}->>'studentName')`, pattern),
        ilike(sql`(${attendance.customData}->>'rollNo')`, pattern),
      ) as SQL,
    );
  }

  if (query.classId?.trim()) {
    conditions.push(eq(sql`(${attendance.customData}->>'classId')`, query.classId.trim()));
  }
  if (query.date?.trim()) {
    conditions.push(eq(sql`(${attendance.customData}->>'date')`, query.date.trim()));
  }
  if (query.dateFrom?.trim()) {
    conditions.push(sql`(${attendance.customData}->>'date') >= ${query.dateFrom.trim()}`);
  }
  if (query.dateTo?.trim()) {
    conditions.push(sql`(${attendance.customData}->>'date') <= ${query.dateTo.trim()}`);
  }
  const statuses = query.status?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (statuses.length) {
    conditions.push(inArray(sql`(${attendance.customData}->>'status')`, statuses));
  }

  return conditions;
}

const ATTENDANCE_SORT_FIELDS = new Set(['date', 'studentName', 'rollNo', 'status', 'updatedAt']);

function buildAttendanceOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim();
  let column: SQL;
  if (field && ATTENDANCE_SORT_FIELDS.has(field)) {
    switch (field) {
      case 'updatedAt':
        column = attendance.updatedAt as unknown as SQL;
        break;
      case 'date':
        column = sql`(${attendance.customData}->>'date')`;
        break;
      case 'studentName':
        column = sql`(${attendance.customData}->>'studentName')`;
        break;
      case 'rollNo':
        column = sql`(${attendance.customData}->>'rollNo')`;
        break;
      case 'status':
        column = sql`(${attendance.customData}->>'status')`;
        break;
      default:
        column = attendance.updatedAt as unknown as SQL;
    }
  } else {
    column = attendance.updatedAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

type AttendanceRow = typeof attendance.$inferSelect;

export async function listAttendancePage(
  tenant: string,
  query: AttendanceListQuery,
): Promise<AttendanceListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const result = await runListPage<AttendanceRow, AttendanceRecord>(tx, attendance, {
      conditions: buildAttendanceListConditions(subdomain, query),
      orderBy: buildAttendanceOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 15,
      rowMapper: (row) => mergeCustomData(row) as unknown as AttendanceRecord,
    });
    return {
      records: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}

/** Active (non-deleted) attendance count for the tenant — used by `/count`. */
export async function countAttendanceActiveByWorkspace(tenant: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceSubdomain, subdomain),
          isNull(sql`(${attendance.customData}->>'deletedAt')`),
        ),
      );
    return Number(rows[0]?.count ?? 0);
  });
}