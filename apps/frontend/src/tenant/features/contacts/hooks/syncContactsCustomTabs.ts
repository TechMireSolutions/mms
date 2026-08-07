import type { TabDefinition } from "@mms/shared";
import { syncModuleCustomTabs } from "@/lib/customTabs/customTabsApi";

/** Upsert Contacts form tabs via typed `/api/custom-tabs`, then delete removed rows. */
export async function syncContactsCustomTabs(formTabs: TabDefinition[]): Promise<void> {
  await syncModuleCustomTabs("contacts", formTabs);
}
