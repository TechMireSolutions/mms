import { z } from 'zod';
import {
  buildDynamicTeacherSchema,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
  type FieldDefinition,
} from '@mms/shared';
import { loadTeachersSettingsCombined } from './teacherConfigService.js';
import { validateOrThrow } from '../lib/zodRequest.js';

/** Cache compiled schema by tenant + enabled-tabs/fields fingerprint. */
const schemaCache = new Map<string, z.ZodTypeAny>();

function teachersValidationCacheKey(
  tenant: string,
  enabledTabs: string[],
  fields: Record<string, FieldDefinition[]>,
): string {
  return `${tenant}:${enabledTabs.join(',')}:${JSON.stringify(fields)}`;
}

/**
 * Validates one teacher write payload against the tenant's dynamic Fields registry.
 * @throws {Error} when validation fails
 */
export async function validateTeacherDynamic(
  tenant: string,
  teacher: unknown,
  language = 'en',
): Promise<void> {
  const settings = await loadTeachersSettingsCombined();
  const fields = resolveTeacherFieldsMapForColumnSync(
    settings.fields as Record<string, unknown> | undefined,
  );
  const enabledTabIds = new Set(resolveTeacherEnabledTabIds(settings));
  const cacheKey = teachersValidationCacheKey(tenant, [...enabledTabIds], fields);

  let schema = schemaCache.get(cacheKey);
  if (!schema) {
    schema = buildDynamicTeacherSchema(settings, enabledTabIds, fields, language);
    schemaCache.set(cacheKey, schema);
  }

  validateOrThrow(schema, teacher);
}
