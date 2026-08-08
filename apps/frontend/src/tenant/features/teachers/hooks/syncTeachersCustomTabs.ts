import type { TabDefinition } from "@mms/shared";
import { syncModuleCustomTabs } from "@/lib/customTabs/customTabsApi";

/** Upsert Teachers form tabs via typed `/api/custom-tabs`, then delete removed rows. */
export async function syncTeachersCustomTabs(formTabs: TabDefinition[]): Promise<void> {
  await syncModuleCustomTabs("teachers", formTabs);
}
