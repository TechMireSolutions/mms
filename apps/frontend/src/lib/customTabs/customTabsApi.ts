import type { TabDefinition } from "@mms/shared";
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

/** Map a typed custom_tabs API row to Setup/form `TabDefinition`, merging optional seed defaults. */
export function mapCustomTabApiRowToTabDefinition(
  row: CustomTabApiRow,
  seed?: Partial<TabDefinition> | null,
): TabDefinition {
  return {
    key: row.key,
    label: row.label || seed?.label || row.key,
    labelKey: seed?.labelKey,
    icon: row.icon ?? seed?.icon,
    enabled: row.enabled !== false,
    order: row.sortOrder ?? seed?.order ?? 0,
    permissions: row.permissions ?? undefined,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    isSystem: row.isSystem ?? seed?.isSystem,
  };
}

/** Fetch module form tabs from typed `/api/custom-tabs`. */
export async function loadModuleCustomTabs(
  moduleId: string,
  options?: {
    signal?: AbortSignal;
    mapRow?: (row: CustomTabApiRow) => TabDefinition;
  },
): Promise<TabDefinition[]> {
  const response = await apiJson<{ tabs: CustomTabApiRow[] }>(
    `/api/custom-tabs?moduleId=${encodeURIComponent(moduleId)}`,
    { signal: options?.signal },
  );
  const mapRow =
    options?.mapRow ?? ((row: CustomTabApiRow) => mapCustomTabApiRowToTabDefinition(row));
  return (response.tabs || []).map(mapRow);
}

/**
 * Upsert module form tabs via typed `/api/custom-tabs`, then delete rows removed in Setup.
 * Bulk PUT is upsert-only — absent keys are removed via explicit DELETE.
 */
export async function syncModuleCustomTabs(
  moduleId: string,
  formTabs: TabDefinition[],
): Promise<void> {
  const tabs = formTabs.map((tab, index) => ({
    key: tab.key,
    label: tab.label || tab.key,
    icon: tab.icon ?? null,
    enabled: tab.enabled !== false,
    sortOrder: tab.order ?? index,
    permissions: tab.permissions ?? null,
    description: tab.description ?? null,
    color: tab.color ?? null,
    isSystem: tab.isSystem === true,
  }));

  await apiJson("/api/custom-tabs/bulk", {
    method: "PUT",
    body: JSON.stringify({ moduleId, tabs }),
  });

  const existing = await apiJson<{ tabs: CustomTabApiRow[] }>(
    `/api/custom-tabs?moduleId=${encodeURIComponent(moduleId)}`,
  );
  const nextKeys = new Set(tabs.map((tab) => tab.key));
  await Promise.all(
    (existing.tabs || [])
      .filter((tab) => tab.key && !nextKeys.has(tab.key))
      .map((tab) =>
        apiJson(`/api/custom-tabs/${encodeURIComponent(tab.id)}`, { method: "DELETE" }),
      ),
  );
}
