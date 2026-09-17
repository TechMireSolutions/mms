import type { AppTranslationKey, FieldDefinition } from "@mms/shared";
import {
  findTeacherSeedField,
  findTeacherTabField,
  teacherColumnLabelKey,
} from "@mms/shared";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";

export { findTeacherTabField };

/** Registry label with seed-label fallback when the seed field is missing from settings. */
export function resolveTeacherFieldLabel(
  fields: Record<string, FieldDefinition[]>,
  tabId: string,
  key: string,
  t: (key: AppTranslationKey) => string,
): string {
  const field = findTeacherTabField(fields, tabId, key);
  if (field) return resolveRegistryLabel(field, t);
  const seedField = findTeacherSeedField(key);
  if (seedField) return resolveRegistryLabel(seedField, t);
  return t(teacherColumnLabelKey(key));
}
