import { eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { parseTenantScopedStorageKey, splitEnrollmentsSettingsBlob } from '@mms/shared';

const SETTINGS_KEY = 'enrollments_settings';
const COLUMN_PREFS_KEY = 'enrollment_user_column_preferences';

/** One-shot backfill: document-store enrollments_settings / column prefs → typed Enrollments Setup tables. */
export async function runMigration056(): Promise<void> {
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

  await withTenant(null, async (tx) => {
    for (const [tenant, raw] of settingsByTenant) {
      const { fieldConfig, preferences } = splitEnrollmentsSettingsBlob(raw);

      const existingField = await tx
        .select({ workspaceSubdomain: schema.enrollmentFieldConfigs.workspaceSubdomain })
        .from(schema.enrollmentFieldConfigs)
        .where(eq(schema.enrollmentFieldConfigs.workspaceSubdomain, tenant))
        .limit(1);
      if (existingField.length === 0) {
        await tx.insert(schema.enrollmentFieldConfigs).values({
          workspaceSubdomain: tenant,
          config: fieldConfig,
          updatedAt: new Date(),
        });
        fieldCount += 1;
        console.log(`[Migration 056] Migrated enrollments_settings field-config for tenant "${tenant}".`);
      }

      const existingPrefs = await tx
        .select({ workspaceSubdomain: schema.enrollmentModulePreferences.workspaceSubdomain })
        .from(schema.enrollmentModulePreferences)
        .where(eq(schema.enrollmentModulePreferences.workspaceSubdomain, tenant))
        .limit(1);
      if (existingPrefs.length === 0) {
        await tx.insert(schema.enrollmentModulePreferences).values({
          workspaceSubdomain: tenant,
          preferences: preferences as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        });
        prefsCount += 1;
        console.log(`[Migration 056] Migrated enrollments_settings preferences for tenant "${tenant}".`);
      }
    }

    for (const [tenant, map] of columnByTenant) {
      const existingRows = await tx
        .select({ userId: schema.enrollmentUserColumnPrefs.userId })
        .from(schema.enrollmentUserColumnPrefs)
        .where(eq(schema.enrollmentUserColumnPrefs.workspaceSubdomain, tenant));
      const existingUsers = new Set(existingRows.map((row) => row.userId));
      for (const [userId, prefs] of Object.entries(map)) {
        if (!userId.trim() || !Array.isArray(prefs) || existingUsers.has(userId)) continue;
        await tx.insert(schema.enrollmentUserColumnPrefs).values({
          workspaceSubdomain: tenant,
          userId,
          preferences: prefs,
          updatedAt: new Date(),
        });
        columnUserCount += 1;
      }
      if (Object.keys(map).length > 0) {
        console.log(`[Migration 056] Migrated enrollment column prefs for tenant "${tenant}".`);
      }
    }
  });

  console.log(
    `[Migration 056] Done — field-config=${fieldCount}, preferences=${prefsCount}, column-user-rows=${columnUserCount}.`,
  );
}
