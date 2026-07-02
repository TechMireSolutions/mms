import { z } from 'zod';
import {
  buildDynamicStudentSchema,
  type StudentsSettings,
} from '@mms/shared';
import { fetchObject } from './dbSyncService.js';

const CONFIG_KEY = 'students_settings';

// Cache compiled schema by tenant and config version: `${tenant}:${configVersion}`
const schemaCache = new Map<string, z.ZodTypeAny>();

/**
 * Validates one or more student records against the current tenant's dynamic field blueprint.
 *
 * @param tenant - The workspace subdomain/tenant.
 * @param student - The student record or array of student records to validate.
 * @param language - Optional language code for error message translation.
 * @throws {Error} if validation fails.
 */
export async function validateStudentDynamic(
  tenant: string,
  student: unknown,
  language = 'en',
): Promise<void> {
  const raw = await fetchObject(CONFIG_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return; // No config, nothing to validate.
  }
  const settings = raw as StudentsSettings;

  // Version Lock check (Rule 16.3 / CS-6)
  const submittedBlueprintId = (student as any)?._blueprintId;
  if (submittedBlueprintId !== undefined && submittedBlueprintId !== null) {
    if (String(submittedBlueprintId) !== String(settings.version)) {
      throw new Error(`Blueprint version mismatch. Expected version ${settings.version}, got ${submittedBlueprintId}. Please reload the form.`);
    }
  }

  const cacheKey = `${tenant}:${settings.version || 0}`;
  let schema = schemaCache.get(cacheKey);

  if (!schema) {
    const enabledTabIds = new Set(settings.enabledTabs || []);
    const requiredTabIds = new Set(settings.requiredTabs || []);
    const fields = settings.fields || {};

    schema = buildDynamicStudentSchema(
      settings,
      enabledTabIds,
      requiredTabIds,
      fields,
      language,
    );
    schemaCache.set(cacheKey, schema);
  }

  if (Array.isArray(student)) {
    for (const item of student) {
      const parsed = schema.safeParse(item);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
      }
    }
  } else {
    const parsed = schema.safeParse(student);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
  }
}
