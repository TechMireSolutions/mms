import { z } from 'zod';
import { translateApp } from '../appTranslations.js';
import type { AppTranslationKey } from '../appTranslations.js';
import type { FieldDefinition } from '../contactTypes.js';
import { buildCustomFieldSchema } from '../contactValidation.js';
import { isFacultyLockedEnabledTab } from '../moduleFieldSetupPersons.js';
import {
  findFacultyFieldInMap,
  listEnabledCustomFacultyFormFields,
  listFacultySystemFormFieldKeys,
} from '../facultyFormCustomFields.js';
import type { FacultySettings } from '../facultyModuleSettings.js';
import { FACULTY_STATUS_WRITE_MAX, facultyCoreSchema } from '../facultyModuleManifest.js';
import { stripFacultyWriteNoise } from '../facultyUtils.js';
import { deepSanitizeStrings } from './sanitize.js';

/** Audit / meta keys accepted on faculty writes. */
const FACULTY_WRITE_AUDIT_META_KEYS = [
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
] as const;

/**
 * Top-level keys accepted on faculty form drafts / writes (no Contacts profile dual-write keys).
 */
export const FACULTY_WRITE_SYSTEM_KEYS: readonly string[] = (() => {
  const keys = new Set<string>(FACULTY_WRITE_AUDIT_META_KEYS);
  for (const key of listFacultySystemFormFieldKeys()) {
    keys.add(key);
  }
  keys.add('customDesignation');
  keys.add('reportingFacultyId');
  keys.add('hierarchyRank');
  keys.add('reportingFacultyName');
  keys.add('subordinateCount');
  return [...keys].sort((left, right) => left.localeCompare(right));
})();

const FACULTY_WRITE_SYSTEM_KEY_SET = new Set<string>(FACULTY_WRITE_SYSTEM_KEYS);

/** Enabled Setup custom field keys beyond the system faculty model. */
export function collectFacultyWriteExtraFieldKeys(
  fields: Record<string, FieldDefinition[]> | null | undefined,
): string[] {
  if (!fields) return [];
  return listEnabledCustomFacultyFormFields(fields)
    .map((field) => field.key)
    .filter((key) => !FACULTY_WRITE_SYSTEM_KEY_SET.has(key));
}

/**
 * Compiles a Zod validation schema for faculty form drafts / writes.
 * System keys + enabled registry customs; unknown keys rejected via `.strict()`.
 * Contact profile dual-write keys are stripped in preprocess (Contacts SSOT).
 */
export function buildDynamicFacultySchema(
  settings: FacultySettings,
  enabledTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = 'en',
): z.ZodTypeAny {
  const contactRequiredMsg = translateApp(
    'faculty.errorContactRequired' as AppTranslationKey,
    language,
  ) || translateApp('teachers.errorContactRequired' as AppTranslationKey, language);
  const requiredMsg = translateApp('common.formPleaseFixErrors' as AppTranslationKey, language);
  const systemKeys = listFacultySystemFormFieldKeys();
  const requireContactLink = settings.requireContactLink !== false;

  const schemaObject: Record<string, z.ZodTypeAny> = {
    id: z.union([z.string(), z.number()]).optional(),
    contactId: z.union([z.string(), z.number()]).nullish(),
    employeeId: z.string().nullish(),
    specialization: z.string().nullish(),
    department: z.string().nullish(),
    designation: z.string().nullish(),
    customDesignation: z.string().trim().optional(),
    reportingFacultyId: z.string().nullable().nullish(),
    hierarchyRank: z.coerce.number().int().min(1).max(99).nullish(),
    reportingFacultyName: z.string().nullish(),
    subordinateCount: z.coerce.number().int().min(0).nullish(),
    status: z.string().max(FACULTY_STATUS_WRITE_MAX).nullish(),
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
    if (!isFacultyLockedEnabledTab(tabId) && !enabledTabIds.has(tabId)) return;

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
          applyRequiredString('status', Boolean(field.required), FACULTY_STATUS_WRITE_MAX);
          continue;
        }
        if (
          field.key === 'employeeId'
          || field.key === 'specialization'
          || field.key === 'department'
          || field.key === 'designation'
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
  for (const field of listEnabledCustomFacultyFormFields(fields)) {
    if (schemaObject[field.key]) continue;
    schemaObject[field.key] = buildCustomFieldSchema(field, language);
  }

  // When requireContactLink and contactId field is missing/disabled, still enforce link.
  if (requireContactLink) {
    const contactField = findFacultyFieldInMap(fields, 'contactId');
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
    const stripped = stripFacultyWriteNoise(raw as Record<string, unknown>);
    return deepSanitizeStrings(stripped);
  }, objectSchema);
}

const facultyDuplicateCheckBodyBaseSchema = z.object({
  excludeId: z.string().optional(),
  contactId: z.union([z.string(), z.number()]).optional(),
  employeeId: z.string().max(64).optional(),
}).strict();

export type FacultyDuplicateCheckBody = z.infer<typeof facultyDuplicateCheckBodyBaseSchema>;

export const facultyDuplicateCheckBodySchema: z.ZodType<FacultyDuplicateCheckBody> = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, facultyDuplicateCheckBodyBaseSchema);

export const facultyWriteSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const stripped = stripFacultyWriteNoise(raw as Record<string, unknown>);
  return deepSanitizeStrings(stripped);
}, facultyCoreSchema);

export type FacultyWrite = z.infer<typeof facultyWriteSchema>;

/* Backward compatibility aliases */
export const TEACHER_WRITE_SYSTEM_KEYS = FACULTY_WRITE_SYSTEM_KEYS;
export const collectTeacherWriteExtraFieldKeys = collectFacultyWriteExtraFieldKeys;
export const buildDynamicTeacherSchema = buildDynamicFacultySchema;
export type TeachersDuplicateCheckBody = FacultyDuplicateCheckBody;
export const teachersDuplicateCheckBodySchema = facultyDuplicateCheckBodySchema;
export const teacherWriteSchema = facultyWriteSchema;
export type TeacherWrite = FacultyWrite;
