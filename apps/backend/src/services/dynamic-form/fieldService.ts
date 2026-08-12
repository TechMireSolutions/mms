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
 * Checks value uniqueness across entity customData using PostgreSQL GIN containment (@>).
 */
export async function checkValueUniqueness(
  workspaceSubdomain: string,
  moduleName: string,
  fieldKey: string,
  value: unknown
): Promise<boolean> {
  const matchPattern = JSON.stringify({ [fieldKey]: value });
  const db = activeDb();

  // Map module to target Drizzle entity table
  let table: any = contacts;
  if (moduleName === 'students') {
    table = students;
  } else if (moduleName === 'contacts') {
    table = contacts;
  } else if (moduleName === 'teachers') {
    table = teachers;
  } else if (moduleName === 'users') {
    table = tenantUsers;
  } else if (moduleName === 'finance' || moduleName === 'invoices') {
    table = financeInvoices;
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(
      and(
        eq(table.workspaceSubdomain, workspaceSubdomain),
        sql`${table.customData} @> ${matchPattern}::jsonb`
      )
    );

  return Number(result?.count ?? 0) === 0;
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
      type: field.type as any,
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
