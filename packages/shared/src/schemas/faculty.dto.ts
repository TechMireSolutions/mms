import { z } from 'zod';
import { translateApp } from '../appTranslations.js';
import type { AppTranslationKey } from '../appTranslations.js';
import type { FieldDefinition } from '../contactTypes.js';
import { buildCustomFieldSchema } from '../contactValidation.js';
import { isFacultyLockedEnabledTab } from '../moduleFieldSetupPersons.js';
import {
  listEnabledCustomFacultyFormFields,
  listFacultySystemFormFieldKeys,
} from '../facultyFormCustomFields.js';
import type { FacultySettings } from '../facultyModuleSettings.js';
import { FACULTY_STATUS_WRITE_MAX, facultyCoreSchema } from '../facultyModuleManifest.js';
import { facultyDesignationHoldingsSchema } from '../facultyDesignationTypes.js';
import { stripFacultyWriteNoise } from '../facultyUtils.js';
import { deepSanitizeStrings } from './sanitize.js';

/** Audit / meta keys accepted on faculty writes. */
const FACULTY_WRITE_AUDIT_META_KEYS = ['id', 'userId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'] as const;

/**
 * Top-level keys accepted on faculty form drafts / writes (no Contacts profile dual-write keys).
 */
export const FACULTY_WRITE_SYSTEM_KEYS: readonly string[] = (() => {
  const extra = [
    'customDesignation', 'reportingFacultyId', 'hierarchyRank', 'reportingFacultyName',
    'subordinateCount', 'designationId', 'designationStartsOn', 'designationEndsOn',
    'designations', 'departmentId',
    'reportingRole', 'reportingRoleId', 'reportingDesignationId',
  ];
  const keys = new Set<string>([...FACULTY_WRITE_AUDIT_META_KEYS, ...listFacultySystemFormFieldKeys(), ...extra]);
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
  _settings: FacultySettings,
  enabledTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = 'en',
): z.ZodTypeAny {
  const contactRequiredMsg = translateApp(
    'faculty.errorContactRequired' as AppTranslationKey,
    language,
  );
  const requiredMsg = translateApp('common.formPleaseFixErrors' as AppTranslationKey, language);
  const systemKeys = listFacultySystemFormFieldKeys();

  const schemaObject: Record<string, z.ZodTypeAny> = {
    id: z.union([z.string(), z.number()]).optional(),
    contactId: z.union([z.string(), z.number()]).nullish(),
    employeeId: z.string().nullish(),
    specialization: z.string().nullish(),
    department: z.string().nullish(),
    designation: z.string().nullish(),
    designationId: z.string().nullish(),
    designationStartsOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).nullish().transform((v) => (v === '' ? undefined : v)),
    designationEndsOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).nullable().nullish().transform((v) => (v === '' ? null : v)),
    designations: facultyDesignationHoldingsSchema.optional(),
    departmentId: z.string().nullish(),
    customDesignation: z.string().trim().optional(),
    reportingFacultyId: z.string().nullable().nullish(),
    reportingRole: z.string().nullable().nullish(),
    reportingRoleId: z.string().nullable().nullish(),
    reportingDesignationId: z.string().nullable().nullish(),
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

      if (field.key === 'contactId') continue; // product-compulsory; ignore Setup flags
      if (systemKeys.has(field.key)) {
        if (field.key === 'status') {
          applyRequiredString('status', Boolean(field.required), FACULTY_STATUS_WRITE_MAX);
          continue;
        }
        if (field.key === 'specialization' || field.key === 'qualification') {
          applyRequiredString(field.key, false); // contact-derived
          continue;
        }
        if (
          field.key === 'employeeId'
          || field.key === 'department'
          || field.key === 'designation'
          || field.key === 'joinDate'
          || field.key === 'notes'
        ) {
          applyRequiredString(field.key, Boolean(field.required));
        }
        continue;
      }
      schemaObject[field.key] = buildCustomFieldSchema(field, language);
    }
  });

  for (const field of listEnabledCustomFacultyFormFields(fields)) {
    if (schemaObject[field.key]) continue;
    schemaObject[field.key] = buildCustomFieldSchema(field, language);
  }

  schemaObject.contactId = z
    .union([z.string(), z.number()], { error: contactRequiredMsg })
    .refine(
      (value) => value !== null && value !== undefined && value !== '',
      { message: contactRequiredMsg },
    );

  const objectSchema = z.object(schemaObject).strict().superRefine((data, ctx) => {
    const record = data as Record<string, unknown>;
    const holdings = Array.isArray(record.designations) ? record.designations : null;
    const filledHoldings = (holdings ?? []).filter((row): row is Record<string, unknown> => {
      if (!row || typeof row !== 'object') return false;
      const id = (row as { designationId?: unknown }).designationId;
      return typeof id === 'string' && id.trim().length > 0;
    });
    const hasHolding = filledHoldings.length > 0;
    const designationId = record.designationId;
    const hasLegacyDesignation =
      (typeof designationId === 'string' && designationId.trim().length > 0)
      || (typeof designationId === 'number');
    const hasDesignation = hasHolding || hasLegacyDesignation;
    const topStartsOn = record.designationStartsOn;
    const topStartsOk = typeof topStartsOn === 'string' && topStartsOn.trim().length > 0;
    if (!hasDesignation) return;
    if (hasHolding) {
      filledHoldings.forEach((row, index) => {
        const starts = row.startsOn;
        const rowStartsOk = typeof starts === 'string' && starts.trim().length > 0;
        if (!rowStartsOk && !topStartsOk) {
          ctx.addIssue({
            code: 'custom',
            path: ['designations', index, 'startsOn'],
            message: requiredMsg,
          });
        }
        const departmentId = row.departmentId;
        const rowDeptOk = typeof departmentId === 'string' && departmentId.trim().length > 0;
        const topDept = record.departmentId;
        const topDeptOk = typeof topDept === 'string' && topDept.trim().length > 0;
        if (!rowDeptOk && !topDeptOk) {
          ctx.addIssue({
            code: 'custom',
            path: ['designations', index, 'departmentId'],
            message: requiredMsg,
          });
        }
      });
      return;
    }
    if (!topStartsOk) {
      ctx.addIssue({
        code: 'custom',
        path: ['designationStartsOn'],
        message: requiredMsg,
      });
    }
  });

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


