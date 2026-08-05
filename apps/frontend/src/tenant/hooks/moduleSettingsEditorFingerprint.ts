import type { FieldDefinition, TabDefinition } from "@mms/shared";

type FieldLike = Pick<
  FieldDefinition,
  "key" | "enabled" | "required" | "unique" | "order" | "type" | "label" | "defaultValue" | "permissions"
>;

function canonicalizeField(field: FieldLike): Record<string, unknown> {
  const canonical: Record<string, unknown> = {
    key: field.key || "",
    enabled: Boolean(field.enabled),
    required: Boolean(field.required),
    unique: Boolean(field.unique),
    order: typeof field.order === "number" ? field.order : 999,
  };
  if (typeof field.type === "string") canonical.type = field.type;
  if (typeof field.label === "string") canonical.label = field.label;
  if (field.defaultValue !== undefined) canonical.defaultValue = field.defaultValue;
  if (Array.isArray(field.permissions)) canonical.permissions = field.permissions;
  return canonical;
}

function canonicalizeFieldsMap(
  fields: Record<string, FieldLike[]> | undefined,
): Record<string, Record<string, unknown>[]> {
  const next: Record<string, Record<string, unknown>[]> = {};
  const tabIds = Object.keys(fields || {}).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
  for (const tabId of tabIds) {
    const list = Array.isArray(fields?.[tabId]) ? fields![tabId]! : [];
    next[tabId.toLowerCase()] = [...list]
      .sort(
        (a, b) =>
          (a.order ?? 999) - (b.order ?? 999) ||
          String(a.key).localeCompare(String(b.key)),
      )
      .map((field, index) => {
        const canonical = canonicalizeField(field);
        canonical.order = index;
        return canonical;
      });
  }
  return next;
}

function canonicalizeFormTabs(
  formTabs: TabDefinition[] | undefined,
): Array<{ key: string; enabled: boolean; label?: string; order: number }> {
  return (formTabs || [])
    .map((tab) => ({
      key: tab.key.toLowerCase(),
      enabled: tab.enabled !== false,
      label: tab.label,
      order: tab.order ?? 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Content fingerprint for fields-editor rehydrate.
 * Same content → same string even when `settings` object identity churns.
 */
export function moduleSettingsEditorFingerprint(input: {
  fields?: Record<string, FieldLike[]>;
  enabledTabs?: string[];
  requiredTabs?: string[];
  formTabs?: TabDefinition[];
  tabRegistry: Array<{ key: string }>;
  resolvedDefaultEnabledTabs: string[];
  defaultRequiredTabs?: string[];
}): string {
  const enabledSource =
    input.enabledTabs && input.enabledTabs.length > 0
      ? input.enabledTabs
      : input.resolvedDefaultEnabledTabs;
  const enabled = [...enabledSource]
    .map((tabId) => tabId.trim().toLowerCase())
    .filter(Boolean)
    .sort();
  const required = [...(input.requiredTabs || input.defaultRequiredTabs || [])]
    .map((tabId) => tabId.toLowerCase())
    .sort();
  const registry = input.tabRegistry
    .map((tab) => tab.key.toLowerCase())
    .sort();

  return JSON.stringify({
    fields: canonicalizeFieldsMap(input.fields),
    enabled,
    required,
    formTabs: canonicalizeFormTabs(input.formTabs),
    registry,
  });
}
