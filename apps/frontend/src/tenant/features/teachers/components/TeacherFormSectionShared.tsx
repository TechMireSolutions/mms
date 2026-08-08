import type { AppTranslationKey, FieldDefinition } from "@mms/shared";
import { findTeacherTabField } from "@mms/shared";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";

export { findTeacherTabField };

/** Registry label with form-copy fallback when the seed field is missing from settings. */
export function resolveTeacherFieldLabel(
  fields: Record<string, FieldDefinition[]>,
  tabId: string,
  key: string,
  fallbackKey: AppTranslationKey,
  t: (key: AppTranslationKey) => string,
): string {
  const field = findTeacherTabField(fields, tabId, key);
  return field ? resolveRegistryLabel(field, t) : t(fallbackKey);
}
