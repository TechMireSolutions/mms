import { eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { parseTenantScopedStorageKey } from '@mms/shared';

const FIELD_CONFIG_KEY = 'contact_field_config';
const PREFERENCES_KEY = 'contact_preferences';
const LEGACY_PREFERENCES_KEY = 'contact_prefs';
const COLUMN_PREFS_KEY = 'contact_user_column_preferences';
const LEGACY_COLUMN_PREFS_KEY = 'contact_user_column_prefs';

/** One-shot backfill: document-store objects → typed Contacts Setup config tables. */
export async function runMigration041(): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(schema.objects);

  const fieldByTenant = new Map<string, Record<string, unknown>>();
  const prefsByTenant = new Map<string, Record<string, unknown>>();
  const columnByTenant = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const parsed = parseTenantScopedStorageKey(row.key);
    if (!parsed) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;
    const data = row.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
    const record = data as Record<string, unknown>;

    if (parsed.logicalKey === FIELD_CONFIG_KEY && !fieldByTenant.has(tenant)) {
      fieldByTenant.set(tenant, record);
    }
    if (parsed.logicalKey === PREFERENCES_KEY) {
      prefsByTenant.set(tenant, record);
    } else if (parsed.logicalKey === LEGACY_PREFERENCES_KEY && !prefsByTenant.has(tenant)) {
      prefsByTenant.set(tenant, record);
    }
    if (parsed.logicalKey === COLUMN_PREFS_KEY) {
      columnByTenant.set(tenant, record);
    } else if (parsed.logicalKey === LEGACY_COLUMN_PREFS_KEY && !columnByTenant.has(tenant)) {
      columnByTenant.set(tenant, record);
    }
  }

  let fieldCount = 0;
  let prefsCount = 0;
  let columnUserCount = 0;

  for (const [tenant, config] of fieldByTenant) {
    const existing = await db
      .select({ workspaceSubdomain: schema.contactFieldConfigs.workspaceSubdomain })
      .from(schema.contactFieldConfigs)
      .where(eq(schema.contactFieldConfigs.workspaceSubdomain, tenant))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(schema.contactFieldConfigs).values({
      workspaceSubdomain: tenant,
      config,
      updatedAt: new Date(),
    });
    fieldCount += 1;
    console.log(`[Migration 041] Migrated contact_field_config for tenant "${tenant}".`);
  }

  for (const [tenant, preferences] of prefsByTenant) {
    const existing = await db
      .select({ workspaceSubdomain: schema.contactModulePreferences.workspaceSubdomain })
      .from(schema.contactModulePreferences)
      .where(eq(schema.contactModulePreferences.workspaceSubdomain, tenant))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(schema.contactModulePreferences).values({
      workspaceSubdomain: tenant,
      preferences,
      updatedAt: new Date(),
    });
    prefsCount += 1;
    console.log(`[Migration 041] Migrated contact_preferences for tenant "${tenant}".`);
  }

  for (const [tenant, map] of columnByTenant) {
    const existingRows = await db
      .select({ userId: schema.contactUserColumnPrefs.userId })
      .from(schema.contactUserColumnPrefs)
      .where(eq(schema.contactUserColumnPrefs.workspaceSubdomain, tenant));
    const existingUsers = new Set(existingRows.map((row) => row.userId));
    for (const [userId, prefs] of Object.entries(map)) {
      if (!userId.trim() || !Array.isArray(prefs) || existingUsers.has(userId)) continue;
      await db.insert(schema.contactUserColumnPrefs).values({
        workspaceSubdomain: tenant,
        userId,
        preferences: prefs,
        updatedAt: new Date(),
      });
      columnUserCount += 1;
    }
    if (Object.keys(map).length > 0) {
      console.log(`[Migration 041] Migrated column prefs for tenant "${tenant}".`);
    }
  }

  console.log(
    `[Migration 041] Done — field-config=${fieldCount}, preferences=${prefsCount}, column-user-rows=${columnUserCount}.`,
  );
}
