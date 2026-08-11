import { and, eq, isNull, sql, type SQL, type AnyColumn } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { withTenantTransaction } from '../withTenantTransaction.js';

/**
 * Quoted JSONB key literal for `->`/`->>` access, sanitized to `[a-zA-Z0-9_]`
 * so Setup-supplied field keys can never inject SQL. Centralizes the pattern
 * used by every module widget repository for dynamic `custom_data` keys.
 */
export function jsonbFieldKeyLiteral(fieldKey: string): SQL {
  const safe = fieldKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
  return sql.raw(`'${safe}'`);
}

/**
 * Non-empty JSONB `custom_data` value for a field key (string trim, array length,
 * other types count). Used by Contacts/Students Setup field-usage counters.
 */
export function jsonbCustomDataFieldNonEmptySql(
  customDataCol: AnyColumn,
  fieldKey: string,
): SQL {
  return sql`(
    ${customDataCol}->${fieldKey} IS NOT NULL
    AND ${customDataCol}->${fieldKey} <> 'null'::jsonb
    AND (
      (
        jsonb_typeof(${customDataCol}->${fieldKey}) = 'string'
        AND NULLIF(trim(${customDataCol}->>${fieldKey}), '') IS NOT NULL
      )
      OR (
        jsonb_typeof(${customDataCol}->${fieldKey}) = 'array'
        AND jsonb_array_length(${customDataCol}->${fieldKey}) > 0
      )
      OR (
        jsonb_typeof(${customDataCol}->${fieldKey}) NOT IN ('string', 'array', 'null')
      )
    )
  )`;
}

export type CountJsonbFieldUsageByKeysOptions = {
  tenant: string;
  fieldKeys: string[];
  table: PgTable;
  customDataCol: AnyColumn;
  workspaceSubdomainCol: AnyColumn;
  deletedAtCol: AnyColumn;
};

/**
 * Counts active rows with a non-empty custom_data value for each field key (SQL).
 * Single-pass `count(*) FILTER` per key. Every requested key is present (default 0).
 */
export async function countJsonbFieldUsageByKeys(
  options: CountJsonbFieldUsageByKeysOptions,
): Promise<Record<string, number>> {
  const { tenant, fieldKeys, table, customDataCol, workspaceSubdomainCol, deletedAtCol } =
    options;
  const uniqueKeys = [...new Set(fieldKeys.map((key) => key.trim()).filter(Boolean))];
  if (uniqueKeys.length === 0) {
    return Object.fromEntries(fieldKeys.map((key) => [key, 0]));
  }

  const subdomain = tenant.trim().toLowerCase();
  const selection = Object.fromEntries(
    uniqueKeys.map((fieldKey, index) => [
      `k${index}`,
      sql<number>`count(*) FILTER (WHERE ${jsonbCustomDataFieldNonEmptySql(customDataCol, fieldKey)})::int`.as(
        `k${index}`,
      ),
    ]),
  );

  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select(selection)
      .from(table)
      .where(and(eq(workspaceSubdomainCol, subdomain), isNull(deletedAtCol)));

    const row = (rows[0] ?? {}) as Record<string, number | null | undefined>;
    const counts: Record<string, number> = {};
    for (let index = 0; index < uniqueKeys.length; index += 1) {
      counts[uniqueKeys[index]] = Number(row[`k${index}`] ?? 0);
    }
    return Object.fromEntries(
      fieldKeys.map((key) => [key.trim(), counts[key.trim()] ?? 0]),
    );
  });
}
