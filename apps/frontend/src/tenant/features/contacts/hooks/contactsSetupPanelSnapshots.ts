import {
  type FieldConfig,
  type TabDefinition,
  isContactLockedEnabledTab,
  withContactLockedEnabledTabs,
} from "@mms/shared";
import { createFieldsSetupSnapshot } from "@/lib/setup/createFieldsSetupSnapshot";
import { resolveContactsFormTabsRaw } from "@/tenant/features/contacts/components/contactFormTabs";

export const fieldsSetupSnapshot = createFieldsSetupSnapshot({
  withLockedEnabledTabs: withContactLockedEnabledTabs,
  isLockedTab: isContactLockedEnabledTab,
});

export function resolveSetupFormTabs(
  formTabs: TabDefinition[] | undefined,
  fields?: FieldConfig["fields"],
): TabDefinition[] {
  return resolveContactsFormTabsRaw(formTabs, fields);
}

export function resolveSetupEnabledTabs(
  formTabs: TabDefinition[] | undefined,
  fields?: FieldConfig["fields"],
): string[] {
  return withContactLockedEnabledTabs(
    resolveContactsFormTabsRaw(formTabs, fields)
      .filter((tab) => tab.enabled !== false)
      .map((tab) => tab.key),
  );
}
