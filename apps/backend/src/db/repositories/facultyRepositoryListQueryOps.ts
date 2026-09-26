import { and, asc, eq, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm';
import type { FacultyMember } from '@mms/shared';
import { faculty } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';
import { FACULTY_PROJECTION_COLUMNS, facultyRowToRecord } from './facultyRepositoryColumns.js';
import { employeeIdExpr } from './facultyRepositoryListQuerySql.js';

export async function countFacultyActive(
  tenant: string,
  options?: { includeDeleted?: boolean },
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const whereClause = options?.includeDeleted
      ? eq(faculty.workspaceSubdomain, subdomain)
      : and(eq(faculty.workspaceSubdomain, subdomain), isNull(faculty.deletedAt));
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(faculty)
      .where(whereClause);
    return Number(rows[0]?.count ?? 0);
  });
}

export interface NextEmployeeIdCountOptions {
  prefix?: string;
  restartAnnually?: boolean;
  year?: number;
}

/**
 * Derives the sequence watermark for next employee-id generation.
 * Calculates total records (including soft-deleted) plus the highest numeric suffix
 * found in existing employee IDs so IDs are monotonic and safe against deletions.
 */
export async function countFacultyForNextEmployeeId(
  tenant: string,
  options?: NextEmployeeIdCountOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(faculty)
      .where(eq(faculty.workspaceSubdomain, subdomain));
    const totalCount = Number(countRows[0]?.count ?? 0);

    const seqConditions: SQL[] = [eq(faculty.workspaceSubdomain, subdomain)];
    if (options?.prefix?.trim()) {
      seqConditions.push(sql`${faculty.employeeId} ILIKE ${options.prefix.trim() + '%'}`);
    }
    if (options?.restartAnnually && options.year) {
      seqConditions.push(sql`${faculty.employeeId} LIKE ${'%' + options.year + '%'}`);
    }

    const maxRows = await tx
      .select({
        maxSeq: sql<number>`COALESCE(MAX(NULLIF(substring(${faculty.employeeId} from '(\\d+)$'), '')::bigint), 0)::int`,
      })
      .from(faculty)
      .where(and(...seqConditions));
    const maxSeq = Number(maxRows[0]?.maxSeq ?? 0);

    return Math.max(totalCount, maxSeq);
  });
}

/** Active faculty missing typed `employee_id` (null or blank) — backfill candidates. */
export async function listActiveFacultyMissingEmployeeId(
  workspaceSubdomain: string,
): Promise<FacultyMember[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(
        and(
          eq(faculty.workspaceSubdomain, subdomain),
          isNull(faculty.deletedAt),
          sql`NULLIF(trim(COALESCE(${faculty.employeeId}, '')), '') IS NULL`,
        ),
      )
      .orderBy(asc(faculty.id));
    return rows.map(facultyRowToRecord);
  });
}


/** Distinct linked contact ids for active faculty (typed contact_id). */
export async function listFacultyLinkedContactIdsSql(
  tenant: string,
  excludeFacultyId?: string,
): Promise<Array<string | number>> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const conditions: SQL[] = [
      eq(faculty.workspaceSubdomain, subdomain),
      isNull(faculty.deletedAt),
      isNotNull(faculty.contactId),
      sql`NULLIF(trim(${faculty.contactId}), '') IS NOT NULL`,
    ];
    if (excludeFacultyId?.trim()) {
      conditions.push(ne(faculty.id, excludeFacultyId.trim()));
    }
    const rows = await tx
      .select({ contactId: faculty.contactId })
      .from(faculty)
      .where(and(...conditions));
    return rows
      .map((row) => row.contactId)
      .filter((id): id is string => Boolean(id && id.trim()));
  });
}


/**
 * Finds a soft-deleted faculty whose `contact_id` matches (re-registration
 * restore-on-create probe). Only deleted rows are candidates so an active
 * duplicate is never accidentally restored.
 */
export async function findSoftDeletedFacultyByContactIdSql(
  tenant: string,
  contactId: string,
): Promise<FacultyMember | null> {
  const subdomain = tenant.trim().toLowerCase();
  const trimmedContactId = contactId.trim();
  if (!trimmedContactId) return null;
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(
        and(
          eq(faculty.workspaceSubdomain, subdomain),
          eq(faculty.contactId, trimmedContactId),
          isNotNull(faculty.deletedAt),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? facultyRowToRecord(row) : null;
  });
}


/**
 * Probes for an active faculty already linked to the same contact or using the
 * same employee id (server-authoritative duplicate check on save).
 */
export async function findFacultyRegistrationConflictSql(
  tenant: string,
  input: {
    excludeId?: string;
    contactId?: string | number;
    employeeId?: string;
  },
): Promise<'contact' | 'employeeId' | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const exclude = input.excludeId?.trim();
    const baseConditions: SQL[] = [
      eq(faculty.workspaceSubdomain, subdomain),
      isNull(faculty.deletedAt),
    ];
    if (exclude) baseConditions.push(ne(faculty.id, exclude));

    if (input.contactId != null && String(input.contactId).trim() !== '') {
      const contactId = String(input.contactId).trim();
      const rows = await tx
        .select({ id: faculty.id })
        .from(faculty)
        .where(and(...baseConditions, eq(faculty.contactId, contactId)))
        .limit(1);
      if (rows.length > 0) return 'contact';
    }

    const employeeId = input.employeeId?.trim().toLowerCase();
    if (employeeId) {
      const rows = await tx
        .select({ id: faculty.id })
        .from(faculty)
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
