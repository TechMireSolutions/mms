import { z } from 'zod';
import { translateApp } from './appTranslations.js';
import type { AppTranslationKey } from './appTranslations.js';
import type { FieldDefinition } from './contactTypes.js';
import { buildCustomFieldSchema, type ValidationError } from './contactValidation.js';
import { isTeacherLockedEnabledTab } from './moduleFieldSetupPersons.js';
import {
  findTeacherFieldInMap,
  listEnabledCustomTeacherFormFields,
  listTeacherSystemFormFieldKeys,
} from './teacherFormCustomFields.js';
import type { TeachersSettings } from './teachersModuleSettings.js';
import { TEACHER_STATUS_WRITE_MAX } from './teachersModuleManifest.js';
import { stripTeacherWriteNoise } from './teacherUtils.js';

export {
  TEACHER_WRITE_SYSTEM_KEYS,
  collectTeacherWriteExtraFieldKeys,
  buildDynamicTeacherSchema,
} from './schemas/teachers.dto.js';

/**
 * Translates Zod validation errors into structured field errors for the Teachers form.
 */
export function formatTeacherZodIssues(
  error: z.ZodError,
  _data: unknown,
  fields: Record<string, FieldDefinition[]>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const issue of error.issues) {
    const fieldId = String(issue.path[0] ?? '');
    let tabId = 'basic';
    for (const [candidateTabId, tabFields] of Object.entries(fields)) {
      if (tabFields.some((field) => field.key === fieldId)) {
        tabId = candidateTabId;
        break;
      }
    }
    errors.push({ fieldId, tabId, message: issue.message });
  }
  return errors;
}
