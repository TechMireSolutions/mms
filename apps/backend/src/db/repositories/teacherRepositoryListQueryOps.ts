import { and, asc, eq, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm';
import type { Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { teacherRowToRecord } from './teacherRepository.js';
import { employeeIdExpr } from './teacherRepositoryListQuerySql.js';

export async function countTeachersActive(
  tenant: string,
  options?: { includeDeleted?: boolean },
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const whereClause = options?.includeDeleted
      ? eq(teachers.workspaceSubdomain, subdomain)
      : and(eq(teachers.workspaceSubdomain, subdomain), isNull(teachers.deletedAt));
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(whereClause);
    return Number(rows[0]?.count ?? 0);
  });
}

/** Active teacher count for next employee-id sequencing (Students GR-count parity). */
export async function countTeachersForNextEmployeeId(tenant: string): Promise<number> {
  return countTeachersActive(tenant);
}

/** Active teachers missing typed `employee_id` (null or blank) — backfill candidates. */
export async function listActiveTeachersMissingEmployeeId(
  workspaceSubdomain: string,
): Promise<Teacher[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: teachers.id,
        workspaceSubdomain: teachers.workspaceSubdomain,
        contactId: teachers.contactId,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        status: teachers.status,
        specialization: teachers.specialization,
        qualification: teachers.qualification,
        joinDate: teachers.joinDate,
        notes: teachers.notes,
        deletedAt: teachers.deletedAt,
        deletedBy: teachers.deletedBy,
        deletionReason: teachers.deletionReason,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
      .from(teachers)
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          isNull(teachers.deletedAt),
          sql`NULLIF(trim(COALESCE(${teachers.employeeId}, '')), '') IS NULL`,
        ),
      )
      .orderBy(asc(teachers.id));
    return rows.map(teacherRowToRecord);
  });
}

/** Distinct linked contact ids for active teachers (typed contact_id). */
export async function listTeacherLinkedContactIdsSql(
  tenant: string,
  excludeTeacherId?: string,
): Promise<Array<string | number>> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions: SQL[] = [
      eq(teachers.workspaceSubdomain, subdomain),
      isNull(teachers.deletedAt),
      isNotNull(teachers.contactId),
      sql`NULLIF(trim(${teachers.contactId}), '') IS NOT NULL`,
    ];
    if (excludeTeacherId?.trim()) {
      conditions.push(ne(teachers.id, excludeTeacherId.trim()));
    }
    const rows = await tx
      .select({ contactId: teachers.contactId })
      .from(teachers)
      .where(and(...conditions));
    return rows
      .map((row) => row.contactId)
      .filter((id): id is string => Boolean(id && id.trim()));
  });
}

/**
 * Finds a soft-deleted teacher whose `contact_id` matches (re-registration
 * restore-on-create probe). Only deleted rows are candidates so an active
 * duplicate is never accidentally restored.
 */
export async function findSoftDeletedTeacherByContactIdSql(
  tenant: string,
  contactId: string,
): Promise<ReturnType<typeof teacherRowToRecord> | null> {
  const subdomain = tenant.trim().toLowerCase();
  const trimmedContactId = contactId.trim();
  if (!trimmedContactId) return null;
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: teachers.id,
        workspaceSubdomain: teachers.workspaceSubdomain,
        contactId: teachers.contactId,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        status: teachers.status,
        specialization: teachers.specialization,
        qualification: teachers.qualification,
        joinDate: teachers.joinDate,
        notes: teachers.notes,
        deletedAt: teachers.deletedAt,
        deletedBy: teachers.deletedBy,
        deletionReason: teachers.deletionReason,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        createdBy: teachers.createdBy,
        updatedBy: teachers.updatedBy,
      })
      .from(teachers)
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          eq(teachers.contactId, trimmedContactId),
          sql`${teachers.deletedAt} is not null`,
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? teacherRowToRecord(row) : null;
  });
}

/**
 * Probes for an active teacher already linked to the same contact or using the
 * same employee id (server-authoritative duplicate check on save).
 */
export async function findTeacherRegistrationConflictSql(
  tenant: string,
  input: {
    excludeId?: string;
    contactId?: string | number;
    employeeId?: string;
  },
): Promise<'contact' | 'employeeId' | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const exclude = input.excludeId?.trim();
    const baseConditions: SQL[] = [
      eq(teachers.workspaceSubdomain, subdomain),
      isNull(teachers.deletedAt),
    ];
    if (exclude) baseConditions.push(ne(teachers.id, exclude));

    if (input.contactId != null && String(input.contactId).trim() !== '') {
      const contactId = String(input.contactId).trim();
      const rows = await tx
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(...baseConditions, eq(teachers.contactId, contactId)))
        .limit(1);
      if (rows.length > 0) return 'contact';
    }

    const employeeId = input.employeeId?.trim().toLowerCase();
    if (employeeId) {
      const rows = await tx
        .select({ id: teachers.id })
        .from(teachers)
        .where(
          and(
            ...baseConditions,
            sql`${employeeIdExpr()} = ${employeeId}`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'employeeId';
    }

    return null;
  });
}
