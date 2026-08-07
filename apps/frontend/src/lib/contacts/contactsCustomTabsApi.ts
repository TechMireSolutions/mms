import {
  getContactSeedFormTab,
  type TabDefinition,
} from "@mms/shared";
import {
  loadModuleCustomTabs,
  mapCustomTabApiRowToTabDefinition as mapCustomTabApiRow,
  type CustomTabApiRow,
} from "@/lib/customTabs/customTabsApi";

export type { CustomTabApiRow } from "@/lib/customTabs/customTabsApi";
export { syncModuleCustomTabs } from "@/lib/customTabs/customTabsApi";

/** Map a typed custom_tabs API row to Setup/form `TabDefinition` (Contacts seed merge). */
export function mapCustomTabApiRowToTabDefinition(row: CustomTabApiRow): TabDefinition {
  return mapCustomTabApiRow(row, getContactSeedFormTab(row.key));
}

/** Fetch Contacts form tabs from typed `/api/custom-tabs`. */
export async function loadContactsFormTabs(signal?: AbortSignal): Promise<TabDefinition[]> {
  return loadModuleCustomTabs("contacts", {
    signal,
    mapRow: mapCustomTabApiRowToTabDefinition,
  });
}
