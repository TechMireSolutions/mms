import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  buildDynamicContactSchema,
} from '@mms/shared';
import { loadContactFieldConfig } from './contactConfigService.js';

// Cache compiled schemas by tenant and active blueprint fingerprint.
const schemaCache = new Map<string, z.ZodTypeAny>();

function getBlueprintCacheKey(tenant: string, fieldConfig: unknown, viewerRole?: string): string {
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(fieldConfig))
    .digest('hex');
  return `${tenant}:${fingerprint}:${viewerRole || ''}`;
}

/**
 * Validates one or more contact records against the current tenant's dynamic field blueprint.
 *
 * @param tenant - The workspace subdomain/tenant.
 * @param contact - The contact record or array of contact records to validate.
 * @param language - Optional language code for error message translation.
 * @param viewerRole - Optional role of the current viewer.
 * @throws {Error} if validation fails.
 */
export async function validateContactDynamic(
  tenant: string,
  contact: unknown,
  language = 'en',
  viewerRole?: string,
): Promise<void> {
  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) {
    return; // No config, nothing to validate.
  }

  // Version Lock check (Rule 16.3 / CS-6)
  let submittedBlueprintId: unknown;
  if (contact && typeof contact === 'object' && !Array.isArray(contact)) {
    submittedBlueprintId = (contact as Record<string, unknown>)._blueprintId;
  }
  if (submittedBlueprintId !== undefined && submittedBlueprintId !== null) {
    if (String(submittedBlueprintId) !== String(fieldConfig.version)) {
      throw new Error(`Blueprint version mismatch. Expected version ${fieldConfig.version}, got ${submittedBlueprintId}. Please reload the form.`);
    }
  }

  const cacheKey = getBlueprintCacheKey(tenant, fieldConfig, viewerRole);
  let schema = schemaCache.get(cacheKey);

  if (!schema) {
    const enabledTabIds = new Set(fieldConfig.enabledTabs || []);
    const requiredTabIds = new Set(fieldConfig.requiredTabs || []);
    const fields = fieldConfig.fields || {};

    schema = buildDynamicContactSchema(
      fieldConfig,
      enabledTabIds,
      requiredTabIds,
      fields,
      language,
      viewerRole,
    );
    schemaCache.set(cacheKey, schema);
  }

  if (Array.isArray(contact)) {
    for (const item of contact) {
      const parsed = schema.safeParse(item);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
      }
    }
  } else {
    const parsed = schema.safeParse(contact);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
  }
}
