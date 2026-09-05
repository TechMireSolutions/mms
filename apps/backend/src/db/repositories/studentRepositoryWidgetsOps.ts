import { and, eq, isNotNull, isNull, ne, sql, type SQL } from 'drizzle-orm';
import { students, contacts, contactEmails } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { studentRowToRecord } from './studentRepositoryMappers.js';

export async function listStudentLinkedContactIdsSql(
  tenant: string,
  excludeStudentId?: string,
): Promise<Array<string | number>> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions: SQL[] = [eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt)];
    if (excludeStudentId?.trim()) {
      conditions.push(ne(students.id, excludeStudentId.trim()));
    }
    const rows = await tx
      .select({
        contactId: students.contactId,
      })
      .from(students)
      .where(and(...conditions));
    return rows
      .map((row) => row.contactId)
      .filter((id): id is string => Boolean(id && id.trim()));
  });
}

export async function countStudentsForNextGrNumber(
  tenant: string,
  regDate: string,
  restartAnnually: boolean,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();
  return withTenant(subdomain, async (tx) => {
    const base = and(eq(students.workspaceSubdomain, subdomain), isNull(students.deletedAt));
    if (!restartAnnually) {
      const rows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(base);
      return Number(rows[0]?.count ?? 0);
    }
    const yearStr = String(year);
    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(
        and(
          base,
          sql`(
            COALESCE(${students.registeredDate}, '') LIKE ${`${yearStr}%`}
            OR COALESCE(${students.grNumber}, '') LIKE ${`%${yearStr}%`}
          )`,
        ),
      );
    return Number(rows[0]?.count ?? 0);
  });
}

export async function findStudentRegistrationConflictSql(
  tenant: string,
  input: {
    excludeId?: string;
    contactId?: string | number;
    email?: string;
    name?: string;
    dob?: string;
    grNumber?: string;
  },
): Promise<'contact' | 'email' | 'nameDob' | 'grNumber' | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const exclude = input.excludeId?.trim();
    const baseConditions: SQL[] = [
      eq(students.workspaceSubdomain, subdomain),
      isNull(students.deletedAt),
    ];
    if (exclude) baseConditions.push(ne(students.id, exclude));

    if (input.contactId != null && String(input.contactId).trim() !== '') {
      const contactId = String(input.contactId).trim();
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            eq(students.contactId, contactId),
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'contact';
    }

    const email = input.email?.trim().toLowerCase();
    if (email) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`EXISTS (
              SELECT 1 FROM ${contactEmails} ce
              WHERE ce.workspace_subdomain = ${students.workspaceSubdomain}
                AND ce.contact_id = ${students.contactId}
                AND lower(trim(COALESCE(ce.address, ''))) = ${email}
            )`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'email';
    }

    const grNumber = input.grNumber?.trim().toLowerCase();
    if (grNumber) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`lower(trim(COALESCE(${students.grNumber}, ''))) = ${grNumber}`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'grNumber';
    }

    const name = input.name?.trim().toLowerCase();
    const dob = input.dob?.trim();
    if (name && dob) {
      const rows = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            ...baseConditions,
            sql`EXISTS (
              SELECT 1 FROM ${contacts} c
              WHERE c.workspace_subdomain = ${students.workspaceSubdomain}
                AND c.id = ${students.contactId}
                AND (
                  lower(trim(COALESCE(c.name, ''))) = ${name}
                  OR lower(trim(concat_ws(' ', c.first_name, c.last_name))) = ${name}
                )
                AND NULLIF(trim(c.dob), '') = ${dob}
            )`,
          ),
        )
        .limit(1);
      if (rows.length > 0) return 'nameDob';
    }

    return null;
  });
}

/**
 * Finds a soft-deleted student whose `contact_id` matches (re-registration
 * restore-on-create probe). Only deleted rows are candidates so an active
 * duplicate is never accidentally restored.
 */
export async function findSoftDeletedStudentByContactIdSql(
  tenant: string,
  contactId: string,
): Promise<ReturnType<typeof studentRowToRecord> | null> {
  const subdomain = tenant.trim().toLowerCase();
  const trimmedContactId = contactId.trim();
  if (!trimmedContactId) return null;
  return withTenant(subdomain, async (tx) => {
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
      .where(
        and(
          eq(students.workspaceSubdomain, subdomain),
          eq(students.contactId, trimmedContactId),
          isNotNull(students.deletedAt),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? studentRowToRecord(row) : null;
  });
}
