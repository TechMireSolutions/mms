import {
  getContactSeedFormTab,
  mergeContactsFormTabsFromApi,
  type TabDefinition,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

export { mergeContactsFormTabsFromApi };

/** Row shape returned by `GET /api/custom-tabs`. */
export interface CustomTabApiRow {
  id: string;
  key: string;
  label: string;
  icon?: string | null;
  enabled?: boolean;
  sortOrder?: number;
  permissions?: string[] | null;
  description?: string | null;
  color?: string | null;
  isSystem?: boolean;
}

/** Map a typed custom_tabs API row to Setup/form `TabDefinition`. */
export function mapCustomTabApiRowToTabDefinition(row: CustomTabApiRow): TabDefinition {
  const defaultTab = getContactSeedFormTab(row.key);
  return {
    key: row.key,
    label: row.label || defaultTab?.label || row.key,
    labelKey: defaultTab?.labelKey,
    icon: row.icon ?? defaultTab?.icon,
    enabled: row.enabled !== false,
    order: row.sortOrder ?? defaultTab?.order ?? 0,
    permissions: row.permissions ?? undefined,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    isSystem: row.isSystem ?? defaultTab?.isSystem,
  };
}

/** Fetch Contacts form tabs from typed `/api/custom-tabs`. */
export async function loadContactsFormTabs(signal?: AbortSignal): Promise<TabDefinition[]> {
  const response = await apiJson<{ tabs: CustomTabApiRow[] }>(
    "/api/custom-tabs?moduleId=contacts",
    { signal },
  );
  return (response.tabs || []).map(mapCustomTabApiRowToTabDefinition);
}
