import {
  type FieldConfig,
  type FieldDefinition,
  type TabDefinition,
  DEFAULT_FORM_TABS,
  isContactLockedEnabledTab,
  omitContactLegacyCustomFormTabUnlessUsed,
  withContactLockedEnabledTabs,
} from "@mms/shared";

/** Stable field shape for dirty detection — ignores undefined vs false noise from buildFieldsMap. */
function canonicalizeField(field: FieldDefinition): Record<string, unknown> {
  const key = field.key || "";
  const canonical: Record<string, unknown> = {
    key,
    enabled: Boolean(field.enabled),
    required: Boolean(field.required),
    unique: Boolean(field.unique),
    order: typeof field.order === "number" ? field.order : 999,
  };
  if (typeof field.label === "string") canonical.label = field.label;
  if (typeof field.labelKey === "string") canonical.labelKey = field.labelKey;
  if (typeof field.type === "string") canonical.type = field.type;
  if (typeof field.description === "string") canonical.description = field.description;
  if (typeof field.descriptionKey === "string") canonical.descriptionKey = field.descriptionKey;
  if (Array.isArray(field.options)) canonical.options = field.options;
  if (field.defaultValue !== undefined) canonical.defaultValue = field.defaultValue;
  if (Array.isArray(field.permissions)) canonical.permissions = field.permissions;
  if (typeof field.placeholder === "string") canonical.placeholder = field.placeholder;
  return canonical;
}

function fieldsForTab(
  fields: FieldConfig["fields"] | undefined,
  tabKey: string,
): FieldDefinition[] {
  const source = fields || {};
  const direct = source[tabKey];
  if (Array.isArray(direct)) return direct;
  const lower = tabKey.toLowerCase();
  for (const [key, list] of Object.entries(source)) {
    if (key.toLowerCase() === lower && Array.isArray(list)) return list;
  }
  return [];
}

/** Only form-tab fields; orphan config.fields tabs are ignored (buildFieldsMap drops them). */
function canonicalizeFieldsMap(
  fields: FieldConfig["fields"] | undefined,
  formTabs: TabDefinition[],
): Record<string, Record<string, unknown>[]> {
  const next: Record<string, Record<string, unknown>[]> = {};
  const tabs = [...formTabs].sort((a, b) =>
    a.key.toLowerCase().localeCompare(b.key.toLowerCase()),
  );
  for (const tab of tabs) {
    const tabKey = tab.key.toLowerCase();
    next[tabKey] = fieldsForTab(fields, tab.key)
      .slice()
      .sort(
        (a, b) =>
          (a.order ?? 999) - (b.order ?? 999) ||
          String(a.key).localeCompare(String(b.key)),
      )
      .map((field, index) => {
        const canonical = canonicalizeField(field);
        // Relative order only — buildFieldsMap rewrites absolute order to 0..n.
        canonical.order = index;
        return canonical;
      });
  }
  return next;
}

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
    fields: canonicalizeFieldsMap(input.fields, input.formTabs),
    enabled,
    required,
    formTabs,
  });
}

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
