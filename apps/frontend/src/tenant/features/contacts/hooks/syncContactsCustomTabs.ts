import { apiJson } from "@/lib/apiClient";
import type { TabDefinition } from "@mms/shared";
import type { CustomTabApiRow } from "@/lib/contacts/contactsCustomTabsApi";

/**
 * Upsert Contacts form tabs via typed `/api/custom-tabs`, then delete rows removed in Setup.
 */
export async function syncContactsCustomTabs(formTabs: TabDefinition[]): Promise<void> {
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
    body: JSON.stringify({ moduleId: "contacts", tabs }),
  });

  const existing = await apiJson<{ tabs: CustomTabApiRow[] }>("/api/custom-tabs?moduleId=contacts");
  const nextKeys = new Set(tabs.map((tab) => tab.key));
  await Promise.all(
    (existing.tabs || [])
      .filter((tab) => tab.key && !nextKeys.has(tab.key))
      .map((tab) =>
        apiJson(`/api/custom-tabs/${encodeURIComponent(tab.id)}`, { method: "DELETE" }),
      ),
  );
}
