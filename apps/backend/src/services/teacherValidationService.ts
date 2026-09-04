import { type z } from 'zod';
import {
  buildDynamicTeacherSchema,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
  type FieldDefinition,
} from '@mms/shared';
import { loadTeachersSettingsCombined } from './teacherConfigService.js';
import { validateOrThrow } from '../lib/zodRequest.js';

/** Cache compiled schema by tenant + enabled-tabs/fields fingerprint + language. */
const schemaCache = new Map<string, z.ZodTypeAny>();
const SCHEMA_CACHE_MAX_ENTRIES = 100;

function teachersValidationCacheKey(
  tenant: string,
  enabledTabs: string[],
  fields: Record<string, FieldDefinition[]>,
  language: string,
): string {
  return `${tenant}:${enabledTabs.join(',')}:${JSON.stringify(fields)}:${language}`;
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
  const fields = resolveTeacherFieldsMapForColumnSync(settings.fields);
  const enabledTabIds = new Set(resolveTeacherEnabledTabIds(settings));
  const cacheKey = teachersValidationCacheKey(tenant, [...enabledTabIds], fields, language);

  let schema = schemaCache.get(cacheKey);
  if (!schema) {
    schema = buildDynamicTeacherSchema(settings, enabledTabIds, fields, language);
    if (schemaCache.size >= SCHEMA_CACHE_MAX_ENTRIES) {
      const oldestKey = schemaCache.keys().next().value;
      if (oldestKey) schemaCache.delete(oldestKey);
    }
    schemaCache.set(cacheKey, schema);
  }

  validateOrThrow(schema, teacher);
}
