/**
 * One-shot backfill: document-store per-user Work column-prefs objects → typed
 * column-prefs tables for the modules still on the `objects` KV at the time of
 * 0041 (attendance, question bank, finance invoice+payment, accounting account+
 * journal, examinations exam+results, hasanat distribution+redemption).
 *
 * `finance_user_column_preferences` was backfilled by 058 from the wrong
 * (non-existent) key, so the invoice table is effectively empty — this migration
 * repopulates it from the real `finance_invoice_user_column_preferences` key via
 * upsert (on-conflict update) so any stale 058 rows are overwritten with live data.
 *
 * The hasanat distribution/redemption tables have `user_id → tenant_users.id` FKs,
 * so their rows are filtered to userIds that still exist in `tenant_users` for the
 * tenant (defensive — runtime writes only ever come from authenticated users).
 *
 * Idempotent via on-conflict upsert.
 */
import { eq } from 'drizzle-orm';
import { parseTenantScopedStorageKey } from '@mms/shared';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

type Target = {
  logicalKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  /** Has `user_id → tenant_users.id` FK — filter to existing users. */
  filterUsers: boolean;
};

const TARGETS: Target[] = [
  { logicalKey: 'attendance_user_column_preferences', table: schema.attendanceUserColumnPrefs, filterUsers: false },
  { logicalKey: 'question_bank_user_column_preferences', table: schema.questionBankUserColumnPrefs, filterUsers: false },
  { logicalKey: 'finance_invoice_user_column_preferences', table: schema.financeUserColumnPrefs, filterUsers: false },
  { logicalKey: 'finance_payment_user_column_preferences', table: schema.financePaymentUserColumnPrefs, filterUsers: false },
  { logicalKey: 'accounting_account_user_column_preferences', table: schema.accountingAccountUserColumnPrefs, filterUsers: false },
  { logicalKey: 'accounting_journal_user_column_preferences', table: schema.accountingJournalUserColumnPrefs, filterUsers: false },
  { logicalKey: 'examination_exam_user_column_preferences', table: schema.examinationExamUserColumnPrefs, filterUsers: false },
  { logicalKey: 'examination_results_user_column_preferences', table: schema.examinationResultsUserColumnPrefs, filterUsers: false },
  { logicalKey: 'hasanat_distribution_user_column_preferences', table: schema.hasanatDistributionUserColumnPrefs, filterUsers: true },
  { logicalKey: 'hasanat_redemption_user_column_preferences', table: schema.hasanatRedemptionUserColumnPrefs, filterUsers: true },
];

export async function runMigration074(): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(schema.objects);

  // target index -> tenant -> { [userId]: prefs }
  const byTarget = TARGETS.map(() => new Map<string, Record<string, unknown>>());

  for (const row of rows) {
    const parsed = parseTenantScopedStorageKey(row.key);
    if (!parsed) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;
    const data = row.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) continue;

    TARGETS.forEach((target, index) => {
      if (parsed.logicalKey !== target.logicalKey) return;
      const map = byTarget[index];
      if (!map.has(tenant)) map.set(tenant, data as Record<string, unknown>);
    });
  }

  let totalRows = 0;

  await withTenantTransaction(null, async (tx) => {
    for (let index = 0; index < TARGETS.length; index += 1) {
      const target = TARGETS[index];
      const tenantMap = byTarget[index];
      if (tenantMap.size === 0) continue;

      for (const [tenant, userPrefs] of tenantMap) {
        if (!userPrefs || typeof userPrefs !== 'object' || Array.isArray(userPrefs)) continue;

        let validUsers: Set<string> | null = null;
        if (target.filterUsers) {
          const userRows = await tx
            .select({ id: schema.tenantUsers.id })
            .from(schema.tenantUsers)
            .where(eq(schema.tenantUsers.workspaceSubdomain, tenant));
          validUsers = new Set(userRows.map((u) => u.id));
        }

        let tenantRows = 0;
        for (const [userId, prefs] of Object.entries(userPrefs)) {
          const uid = userId.trim();
          if (!uid || !Array.isArray(prefs)) continue;
          if (validUsers && !validUsers.has(uid)) continue;

          await tx
            .insert(target.table)
            .values({
              workspaceSubdomain: tenant,
              userId: uid,
              preferences: prefs,
              updatedAt: new Date(),
            } as never)
            .onConflictDoUpdate({
              target: [target.table.workspaceSubdomain, target.table.userId],
              set: { preferences: prefs, updatedAt: new Date() } as never,
            });
          tenantRows += 1;
        }

        if (tenantRows > 0) {
          console.log(`[Migration 074] Migrated ${tenantRows} ${target.logicalKey} row(s) for tenant "${tenant}".`);
        }
        totalRows += tenantRows;
      }
    }
  });

  console.log(`[Migration 074] Done — ${totalRows} column-prefs row(s) backfilled across ${TARGETS.length} targets.`);
}