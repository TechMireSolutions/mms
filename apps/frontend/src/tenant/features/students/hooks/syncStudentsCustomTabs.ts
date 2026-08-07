import type { TabDefinition } from "@mms/shared";
import { syncModuleCustomTabs } from "@/lib/customTabs/customTabsApi";

/** Upsert Students form tabs via typed `/api/custom-tabs`, then delete removed rows. */
export async function syncStudentsCustomTabs(formTabs: TabDefinition[]): Promise<void> {
  await syncModuleCustomTabs("students", formTabs);
}
