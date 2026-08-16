import { and, eq, inArray, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import type { Contact } from '@mms/shared';
import { contacts, contactPhones, contactEmails } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { hydrateContactsList } from './contactRepositoryCore.js';

export interface ContactUniqueLookupValues {
  /** Digits-only phone numbers to match against contact_phones / scalar phone. */
  phoneDigits: string[];
  /** Lowercased email addresses to match against contact_emails / scalar email. */
  emails: string[];
  /** Scalar unique fields: typed column text equality after lower(trim). */
  scalars: Array<{ fieldKey: string; normalized: string }>;
}

/**
 * Normalized active contact names that match any of the candidates (lower/trim).
 * Used by Google sync name-dedupe without a full-tenant hydrate.
 */
export async function findExistingNormalizedContactNames(
  tenant: string,
  names: string[],
): Promise<Set<string>> {
  const normalized = [
    ...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean)),
  ];
  if (normalized.length === 0) return new Set();

  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({
        name: sql<string>`lower(trim(${contacts.name}))`,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceSubdomain, subdomain),
          isNull(contacts.deletedAt),
          inArray(sql`lower(trim(${contacts.name}))`, normalized),
        ),
      );
    return new Set(rows.map((row) => row.name).filter(Boolean));
  });
}

function scalarFieldSql(fieldKey: string): SQL {
  switch (fieldKey) {
    case 'firstName':
      return sql`lower(trim(COALESCE(${contacts.firstName}, '')))`;
    case 'lastName':
      return sql`lower(trim(COALESCE(${contacts.lastName}, '')))`;
    case 'cnic':
      return sql`lower(trim(COALESCE(${contacts.cnic}, '')))`;
    case 'dob':
      return sql`lower(trim(COALESCE(${contacts.dob}, '')))`;
    case 'city':
      return sql`lower(trim(COALESCE(${contacts.city}, '')))`;
    default:
      return sql`lower(trim(COALESCE(${contacts.name}, '')))`;
  }
}

/**
 * Active contacts that may collide on any of the candidate unique values.
 * Scoped SQL lookup — avoids loading the full tenant for uniqueness checks.
 */
export async function findActiveContactsMatchingUniqueValues(
  tenant: string,
  values: ContactUniqueLookupValues,
  excludeIds: Array<string | number> = [],
): Promise<Contact[]> {
  const phoneDigits = [...new Set(values.phoneDigits.map((v) => v.trim()).filter(Boolean))];
  const emails = [...new Set(values.emails.map((v) => v.trim().toLowerCase()).filter(Boolean))];
  const scalars = values.scalars.filter(
    (entry) => entry.fieldKey.trim() && entry.normalized.trim(),
  );
  if (phoneDigits.length === 0 && emails.length === 0 && scalars.length === 0) {
    return [];
  }

  const subdomain = tenant.trim().toLowerCase();
  const excluded = [...new Set(excludeIds.map(String).filter(Boolean))];
  const matchClauses: SQL[] = [];

  if (phoneDigits.length > 0) {
    matchClauses.push(sql`(
      EXISTS (
        SELECT 1
        FROM ${contactPhones} p
        WHERE p.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND p.contact_id = ${contacts.id}
          AND regexp_replace(
            CASE
              WHEN NULLIF(trim(p.number), '') LIKE '+%'
                THEN trim(p.number)
              ELSE concat_ws(
                '',
                NULLIF(trim(p.country_code), ''),
                NULLIF(trim(p.number), '')
              )
            END,
            '[^0-9]',
            '',
            'g'
          ) IN (${sql.join(phoneDigits.map((digit) => sql`${digit}`), sql`, `)})
      )
      OR regexp_replace(COALESCE(${contacts.phone}, ''), '[^0-9]', '', 'g')
        IN (${sql.join(phoneDigits.map((digit) => sql`${digit}`), sql`, `)})
    )`);
  }

  if (emails.length > 0) {
    matchClauses.push(sql`(
      EXISTS (
        SELECT 1
        FROM ${contactEmails} e
        WHERE e.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND e.contact_id = ${contacts.id}
          AND lower(trim(COALESCE(e.address, '')))
            IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})
      )
      OR lower(trim(COALESCE(${contacts.email}, '')))
        IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})
    )`);
  }

  for (const scalar of scalars) {
    matchClauses.push(sql`(${scalarFieldSql(scalar.fieldKey)} = ${scalar.normalized})`);
  }

  const whereParts: SQL[] = [
    eq(contacts.workspaceSubdomain, subdomain),
    isNull(contacts.deletedAt),
    sql`(${sql.join(matchClauses, sql` OR `)})`,
  ];
  if (excluded.length > 0) {
    whereParts.push(notInArray(contacts.id, excluded));
  }

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(contacts)
      .where(and(...whereParts));
    return hydrateContactsList(tx, subdomain, rows);
  });
}
