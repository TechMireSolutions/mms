import {
  type FieldConfig,
  type TabDefinition,
  DEFAULT_FORM_TABS,
  isContactLockedEnabledTab,
  omitContactLegacyCustomFormTabUnlessUsed,
  withContactLockedEnabledTabs,
} from "@mms/shared";
import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";

export const fieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withContactLockedEnabledTabs,
  isLockedTab: isContactLockedEnabledTab,
});

export function resolveSetupFormTabs(
  formTabs: TabDefinition[] | undefined,
  fields?: FieldConfig["fields"],
): TabDefinition[] {
  const base = formTabs && formTabs.length > 0 ? formTabs : DEFAULT_FORM_TABS;
  return omitContactLegacyCustomFormTabUnlessUsed(base, fields);
}

export function resolveSetupEnabledTabs(
  formTabs: TabDefinition[] | undefined,
  fields?: FieldConfig["fields"],
): string[] {
  return withContactLockedEnabledTabs(
    resolveSetupFormTabs(formTabs, fields)
      .filter((tab) => tab.enabled !== false)
      .map((tab) => tab.key),
  );
}
