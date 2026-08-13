/**
 * Deletes orphan document-store per-user Work column-prefs object keys after the
 * typed-table backfill in 074. Each key is deleted for a tenant only when the
 * corresponding typed table already holds at least one row for that tenant
 * (i.e. backfill succeeded there) — never clear a key whose typed authority is
 * empty, to avoid dropping prefs that were never migrated.
 *
 * Safe to re-run: guards skip unsafe keys and `deleteObjectByStorageKey` is idempotent.
 */
import { eq } from 'drizzle-orm';
import { parseTenantScopedStorageKey } from '@mms/shared';
import * as schema from '../schema.js';
import { deleteObjectByStorageKey, listObjectStorageKeys } from '../database.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

type Target = {
  logicalKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
};

const TARGETS: Target[] = [
  { logicalKey: 'attendance_user_column_preferences', table: schema.attendanceUserColumnPrefs },
  { logicalKey: 'question_bank_user_column_preferences', table: schema.questionBankUserColumnPrefs },
  { logicalKey: 'finance_invoice_user_column_preferences', table: schema.financeUserColumnPrefs },
  { logicalKey: 'finance_payment_user_column_preferences', table: schema.financePaymentUserColumnPrefs },
  { logicalKey: 'accounting_account_user_column_preferences', table: schema.accountingAccountUserColumnPrefs },
  { logicalKey: 'accounting_journal_user_column_preferences', table: schema.accountingJournalUserColumnPrefs },
  { logicalKey: 'examination_exam_user_column_preferences', table: schema.examinationExamUserColumnPrefs },
  { logicalKey: 'examination_results_user_column_preferences', table: schema.examinationResultsUserColumnPrefs },
  { logicalKey: 'hasanat_distribution_user_column_preferences', table: schema.hasanatDistributionUserColumnPrefs },
  { logicalKey: 'hasanat_redemption_user_column_preferences', table: schema.hasanatRedemptionUserColumnPrefs },
];

type Candidate = { key: string; tenant: string; targetIndex: number };

export async function runMigration075(): Promise<void> {
  const keys = await listObjectStorageKeys();
  const candidates: Candidate[] = [];

  for (const key of keys) {
    const parsed = parseTenantScopedStorageKey(key);
    if (!parsed) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;
    const targetIndex = TARGETS.findIndex((target) => target.logicalKey === parsed.logicalKey);
    if (targetIndex === -1) continue;
    candidates.push({ key, tenant, targetIndex });
  }

  if (candidates.length === 0) {
    console.log('[Migration 075] No orphan column-prefs object keys to clear.');
    return;
  }

  const toDelete: string[] = [];
  let skipped = 0;

  await withTenantTransaction(null, async (tx) => {
    // tenant|targetIndex -> has typed rows
    const hasRowsCache = new Map<string, boolean>();

    for (const candidate of candidates) {
      const cacheKey = `${candidate.tenant}|${candidate.targetIndex}`;
      let allowed = hasRowsCache.get(cacheKey);
      if (allowed === undefined) {
        const target = TARGETS[candidate.targetIndex];
        const [row] = await tx
          .select({ workspaceSubdomain: target.table.workspaceSubdomain })
          .from(target.table)
          .where(eq(target.table.workspaceSubdomain, candidate.tenant))
          .limit(1);
        allowed = Boolean(row);
        hasRowsCache.set(cacheKey, allowed);
      }

      if (!allowed) {
        skipped += 1;
        console.warn(
          `[Migration 075] Skipping "${candidate.key}": typed column-prefs missing for tenant "${candidate.tenant}".`,
        );
        continue;
      }
      toDelete.push(candidate.key);
    }
  });

  for (const key of toDelete) {
    await deleteObjectByStorageKey(key);
    console.log(`[Migration 075] Deleted orphan object key "${key}".`);
  }

  if (toDelete.length === 0 && skipped === 0) {
    console.log('[Migration 075] No orphan column-prefs object keys to clear.');
  } else {
    console.log(
      `[Migration 075] Removed ${toDelete.length} key(s); skipped ${skipped} unsafe key(s).`,
    );
  }
}