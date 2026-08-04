import { DEFAULT_FORM_TABS, normalizeContactFormTabId, type TabDefinition } from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

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
  const defaultTab = DEFAULT_FORM_TABS.find((tab) => tab.key === row.key);
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

/**
 * Merge API custom_tabs with document-store formTabs — mirrors BE `loadContactFieldConfig`.
 * When API returns rows, those are SSOT; any document/default tabs missing from API are appended.
 */
export function mergeContactsFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {
  const baseTabs =
    documentFormTabs && documentFormTabs.length > 0 ? documentFormTabs : [...DEFAULT_FORM_TABS];

  const normalizedApi = apiTabs.map((tab) => ({
    ...tab,
    key: normalizeContactFormTabId(tab.key),
    label:
      tab.key === "emergency" || tab.label === "Emergency"
        ? "Relationship"
        : tab.label,
  }));

  const normalizedBase = baseTabs.map((tab) => ({
    ...tab,
    key: normalizeContactFormTabId(tab.key),
    label:
      tab.key === "emergency" || tab.label === "Emergency"
        ? "Relationship"
        : tab.label,
  }));

  const merged =
    normalizedApi.length === 0
      ? normalizedBase
      : [
          ...normalizedApi,
          ...normalizedBase.filter(
            (baseTab) => !normalizedApi.some((apiTab) => apiTab.key === baseTab.key),
          ),
        ];

  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}

/** Fetch Contacts form tabs from typed `/api/custom-tabs`. */
export async function loadContactsFormTabs(signal?: AbortSignal): Promise<TabDefinition[]> {
  const response = await apiJson<{ tabs: CustomTabApiRow[] }>(
    "/api/custom-tabs?moduleId=contacts",
    { signal },
  );
  return (response.tabs || []).map(mapCustomTabApiRowToTabDefinition);
}
