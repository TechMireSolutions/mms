import { eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { parseTenantScopedStorageKey, splitFinanceSettingsBlob } from '@mms/shared';

const SETTINGS_KEY = 'finance_settings';
const COLUMN_PREFS_KEY = 'finance_user_column_preferences';

/** One-shot backfill: document-store finance_settings / column prefs → typed Finance Setup tables. */
export async function runMigration058(): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(schema.objects);

  const settingsByTenant = new Map<string, Record<string, unknown>>();
  const columnByTenant = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const parsed = parseTenantScopedStorageKey(row.key);
    if (!parsed) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;
    const data = row.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
    const record = data as Record<string, unknown>;

    if (parsed.logicalKey === SETTINGS_KEY && !settingsByTenant.has(tenant)) {
      settingsByTenant.set(tenant, record);
    }
    if (parsed.logicalKey === COLUMN_PREFS_KEY && !columnByTenant.has(tenant)) {
      columnByTenant.set(tenant, record);
    }
  }

  let fieldCount = 0;
  let prefsCount = 0;
  let columnUserCount = 0;

  await withTenantTransaction(null, async (tx) => {
    for (const [tenant, raw] of settingsByTenant) {
      const [workspace] = await tx
        .select({ subdomain: schema.workspaces.subdomain })
        .from(schema.workspaces)
        .where(eq(schema.workspaces.subdomain, tenant))
        .limit(1);
      if (!workspace) {
        console.warn(`[Migration 058] Skipping tenant "${tenant}" — not found in workspaces.`);
        continue;
      }

      const { fieldConfig, preferences } = splitFinanceSettingsBlob(raw);

      const existingField = await tx
        .select({ workspaceSubdomain: schema.financeFieldConfigs.workspaceSubdomain })
        .from(schema.financeFieldConfigs)
        .where(eq(schema.financeFieldConfigs.workspaceSubdomain, tenant))
        .limit(1);
      if (existingField.length === 0) {
        await tx.insert(schema.financeFieldConfigs).values({
          workspaceSubdomain: tenant,
          config: fieldConfig,
          updatedAt: new Date(),
        });
        fieldCount += 1;
        console.log(`[Migration 058] Migrated finance_settings field-config for tenant "${tenant}".`);
      }

      const existingPrefs = await tx
        .select({ workspaceSubdomain: schema.financeModulePreferences.workspaceSubdomain })
        .from(schema.financeModulePreferences)
        .where(eq(schema.financeModulePreferences.workspaceSubdomain, tenant))
        .limit(1);
      if (existingPrefs.length === 0) {
        await tx.insert(schema.financeModulePreferences).values({
          workspaceSubdomain: tenant,
          preferences: preferences as Record<string, unknown>,
          updatedAt: new Date(),
        });
        prefsCount += 1;
        console.log(`[Migration 058] Migrated finance_settings preferences for tenant "${tenant}".`);
      }
    }

    for (const [tenant, raw] of columnByTenant) {
      const userPrefs =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, Record<string, unknown>>)
          : {};
      for (const [userId, prefs] of Object.entries(userPrefs)) {
        if (!userId || typeof prefs !== 'object') continue;
        const existingCol = await tx
          .select({ workspaceSubdomain: schema.financeUserColumnPrefs.workspaceSubdomain })
          .from(schema.financeUserColumnPrefs)
          .where(eq(schema.financeUserColumnPrefs.workspaceSubdomain, tenant))
          .limit(1);
        if (existingCol.length === 0) {
          await tx.insert(schema.financeUserColumnPrefs).values({
            workspaceSubdomain: tenant,
            userId,
            preferences: prefs,
            updatedAt: new Date(),
          });
          columnUserCount += 1;
        }
      }
    }
  });

  console.log(
    `[Migration 058] Done. field-configs: ${fieldCount}, preferences: ${prefsCount}, column-prefs users: ${columnUserCount}.`,
  );
}
