import { and, notInArray, sql, type SQL } from 'drizzle-orm';
import { buildNamePrefixRegex } from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { activeWorkspaceWhere } from './contactRepositoryAggregateHelpers.js';
import { jsonbArrayOrEmpty } from './contactRepositorySql.js';

/**
 * Normalized duplicate keys for SQL blocking.
 *
 * Mirrors the JS key space produced by `getContactDuplicateCandidateKeys` in
 * `@mms/shared` — `phones` are digits-only (last 10 when long enough), `emails`
 * are lower/trim, and `name` is lower/trim with prefix stripping + whitespace
 * collapse. `namePrefixes` lets SQL rebuild the same prefix regex via
 * `buildNamePrefixRegex` so JS and SQL never drift.
 */
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
  const nameExpr = sql`COALESCE(NULLIF(${contacts.customData}->>'name', ''), ${contacts.customData}->>'firstName')`;
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
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
      WHERE ${phoneComparisonKeySql(sql`phone.value->>'number'`)}
        IN (${sql.join(phones.map((p) => sql`${p}`), sql`, `)})
    )`);
  }

  if (emails.length > 0) {
    matchClauses.push(sql`EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
      WHERE ${emailKeySql(sql`email.value->>'address'`)}
        IN (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})
    )`);
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
        SELECT ${contacts.id} AS id,
               ${phoneComparisonKeySql(sql`phone.value->>'number'`)} AS k
        FROM ${contacts}
        CROSS JOIN LATERAL jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
        WHERE ${activeWorkspaceWhere(subdomain)}
          AND ${phoneComparisonKeySql(sql`phone.value->>'number'`)} <> ''
        UNION ALL
        SELECT ${contacts.id} AS id,
               ${emailKeySql(sql`email.value->>'address'`)} AS k
        FROM ${contacts}
        CROSS JOIN LATERAL jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
        WHERE ${activeWorkspaceWhere(subdomain)}
          AND ${emailKeySql(sql`email.value->>'address'`)} <> ''
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
