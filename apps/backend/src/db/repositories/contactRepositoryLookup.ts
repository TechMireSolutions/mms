import { and, eq, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import type { Contact } from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import {
  jsonbArrayOrEmpty,
} from './contactRepositorySql.js';
import { countJsonbFieldUsageByKeys } from './jsonbFieldUsage.js';
import { contactRepo, hydrateContact } from './contactRepositoryCore.js';

export interface ContactUniqueLookupValues {
  /** Digits-only phone numbers to match against phones[] / scalar phone. */
  phoneDigits: string[];
  /** Lowercased email addresses to match against emails[] / scalar email. */
  emails: string[];
  /** Scalar unique fields: JSONB text equality after lower(trim). */
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
        name: sql<string>`lower(trim(COALESCE(${contacts.customData}->>'name', '')))`,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceSubdomain, subdomain),
          isNull(contacts.deletedAt),
          sql`lower(trim(COALESCE(${contacts.customData}->>'name', ''))) IN (${sql.join(
            normalized.map((name) => sql`${name}`),
            sql`, `,
          )})`,
        ),
      );
    return new Set(rows.map((row) => row.name).filter(Boolean));
  });
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
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
        WHERE regexp_replace(
          CASE
            WHEN NULLIF(trim(phone.value->>'number'), '') LIKE '+%'
              THEN trim(phone.value->>'number')
            ELSE concat_ws(
              '',
              NULLIF(trim(phone.value->>'countryCode'), ''),
              NULLIF(trim(phone.value->>'number'), '')
            )
          END,
          '[^0-9]',
          '',
          'g'
        ) IN (${sql.join(phoneDigits.map((digit) => sql`${digit}`), sql`, `)})
      )
      OR regexp_replace(COALESCE(${contacts.customData}->>'phone', ''), '[^0-9]', '', 'g')
        IN (${sql.join(phoneDigits.map((digit) => sql`${digit}`), sql`, `)})
    )`);
  }

  if (emails.length > 0) {
    matchClauses.push(sql`(
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
        WHERE lower(trim(COALESCE(email.value->>'address', '')))
          IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})
      )
      OR lower(trim(COALESCE(${contacts.customData}->>'email', '')))
        IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})
    )`);
  }

  for (const scalar of scalars) {
    matchClauses.push(sql`(
      lower(trim(COALESCE(${contacts.customData}->>${scalar.fieldKey}, ''))) = ${scalar.normalized}
    )`);
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
    return rows.map((row) => hydrateContact(contactRepo.rowToRecord(row)));
  });
}

/**
 * Counts active contacts with a non-empty value for each field key (SQL, no full-list load).
 * Single-pass `count(*) FILTER` per key. Every requested key is present (default 0).
 */
export async function countFieldUsageByKeys(
  tenant: string,
  fieldKeys: string[],
): Promise<Record<string, number>> {
  return countJsonbFieldUsageByKeys({
    tenant,
    fieldKeys,
    table: contacts,
    customDataCol: contacts.customData,
    workspaceSubdomainCol: contacts.workspaceSubdomain,
    deletedAtCol: contacts.deletedAt,
  });
}
