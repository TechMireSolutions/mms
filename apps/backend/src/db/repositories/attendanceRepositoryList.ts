import { and, eq, ilike, inArray, isNotNull, isNull, or, type SQL, asc, desc, sql } from 'drizzle-orm';
import type { AttendanceRecord, AttendanceListQuery, AttendanceListPageResult } from '@mms/shared';
import { attendance } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { runListPage } from './listPageHelper.js';

function buildAttendanceListConditions(subdomain: string, query: AttendanceListQuery): SQL[] {
  const conditions: SQL[] = [eq(attendance.workspaceSubdomain, subdomain)];

  // Manifest softDelete.workExcludesDeleted — Work = active, trash = deleted-only.
  if (query.includeDeleted) {
    conditions.push(isNotNull(attendance.deletedAt));
  } else {
    conditions.push(isNull(attendance.deletedAt));
  }

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(attendance.studentName, pattern),
        ilike(attendance.rollNo, pattern),
      ) as SQL,
    );
  }

  if (query.classId?.trim()) {
    conditions.push(eq(attendance.classId, query.classId.trim()));
  }
  if (query.date?.trim()) {
    conditions.push(eq(attendance.date, query.date.trim()));
  }
  if (query.dateFrom?.trim()) {
    conditions.push(sql`${attendance.date} >= ${query.dateFrom.trim()}`);
  }
  if (query.dateTo?.trim()) {
    conditions.push(sql`${attendance.date} <= ${query.dateTo.trim()}`);
  }
  const statuses = query.status?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (statuses.length) {
    conditions.push(inArray(attendance.status, statuses));
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
        column = attendance.date as unknown as SQL;
        break;
      case 'studentName':
        column = attendance.studentName as unknown as SQL;
        break;
      case 'rollNo':
        column = attendance.rollNo as unknown as SQL;
        break;
      case 'status':
        column = attendance.status as unknown as SQL;
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

function rowToRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    classId: row.classId,
    studentId: row.studentId,
    studentName: row.studentName,
    rollNo: row.rollNo,
    date: row.date,
    status: row.status as AttendanceRecord['status'],
    timeIn: row.timeIn,
    timeOut: row.timeOut,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    deletedBy: row.deletedBy ?? null,
    deletionReason: row.deletionReason ?? null,
  };
}

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
      rowMapper: rowToRecord,
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
          isNull(attendance.deletedAt),
        ),
      );
    return Number(rows[0]?.count ?? 0);
  });
}