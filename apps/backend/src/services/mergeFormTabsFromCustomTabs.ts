import { loadCustomTabs } from './customTabsService.js';
import type { CustomTabDbInput } from '../db/repositories/customTabsRepository.js';

type CustomTabRow = Awaited<ReturnType<typeof loadCustomTabs>>[number];

/**
 * Load `custom_tabs` for a module, map rows, and merge into document formTabs.
 * Module services supply merge + map — no dual-write into field-config.
 */
export async function mergeFormTabsFromCustomTabs<TFormTab, TFields>({
  moduleId,
  documentFormTabs,
  fields,
  mapRow,
  merge,
}: {
  moduleId: string;
  documentFormTabs: TFormTab[] | undefined;
  fields: TFields;
  mapRow: (row: CustomTabRow) => TFormTab;
  merge: (
    documentFormTabs: TFormTab[] | undefined,
    customFormTabs: TFormTab[],
    fields: TFields,
  ) => TFormTab[];
}): Promise<TFormTab[]> {
  const tabRows = await loadCustomTabs(moduleId);
  const customFormTabs = tabRows.map(mapRow);
  return merge(documentFormTabs, customFormTabs, fields);
}

/** Shared row → form-tab shape used by Contacts/Students config services. */
export function mapCustomTabRowToFormTabFields(row: CustomTabDbInput | CustomTabRow) {
  return {
    key: row.key,
    label: row.label,
    icon: row.icon ?? undefined,
    enabled: row.enabled !== false,
    order: row.sortOrder ?? 0,
    permissions: (row.permissions as string[] | null | undefined) ?? undefined,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    isSystem: row.isSystem === true,
  };
}
