import { and, sql } from 'drizzle-orm';
import type { StudentsListPageResult, StudentsListQuery } from '@mms/shared';
import { students } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { hydrateStudentsList } from './studentRepository.js';
import { buildListConditions, buildOrderBy } from './studentRepositoryListQuery.js';

/**
 * SQL-filtered students Work list page (typed deleted_at + relational filters).
 * includeDeleted → deleted-only (Contacts trash parity).
 */
export async function listStudentsPage(
  tenant: string,
  query: StudentsListQuery & { afterId?: string; skipCount?: boolean },
): Promise<StudentsListPageResult & { nextCursor?: string }> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  const isCursorPaging = Boolean(query.afterId?.trim());
  const offset = isCursorPaging ? 0 : (page - 1) * limit;

  return withTenant(subdomain, async (tx) => {
    const conditions = buildListConditions(subdomain, query);
    const baseWhereClause = and(...conditions);
    if (isCursorPaging) {
      conditions.push(sql`${students.id} > ${query.afterId!.trim()}`);
    }
    const whereClause = and(...conditions);
    const effectiveOrderBy = isCursorPaging
      ? sql`${students.id} asc`
      : buildOrderBy(query.sortField, query.sortDir);

    let total = 0;
    if (!query.skipCount) {
      const countRows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(baseWhereClause);
      total = Number(countRows[0]?.count ?? 0);
    }

    const rows = await tx
      .select({
        id: students.id,
        workspaceSubdomain: students.workspaceSubdomain,
        contactId: students.contactId,
        fatherContactId: students.fatherContactId,
        motherContactId: students.motherContactId,
        guardianContactId: students.guardianContactId,
        fatherName: students.fatherName,
        motherName: students.motherName,
        guardianName: students.guardianName,
        grNumber: students.grNumber,
        studentId: students.studentId,
        status: students.status,
        registeredDate: students.registeredDate,
        enrollmentDate: students.enrollmentDate,
        discountType: students.discountType,
        discountPct: students.discountPct,
        registrationType: students.registrationType,
        notes: sql<string | null>`NULL`.as('notes'),
        deletedAt: students.deletedAt,
        deletedBy: students.deletedBy,
        deletionReason: students.deletionReason,
        restoredAt: students.restoredAt,
        restoredBy: students.restoredBy,
        deletedWithCascade: students.deletedWithCascade,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        createdBy: students.createdBy,
        updatedBy: students.updatedBy,
      })
      .from(students)
      .where(whereClause)
      .orderBy(effectiveOrderBy)
      .limit(limit)
      .offset(offset);

    const hydratedStudents = await hydrateStudentsList(tx, subdomain, rows);
    const hasMore = isCursorPaging ? rows.length === limit : page * limit < total;
    const lastRow = rows[rows.length - 1];
    const nextCursor = isCursorPaging && hasMore && lastRow ? lastRow.id : undefined;

    return {
      students: hydratedStudents,
      total,
      page,
      limit,
      hasMore,
      ...(nextCursor ? { nextCursor } : {}),
    };
  });
}
