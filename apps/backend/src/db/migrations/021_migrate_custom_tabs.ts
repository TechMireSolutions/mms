import { and, eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { parseTenantScopedStorageKey } from '@mms/shared';

const CONFIG_KEY_TO_MODULE: Record<string, string> = {
  'contact_field_config': 'contacts',
  'students_settings': 'students',
  'teachers_settings': 'teachers',
  'sessions_settings': 'sessions',
  'attendance_settings': 'attendance',
  'enrollments_settings': 'enrollment',
  'finance_settings': 'finance',
  'obligations_settings': 'obligations',
  'accounting_settings': 'accounting',
  'hasanat_settings': 'hasanat',
  'examinations_settings': 'examination',
  'question_bank_settings': 'questionBank',
  'users_settings': 'users',
};

export async function runMigration021(): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(schema.objects);
  let migratedCount = 0;

  for (const row of rows) {
    const parsed = parseTenantScopedStorageKey(row.key);
    const logicalKey = parsed?.logicalKey ?? row.key;
    const moduleId = CONFIG_KEY_TO_MODULE[logicalKey];
    if (!moduleId) continue;

    const data = row.data as any;
    if (!data || typeof data !== 'object' || !Array.isArray(data.formTabs) || data.formTabs.length === 0) {
      continue;
    }

    const tenant = parsed?.subdomain ?? 'demo'; // fallback to demo if not scoped, but all settings objects are scoped
    const formTabs = data.formTabs;

    // Delete existing custom tabs for this tenant + module
    await db
      .delete(schema.customTabs)
      .where(
        and(
          eq(schema.customTabs.workspaceSubdomain, tenant),
          eq(schema.customTabs.moduleId, moduleId)
        )
      );

    const values = formTabs.map((tab: any, idx: number) => ({
      id: `${tenant}:${moduleId}:${tab.key}`,
      workspaceSubdomain: tenant,
      moduleId,
      key: tab.key,
      label: tab.label,
      icon: tab.icon || null,
      enabled: tab.enabled !== false,
      sortOrder: tab.order ?? idx,
      permissions: tab.permissions || null,
      description: tab.description || null,
      color: tab.color || null,
      isSystem: tab.isSystem === true,
    }));

    await db.insert(schema.customTabs).values(values);

    // Remove formTabs from the JSON document in objects table
    const cleanedData = { ...data };
    delete cleanedData.formTabs;

    await db
      .update(schema.objects)
      .set({ data: cleanedData })
      .where(eq(schema.objects.key, row.key));

    migratedCount++;
    console.log(
      `[Migration 021] Migrated ${formTabs.length} tabs for module "${moduleId}" (tenant: "${tenant}") from objects to custom_tabs table.`
    );
  }

  if (migratedCount === 0) {
    console.log('[Migration 021] No custom tabs configuration to migrate.');
  }
}
