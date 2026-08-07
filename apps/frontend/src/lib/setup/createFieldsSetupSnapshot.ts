import type { FieldDefinition, TabDefinition } from "@mms/shared";
import { canonicalizeFieldsMap } from "@/lib/setup/canonicalizeFields";

/**
 * Build a module-specific Setup Fields dirty snapshot (locked-tab aware).
 */
export function createFieldsSetupSnapshot({
  withLockedEnabledTabs,
  isLockedTab,
}: {
  withLockedEnabledTabs: (tabIds: Iterable<string>) => string[];
  isLockedTab: (tabKey: string) => boolean;
}) {
  return function fieldsSetupSnapshot(input: {
    fields: Record<string, FieldDefinition[]> | undefined;
    enabledTabs: Iterable<string>;
    requiredTabs: Iterable<string>;
    formTabs: TabDefinition[];
  }): string {
    const enabled = withLockedEnabledTabs(input.enabledTabs);
    const required = [...input.requiredTabs]
      .map((tabId) => tabId.toLowerCase())
      .sort();
    const formTabs = input.formTabs
      .map((tab) => ({
        key: tab.key.toLowerCase(),
        enabled: isLockedTab(tab.key) ? true : tab.enabled !== false,
        label: tab.label,
        order: tab.order ?? 0,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
    return JSON.stringify({
      fields: canonicalizeFieldsMap(input.fields, input.formTabs),
      enabled,
      required,
      formTabs,
    });
  };
}
