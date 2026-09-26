import { eq, sql } from 'drizzle-orm';
import type { Account } from '@mms/shared';
import { accountingAccounts } from '../schema.js';
import { withTenant } from '../tenant-context.js';

export type SeedAccountsResult = { seeded: true; count: number } | { seeded: false; existing: number };

/**
 * Inserts `records` only when the workspace has no account rows at all
 * (archived rows included, so a seed can never duplicate an archived code).
 *
 * The advisory lock serializes concurrent seeds for the same workspace: without
 * it, two requests could both read a zero count and both insert the chart.
 * Count and insert share one transaction, so a failed insert rolls back entirely.
 */
export async function seedAccountsIfEmpty(tenant: string, records: Account[]): Promise<SeedAccountsResult> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${subdomain}), hashtext('accounting:coa-seed'))`);
    const existing = await tx.$count(accountingAccounts, eq(accountingAccounts.workspaceSubdomain, subdomain));
    if (existing > 0) return { seeded: false, existing };
    if (records.length === 0) return { seeded: true, count: 0 };

    const now = new Date();
    await tx.insert(accountingAccounts).values(
      records.map((record) => ({
        id: record.id,
        workspaceSubdomain: subdomain,
        code: record.code,
        name: record.name,
        type: record.type,
        subtype: record.subtype ?? '',
        description: record.description ?? '',
        isActive: record.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      })),
    );
    return { seeded: true, count: records.length };
  });
}
