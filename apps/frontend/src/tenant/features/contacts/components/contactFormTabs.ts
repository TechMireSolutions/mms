import {
  DEFAULT_FORM_TABS,
  omitContactLegacyCustomFormTabUnlessUsed,
  type FieldConfig,
  type TabDefinition,
} from "@mms/shared";

/** Base fallback + legacy-custom-tab prune shared by Setup tab resolution. */
export function resolveContactsFormTabsRaw(
  formTabs?: TabDefinition[],
  fields?: FieldConfig["fields"],
): TabDefinition[] {
  return omitContactLegacyCustomFormTabUnlessUsed(
    formTabs && formTabs.length > 0 ? formTabs : DEFAULT_FORM_TABS,
    fields,
  );
}
