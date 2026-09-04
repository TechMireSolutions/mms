import { and, eq, inArray, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import { dedupeTrimmedIds, type Contact } from '@mms/shared';
import { contacts, contactPhones, contactEmails, contactAddresses } from '../schema.js';
import { withTenant } from '../tenant-context.js';
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
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < names.length; i++) {
    const raw = names[i];
    if (!raw) continue;
    const lower = raw.trim().toLowerCase();
    if (lower && !seen.has(lower)) {
      seen.add(lower);
      normalized.push(lower);
    }
  }
  if (normalized.length === 0) return new Set();

  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
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
    const result = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].name) result.add(rows[i].name);
    }
    return result;
  });
}

function scalarFieldSql(fieldKey: string): SQL {
  switch (fieldKey) {
    case 'firstName':
      return sql`lower(trim(COALESCE(${contacts.firstName}, '')))`;
    case 'lastName':
      return sql`lower(trim(COALESCE(${contacts.lastName}, '')))`;
    case 'cnic':
      return sql`regexp_replace(COALESCE(${contacts.cnic}, ''), '[^0-9]', '', 'g')`;
    case 'dob':
      return sql`lower(trim(COALESCE(${contacts.dob}, '')))`;
    case 'city':
      return sql`lower(trim(COALESCE((
        SELECT a.city FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
        ORDER BY CASE WHEN a.is_primary THEN 0 ELSE 1 END, a.sort_order ASC
        LIMIT 1
      ), '')))`;
    case 'state':
      return sql`lower(trim(COALESCE((
        SELECT a.state FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
        ORDER BY CASE WHEN a.is_primary THEN 0 ELSE 1 END, a.sort_order ASC
        LIMIT 1
      ), '')))`;
    case 'country':
      return sql`lower(trim(COALESCE((
        SELECT a.country FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
        ORDER BY CASE WHEN a.is_primary THEN 0 ELSE 1 END, a.sort_order ASC
        LIMIT 1
      ), ')))`;
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
  const phoneDigits = dedupeTrimmedIds(values.phoneDigits);
  const emails: string[] = [];
  const seenEmails = new Set<string>();
  for (let i = 0; i < values.emails.length; i++) {
    const raw = values.emails[i];
    if (!raw) continue;
    const lower = raw.trim().toLowerCase();
    if (lower && !seenEmails.has(lower)) {
      seenEmails.add(lower);
      emails.push(lower);
    }
  }
  const scalars: Array<{ fieldKey: string; normalized: string }> = [];
  for (let i = 0; i < values.scalars.length; i++) {
    const entry = values.scalars[i];
    if (entry && entry.fieldKey.trim() && entry.normalized.trim()) {
      scalars.push(entry);
    }
  }
  if (phoneDigits.length === 0 && emails.length === 0 && scalars.length === 0) {
    return [];
  }

  const subdomain = tenant.trim().toLowerCase();
  const excluded = dedupeTrimmedIds(excludeIds);
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

  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: contacts.id,
        workspaceSubdomain: contacts.workspaceSubdomain,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        name: contacts.name,
        gender: contacts.gender,
        dob: contacts.dob,
        cnic: contacts.cnic,
        isSyed: contacts.isSyed,
        avatar: contacts.avatar,
        notes: contacts.notes,
        whatsappStatus: contacts.whatsappStatus,
        lastCheckedAt: contacts.lastCheckedAt,
        aiSummary: contacts.aiSummary,
        deletedAt: contacts.deletedAt,
        deletedBy: contacts.deletedBy,
        deletionReason: contacts.deletionReason,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        createdBy: contacts.createdBy,
        updatedBy: contacts.updatedBy,
      })
      .from(contacts)
      .where(and(...whereParts));
    return hydrateContactsList(tx, subdomain, rows);
  });
}
