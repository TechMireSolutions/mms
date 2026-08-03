import { and, eq, isNull, sql } from 'drizzle-orm';
import { students, teachers } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

/** Active student `contactId` values only — no full student row hydrate. */
export async function listActiveStudentContactIds(tenant: string): Promise<string[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({
        contactId: sql<string>`NULLIF(trim(${students.customData}->>'contactId'), '')`,
      })
      .from(students)
      .where(
        and(
          eq(students.workspaceSubdomain, subdomain),
          isNull(students.deletedAt),
          sql`NULLIF(trim(${students.customData}->>'contactId'), '') IS NOT NULL`,
        ),
      );
    return rows.map((row) => row.contactId).filter(Boolean);
  });
}

/** Active teacher `contactId` values only — no full teacher row hydrate. */
export async function listActiveTeacherContactIds(tenant: string): Promise<string[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({
        contactId: sql<string>`NULLIF(trim(${teachers.customData}->>'contactId'), '')`,
      })
      .from(teachers)
      .where(
        and(
          eq(teachers.workspaceSubdomain, subdomain),
          isNull(teachers.deletedAt),
          sql`NULLIF(trim(${teachers.customData}->>'contactId'), '') IS NOT NULL`,
        ),
      );
    return rows.map((row) => row.contactId).filter(Boolean);
  });
}
