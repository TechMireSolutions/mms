import { SETTINGS_KEY_TO_MODULE } from '@mms/shared';
import { and, eq, or, sql } from 'drizzle-orm';
import { activeDb } from './dbConnection.js';
import * as schema from './schema.js';

interface CustomTabInput {
  key: string;
  label: string;
  icon?: string | null;
  enabled?: boolean;
  order?: number;
  permissions?: string[] | null;
  description?: string | null;
  color?: string | null;
  isSystem?: boolean;
}

function customTabModuleFilter(moduleId: string) {
  return or(
    eq(schema.customTabs.moduleId, moduleId),
    moduleId === 'enrollments' ? eq(schema.customTabs.moduleId, 'enrollment') : sql`false`,
    moduleId === 'examinations' ? eq(schema.customTabs.moduleId, 'examination') : sql`false`,
    moduleId === 'questionBank' ? eq(schema.customTabs.moduleId, 'question-bank') : sql`false`,
  );
}

export async function hydrateObjectData(key: string, data: unknown, tenant: string): Promise<unknown> {
  const moduleId = SETTINGS_KEY_TO_MODULE[key];
  if (!moduleId || !data || typeof data !== 'object') return data;

  const dataObj = data as Record<string, unknown>;
  const tabRows = await activeDb()
    .select()
    .from(schema.customTabs)
    .where(and(eq(schema.customTabs.workspaceSubdomain, tenant), customTabModuleFilter(moduleId)))
    .orderBy(schema.customTabs.sortOrder);

  const formTabs = tabRows.map((row) => ({
    key: row.key,
    label: row.label,
    icon: row.icon ?? undefined,
    enabled: row.enabled,
    order: row.sortOrder,
    permissions: (row.permissions as string[]) ?? undefined,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    isSystem: row.isSystem,
  }));

  return { ...dataObj, formTabs };
}

export async function saveCustomTabsForObject(key: string, data: unknown, tenant: string): Promise<unknown> {
  const moduleId = SETTINGS_KEY_TO_MODULE[key];
  if (!moduleId || !data || typeof data !== 'object') return data;

  const dataObj = data as Record<string, unknown>;
  if (!('formTabs' in dataObj)) {
    return data;
  }

  const formTabs = dataObj.formTabs;
  const cleanedData = { ...dataObj };
  delete cleanedData.formTabs;

  await activeDb()
    .delete(schema.customTabs)
    .where(and(eq(schema.customTabs.workspaceSubdomain, tenant), customTabModuleFilter(moduleId)));

  if (Array.isArray(formTabs) && formTabs.length > 0) {
    const values = formTabs.map((tabRaw: unknown, index: number) => {
      const tab = tabRaw as CustomTabInput;
      return {
        id: `${tenant}:${moduleId}:${tab.key}`,
        workspaceSubdomain: tenant,
        moduleId,
        key: tab.key,
        label: tab.label,
        icon: tab.icon || null,
        enabled: tab.enabled !== false,
        sortOrder: tab.order ?? index,
        permissions: tab.permissions || null,
        description: tab.description || null,
        color: tab.color || null,
        isSystem: tab.isSystem === true,
      };
    });

    await activeDb().insert(schema.customTabs).values(values);
  }

  return cleanedData;
}
