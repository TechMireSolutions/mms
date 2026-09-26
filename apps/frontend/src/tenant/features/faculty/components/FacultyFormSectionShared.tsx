import type { AppTranslationKey, FieldDefinition } from "@mms/shared";
import {
  findFacultySeedField,
  findFacultyTabField,
  facultyColumnLabelKey,
  findTeacherTabField,
} from "@mms/shared";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";

export { findTeacherTabField };

/** Registry label with seed-label fallback when the seed field is missing from settings. */
export function resolveFacultyFieldLabel(
  fields: Record<string, FieldDefinition[]>,
  tabId: string,
  key: string,
  t: (key: AppTranslationKey) => string,
): string {
  const field = findFacultyTabField(fields, tabId, key);
  if (field) return resolveRegistryLabel(field, t);
  const seedField = findFacultySeedField(key);
  if (seedField) return resolveRegistryLabel(seedField, t);
  return t(facultyColumnLabelKey(key));
}

export const resolveTeacherFieldLabel = resolveFacultyFieldLabel;

