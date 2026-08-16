import { and, notInArray, sql, type SQL } from 'drizzle-orm';
import { buildNamePrefixRegex } from '@mms/shared';
import { contacts, contactPhones, contactEmails } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { activeWorkspaceWhere } from './contactRepositoryAggregateHelpers.js';

export interface ContactDuplicateCandidateKeys {
  phones: string[];
  emails: string[];
  name: string;
  namePrefixes: string[];
}

/** Digits-only phone comparison key (last 10 when >= 10) — `normalizePhoneForComparison`. */
function phoneComparisonKeySql(numberExpr: SQL): SQL {
  return sql`CASE
    WHEN length(regexp_replace(trim(COALESCE(${numberExpr}, '')), '[^0-9]', '', 'g')) >= 10
      THEN right(regexp_replace(trim(COALESCE(${numberExpr}, '')), '[^0-9]', '', 'g'), 10)
    ELSE regexp_replace(trim(COALESCE(${numberExpr}, '')), '[^0-9]', '', 'g')
  END`;
}

/** Lower/trim email key — `normalizeEmail`. */
function emailKeySql(addressExpr: SQL): SQL {
  return sql`lower(trim(COALESCE(${addressExpr}, '')))`;
}

/** Lower/trim + prefix-strip (first match, like JS) + whitespace-collapse name key — `cleanName`. */
function nameKeySql(prefixRegex: string): SQL {
  const nameExpr = sql`COALESCE(NULLIF(${contacts.name}, ''), ${contacts.firstName})`;
  const stripped = prefixRegex
    ? sql`regexp_replace(lower(trim(COALESCE(${nameExpr}, ''))), ${prefixRegex}, '')`
    : sql`lower(trim(COALESCE(${nameExpr}, '')))`;
  return sql`regexp_replace(${stripped}, '[[:space:]]+', '', 'g')`;
}

/**
 * Active contact ids sharing any normalized duplicate key with the candidate.
 * SQL-scoped candidate pre-filter — no full-tenant hydrate. Used by the
 * per-request `/duplicate-check` count.
 */
export async function findContactDuplicateCandidateIds(
  tenant: string,
  keys: ContactDuplicateCandidateKeys,
  excludeIds: Array<string | number> = [],
): Promise<string[]> {
  const phones = [...new Set(keys.phones.map((p) => String(p).trim()).filter(Boolean))];
  const emails = [...new Set(keys.emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const name = keys.name?.trim() ?? '';
  if (phones.length === 0 && emails.length === 0 && !name) return [];

  const subdomain = tenant.trim().toLowerCase();
  const excluded = [...new Set(excludeIds.map(String).filter(Boolean))];
  const prefixRegex = buildNamePrefixRegex(keys.namePrefixes);
  const matchClauses: SQL[] = [];

  if (phones.length > 0) {
    matchClauses.push(sql`EXISTS (
      SELECT 1
      FROM ${contactPhones} p
      WHERE p.workspace_subdomain = ${contacts.workspaceSubdomain}
        AND p.contact_id = ${contacts.id}
        AND ${phoneComparisonKeySql(sql`p.number`)}
          IN (${sql.join(phones.map((p) => sql`${p}`), sql`, `)})
    )`);
    matchClauses.push(sql`${phoneComparisonKeySql(sql`${contacts.phone}`)} IN (${sql.join(phones.map((p) => sql`${p}`), sql`, `)})`);
  }

  if (emails.length > 0) {
    matchClauses.push(sql`EXISTS (
      SELECT 1
      FROM ${contactEmails} e
      WHERE e.workspace_subdomain = ${contacts.workspaceSubdomain}
        AND e.contact_id = ${contacts.id}
        AND ${emailKeySql(sql`e.address`)}
          IN (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})
    )`);
    matchClauses.push(sql`${emailKeySql(sql`${contacts.email}`)} IN (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})`);
  }

  if (name) {
    matchClauses.push(sql`${nameKeySql(prefixRegex)} = ${name}`);
  }

  const whereParts: SQL[] = [
    activeWorkspaceWhere(subdomain),
    sql`(${sql.join(matchClauses, sql` OR `)})`,
  ];
  if (excluded.length > 0) {
    whereParts.push(notInArray(contacts.id, excluded));
  }

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(...whereParts));
    return rows.map((row) => String(row.id));
  });
}

/**
 * Distinct active contact ids that could participate in any duplicate pair.
 *
 * Single SQL pass over the tenant: emits one row per (contact, key) from the
 * phone/email/name key space, keeps keys with >= 2 distinct contacts, and
 * returns the distinct participant ids. No full active-set hydration.
 */
export async function findContactDuplicateBlockedIds(
  tenant: string,
  namePrefixes: string[],
): Promise<string[]> {
  const subdomain = tenant.trim().toLowerCase();
  const prefixRegex = buildNamePrefixRegex(namePrefixes);

  return withTenantTransaction(subdomain, async (tx) => {
    const result = await tx.execute(sql`
      WITH keyed AS (
        SELECT p.contact_id AS id,
               ${phoneComparisonKeySql(sql`p.number`)} AS k
        FROM ${contactPhones} p
        JOIN ${contacts} c ON c.workspace_subdomain = p.workspace_subdomain AND c.id = p.contact_id
        WHERE p.workspace_subdomain = ${subdomain}
          AND c.deleted_at IS NULL
          AND ${phoneComparisonKeySql(sql`p.number`)} <> ''
        UNION ALL
        SELECT c.id AS id,
               ${phoneComparisonKeySql(sql`c.phone`)} AS k
        FROM ${contacts} c
        WHERE c.workspace_subdomain = ${subdomain}
          AND c.deleted_at IS NULL
          AND NULLIF(trim(c.phone), '') IS NOT NULL
          AND ${phoneComparisonKeySql(sql`c.phone`)} <> ''
        UNION ALL
        SELECT e.contact_id AS id,
               ${emailKeySql(sql`e.address`)} AS k
        FROM ${contactEmails} e
        JOIN ${contacts} c ON c.workspace_subdomain = e.workspace_subdomain AND c.id = e.contact_id
        WHERE e.workspace_subdomain = ${subdomain}
          AND c.deleted_at IS NULL
          AND ${emailKeySql(sql`e.address`)} <> ''
        UNION ALL
        SELECT c.id AS id,
               ${emailKeySql(sql`c.email`)} AS k
        FROM ${contacts} c
        WHERE c.workspace_subdomain = ${subdomain}
          AND c.deleted_at IS NULL
          AND NULLIF(trim(c.email), '') IS NOT NULL
          AND ${emailKeySql(sql`c.email`)} <> ''
        UNION ALL
        SELECT ${contacts.id} AS id,
               ${nameKeySql(prefixRegex)} AS k
        FROM ${contacts}
        WHERE ${activeWorkspaceWhere(subdomain)}
          AND ${nameKeySql(prefixRegex)} <> ''
      ),
      buckets AS (
        SELECT k, id
        FROM keyed
        GROUP BY k, id
      ),
      multi AS (
        SELECT k
        FROM buckets
        GROUP BY k
        HAVING count(*) >= 2
      )
      SELECT DISTINCT b.id
      FROM buckets b
      JOIN multi m USING (k)
    `);
    return (result.rows as Array<{ id: string }>).map((row) => String(row.id));
  });
}
