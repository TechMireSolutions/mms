import { z } from 'zod';
import { translateApp } from '../appTranslations.js';
import type { AppTranslationKey } from '../appTranslations.js';
import type { FieldDefinition } from '../contactTypes.js';
import { buildCustomFieldSchema } from '../contactValidation.js';
import { isTeacherLockedEnabledTab } from '../moduleFieldSetupPersons.js';
import {
  findTeacherFieldInMap,
  listEnabledCustomTeacherFormFields,
  listTeacherSystemFormFieldKeys,
} from '../teacherFormCustomFields.js';
import type { TeachersSettings } from '../teachersModuleSettings.js';
import { TEACHER_STATUS_WRITE_MAX } from '../teachersModuleManifest.js';
import { stripTeacherWriteNoise } from '../teacherUtils.js';
import { deepSanitizeStrings } from './sanitize.js';

/** Audit / meta keys accepted on teacher writes beyond {@link INITIAL_TEACHERS_FIELD_SEED}. */
const TEACHER_WRITE_AUDIT_META_KEYS = [
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
] as const;

/**
 * Top-level keys accepted on teacher form drafts / writes (no Contacts profile dual-write keys).
 * Derived from seed system keys + fixed audit/meta keys so schema/seed cannot drift.
 */
export const TEACHER_WRITE_SYSTEM_KEYS: readonly string[] = (() => {
  const keys = new Set<string>(TEACHER_WRITE_AUDIT_META_KEYS);
  for (const key of listTeacherSystemFormFieldKeys()) {
    keys.add(key);
  }
  return [...keys].sort((left, right) => left.localeCompare(right));
})();

const TEACHER_WRITE_SYSTEM_KEY_SET = new Set<string>(TEACHER_WRITE_SYSTEM_KEYS);

/** Enabled Setup custom field keys beyond the system teacher model. */
export function collectTeacherWriteExtraFieldKeys(
  fields: Record<string, FieldDefinition[]> | null | undefined,
): string[] {
  if (!fields) return [];
  return listEnabledCustomTeacherFormFields(fields)
    .map((field) => field.key)
    .filter((key) => !TEACHER_WRITE_SYSTEM_KEY_SET.has(key));
}

/**
 * Compiles a Zod validation schema for teacher form drafts / writes.
 * System keys + enabled registry customs; unknown keys rejected via `.strict()`.
 * Contact profile dual-write keys are stripped in preprocess (Contacts SSOT).
 */
export function buildDynamicTeacherSchema(
  settings: TeachersSettings,
  enabledTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = 'en',
): z.ZodTypeAny {
  const contactRequiredMsg = translateApp(
    'teachers.errorContactRequired' as AppTranslationKey,
    language,
  );
  const requiredMsg = translateApp('common.formPleaseFixErrors' as AppTranslationKey, language);
  const systemKeys = listTeacherSystemFormFieldKeys();
  const requireContactLink = settings.requireContactLink !== false;

  const schemaObject: Record<string, z.ZodTypeAny> = {
    id: z.union([z.string(), z.number()]).optional(),
    contactId: z.union([z.string(), z.number()]).nullish(),
    employeeId: z.string().nullish(),
    specialization: z.string().nullish(),
    status: z.string().max(TEACHER_STATUS_WRITE_MAX).nullish(),
    joinDate: z.string().nullish(),
    qualification: z.string().nullish(),
    notes: z.string().nullish(),
    userId: z.string().nullable().nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
    createdBy: z.string().nullish(),
    updatedBy: z.string().nullish(),
  };

  const applyRequiredString = (key: string, required: boolean, max?: number) => {
    if (required) {
      let schema = z.string({ message: requiredMsg });
      if (max != null) schema = schema.max(max);
      schemaObject[key] = schema.min(1, requiredMsg);
      return;
    }
    schemaObject[key] =
      max != null ? z.string().max(max).nullish() : z.string().nullish();
  };

  Object.entries(fields).forEach(([tabId, tabFields]) => {
    if (!isTeacherLockedEnabledTab(tabId) && !enabledTabIds.has(tabId)) return;

    for (const field of tabFields) {
      if (!field.enabled) continue;

      if (field.key === 'contactId') {
        const required = requireContactLink || Boolean(field.required);
        if (required) {
          schemaObject.contactId = z
            .union([z.string(), z.number()], { error: contactRequiredMsg })
            .refine(
              (value) => value !== null && value !== undefined && value !== '',
              { message: contactRequiredMsg },
            );
        }
        continue;
      }

      if (systemKeys.has(field.key)) {
        if (field.key === 'status') {
          applyRequiredString('status', Boolean(field.required), TEACHER_STATUS_WRITE_MAX);
          continue;
        }
        if (
          field.key === 'employeeId'
          || field.key === 'specialization'
          || field.key === 'qualification'
          || field.key === 'joinDate'
          || field.key === 'notes'
        ) {
          applyRequiredString(field.key, Boolean(field.required));
          continue;
        }
        continue;
      }

      schemaObject[field.key] = buildCustomFieldSchema(field, language);
    }
  });

  // Customs enabled outside the tab loop (when flat legacy maps omit tab arrays of customs).
  for (const field of listEnabledCustomTeacherFormFields(fields)) {
    if (schemaObject[field.key]) continue;
    schemaObject[field.key] = buildCustomFieldSchema(field, language);
  }

  // When requireContactLink and contactId field is missing/disabled, still enforce link.
  if (requireContactLink) {
    const contactField = findTeacherFieldInMap(fields, 'contactId');
    if (!contactField || contactField.enabled !== false) {
      schemaObject.contactId = z
        .union([z.string(), z.number()], { error: contactRequiredMsg })
        .refine(
          (value) => value !== null && value !== undefined && value !== '',
          { message: contactRequiredMsg },
        );
    }
  }

  const objectSchema = z.object(schemaObject).strict();

  return z.preprocess((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const stripped = stripTeacherWriteNoise(raw as Record<string, unknown>);
    return deepSanitizeStrings(stripped);
  }, objectSchema);
}

const teachersDuplicateCheckBodyBaseSchema = z.object({
  excludeId: z.string().optional(),
  contactId: z.union([z.string(), z.number()]).optional(),
  employeeId: z.string().max(64).optional(),
}).strict();

export const teachersDuplicateCheckBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, teachersDuplicateCheckBodyBaseSchema);
