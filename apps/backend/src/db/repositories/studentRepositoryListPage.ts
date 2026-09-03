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
  query: StudentsListQuery,
): Promise<StudentsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 50), 500);
  const offset = (page - 1) * limit;

  return withTenant(subdomain, async (tx) => {
    const conditions = buildListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

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
        notes: students.notes,
        deletedAt: students.deletedAt,
        deletedBy: students.deletedBy,
        deletionReason: students.deletionReason,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        createdBy: students.createdBy,
        updatedBy: students.updatedBy,
      })
      .from(students)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const hydratedStudents = await hydrateStudentsList(tx, subdomain, rows);

    return {
      students: hydratedStudents,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
