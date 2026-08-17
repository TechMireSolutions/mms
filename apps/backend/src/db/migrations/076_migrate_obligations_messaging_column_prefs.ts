/**
 * One-shot backfill: document-store per-user Work column-prefs objects → typed
 * column-prefs tables for the last modules still on the `objects` KV at the time of
 * 0061 (obligations, messaging recipients/history/templates).
 *
 * These tables have no `user_id → tenant_users.id` FK, so no user filtering is needed
 * (runtime writes only ever come from authenticated users regardless).
 *
 * Idempotent via on-conflict upsert.
 */
import { parseTenantScopedStorageKey } from '@mms/shared';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

type Target = {
  logicalKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
};

const TARGETS: Target[] = [
  { logicalKey: 'obligations_user_column_preferences', table: schema.obligationsUserColumnPrefs },
  { logicalKey: 'messaging_recipients_user_column_preferences', table: schema.messagingRecipientsUserColumnPrefs },
  { logicalKey: 'messaging_history_user_column_preferences', table: schema.messagingHistoryUserColumnPrefs },
  { logicalKey: 'messaging_templates_user_column_preferences', table: schema.messagingTemplatesUserColumnPrefs },
];

export async function runMigration076(): Promise<void> {
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

        let tenantRows = 0;
        for (const [userId, prefs] of Object.entries(userPrefs)) {
          const uid = userId.trim();
          if (!uid || !Array.isArray(prefs)) continue;

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
          console.log(`[Migration 076] Migrated ${tenantRows} ${target.logicalKey} row(s) for tenant "${tenant}".`);
        }
        totalRows += tenantRows;
      }
    }
  });

  console.log(`[Migration 076] Done — ${totalRows} column-prefs row(s) backfilled across ${TARGETS.length} targets.`);
}