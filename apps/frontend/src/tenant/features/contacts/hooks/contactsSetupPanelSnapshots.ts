import {
  type FieldConfig,
  type TabDefinition,
  DEFAULT_FORM_TABS,
  isContactLockedEnabledTab,
  withContactLockedEnabledTabs,
} from "@mms/shared";

export function fieldsSetupSnapshot(input: {
  fields: FieldConfig["fields"];
  enabledTabs: Iterable<string>;
  requiredTabs: Iterable<string>;
  formTabs: TabDefinition[];
}): string {
  const enabled = withContactLockedEnabledTabs(input.enabledTabs).sort();
  const required = [...input.requiredTabs]
    .map((tabId) => tabId.toLowerCase())
    .sort();
  const formTabs = input.formTabs
    .map((tab) => ({
      key: tab.key.toLowerCase(),
      enabled: isContactLockedEnabledTab(tab.key) ? true : tab.enabled !== false,
      label: tab.label,
      order: tab.order ?? 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  return JSON.stringify({
    fields: input.fields || {},
    enabled,
    required,
    formTabs,
  });
}

export function resolveSetupFormTabs(formTabs: TabDefinition[] | undefined): TabDefinition[] {
  return formTabs && formTabs.length > 0 ? formTabs : DEFAULT_FORM_TABS;
}

export function resolveSetupEnabledTabs(formTabs: TabDefinition[] | undefined): string[] {
  return withContactLockedEnabledTabs(
    resolveSetupFormTabs(formTabs)
      .filter((tab) => tab.enabled !== false)
      .map((tab) => tab.key),
  );
}
