import { activeDb } from '../../db/dbConnection.js';
import { students, contacts, teachers, tenantUsers, financeInvoices, customFields, customTabs } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import type { CustomFieldConfig, TabConfig } from '@mms/shared';
import { randomUUID } from 'node:crypto';

export function generateFieldId(): string {
  const timeStamp = Date.now().toString(36);
  return `cf_${timeStamp}_${randomUUID().slice(0, 8)}`;
}

export function generateTabId(): string {
  const timeStamp = Date.now().toString(36);
  return `custom_${timeStamp}_${randomUUID().slice(0, 8)}`;
}

/**
 * DFS §4.2 — `fieldKey` is client-supplied; validate it against the tenant's
 * `custom_fields` registry before probing JSONB `@>` containment. The value is
 * bound as a parameterized `sql` argument (never string-interpolated), so this
 * guard is defense-in-depth against probing arbitrary JSONB keys, not a SQL-i
 * fix. Throws `FIELD_NOT_REGISTERED` when the key is absent from the registry.
 */
export async function checkValueUniqueness(
  workspaceSubdomain: string,
  moduleName: string,
  fieldKey: string,
  value: unknown
): Promise<boolean> {
  const db = activeDb();

  // Validate fieldKey against the tenant's custom_fields registry. `module_id`
  // lives on `custom_tabs`, so join through the tab. Throws when the key is not
  // a registered field for this module (defense-in-depth — the value is already
  // bound as a parameterized `sql` argument, never string-interpolated).
  const [registered] = await db
    .select({ id: customFields.id })
    .from(customFields)
    .innerJoin(customTabs, eq(customFields.tabId, customTabs.id))
    .where(
      and(
        eq(customFields.workspaceSubdomain, workspaceSubdomain),
        eq(customTabs.workspaceSubdomain, workspaceSubdomain),
        eq(customTabs.moduleId, moduleName),
        eq(customFields.key, fieldKey),
      ),
    );
  if (!registered) {
    throw new Error('FIELD_NOT_REGISTERED');
  }

  const matchPattern = JSON.stringify({ [fieldKey]: value });

  // Count existing rows whose customData (or profileJson for users) contains
  // the field key/value via GIN-backed `@>` containment.
  const countCustomData = async (
    table: typeof contacts | typeof students | typeof teachers | typeof financeInvoices,
  ): Promise<number> => {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(table)
      .where(
        and(
          eq(table.workspaceSubdomain, workspaceSubdomain),
          sql`${table.customData} @> ${matchPattern}::jsonb`,
        ),
      );
    return Number(result?.count ?? 0);
  };

  if (moduleName === 'students') return (await countCustomData(students)) === 0;
  if (moduleName === 'teachers') return (await countCustomData(teachers)) === 0;
  if (moduleName === 'finance' || moduleName === 'invoices') {
    return (await countCustomData(financeInvoices)) === 0;
  }
  if (moduleName === 'users') {
    // tenant_users stores DFS custom data in `profile_json`, not `custom_data`.
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.workspaceSubdomain, workspaceSubdomain),
          sql`${tenantUsers.profileJson} @> ${matchPattern}::jsonb`,
        ),
      );
    return Number(result?.count ?? 0) === 0;
  }

  return (await countCustomData(contacts)) === 0;
}

export async function listModuleTabs(
  workspaceSubdomain: string,
  moduleName: string
): Promise<TabConfig[]> {
  const db = activeDb();

  const tabRows = await db
    .select()
    .from(customTabs)
    .where(
      and(
        eq(customTabs.workspaceSubdomain, workspaceSubdomain),
        eq(customTabs.moduleId, moduleName)
      )
    );

  const fieldRows = await db
    .select()
    .from(customFields)
    .where(eq(customFields.workspaceSubdomain, workspaceSubdomain));

  const fieldsByTab = new Map<string, CustomFieldConfig[]>();
  for (const field of fieldRows) {
    const list = fieldsByTab.get(field.tabId) ?? [];
    list.push({
      id: field.id,
      tabId: field.tabId,
      key: field.key,
      label: field.label,
      type: field.type as CustomFieldConfig['type'],
      enabled: field.enabled,
      required: field.required,
      unique: field.unique,
      placeholder: field.placeholder,
      description: field.description,
      defaultValue: field.defaultValue,
      options: field.options,
      minValue: field.minValue,
      maxValue: field.maxValue,
      mask: field.mask,
      allowedExtensions: field.allowedExtensions,
      maxFileSize: field.maxFileSize,
      sortOrder: field.sortOrder,
      hasData: field.hasData,
      isSystem: field.isSystem,
    });
    fieldsByTab.set(field.tabId, list);
  }

  return tabRows.map((tab: typeof customTabs.$inferSelect) => ({
    id: tab.id,
    key: tab.key,
    label: tab.label,
    enabled: tab.enabled,
    required: false,
    sortOrder: tab.sortOrder,
    isSystem: tab.isSystem,
    fields: (fieldsByTab.get(tab.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
