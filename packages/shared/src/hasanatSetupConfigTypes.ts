import { z } from 'zod';
import type { TabDefinition } from './contactTypes.js';
import { DEFAULT_HASANAT_SETTINGS, type HasanatSettings } from './hasanatModuleSettings.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';


/** PUT /api/hasanat/field-config — field registry JSON without prefs keys. */
export const hasanatFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
    fieldOrder: z.array(z.string()).optional(),
    formTabs: z.array(z.record(z.string(), z.unknown())).optional(),
    enabledTabs: z.array(z.string()).optional(),
    requiredTabs: z.array(z.string()).optional(),
  })
  .passthrough();

/** PUT /api/hasanat/preferences — hasanat prefs only. */
export const hasanatPreferencesPutBodySchema = z
  .object({
    pointsPerUnit: z.number().optional(),
    autoApprovePayouts: z.boolean().optional(),
    defaultViewLayout: z.string().optional(),
  })
  .passthrough();

/** Typed preference state extracted from legacy HasanatSettings. */
export interface HasanatModulePreferences {
  pointsPerUnit: number;
  autoApprovePayouts: boolean;
  defaultViewLayout: string;
}

/** Extracts preferences slice from a raw composed settings blob. */
export function normalizeHasanatModulePreferences(
  raw: unknown
): HasanatModulePreferences {
  if (!raw || typeof raw !== 'object') {
    return {
      pointsPerUnit: DEFAULT_HASANAT_SETTINGS.pointsPerUnit,
      autoApprovePayouts: DEFAULT_HASANAT_SETTINGS.autoApprovePayouts,
      defaultViewLayout: DEFAULT_HASANAT_SETTINGS.defaultViewLayout || 'list',
    };
  }

  const prefs = raw as Partial<HasanatModulePreferences>;
  return {
    pointsPerUnit: typeof prefs.pointsPerUnit === 'number' ? prefs.pointsPerUnit : DEFAULT_HASANAT_SETTINGS.pointsPerUnit,
    autoApprovePayouts: typeof prefs.autoApprovePayouts === 'boolean' ? prefs.autoApprovePayouts : DEFAULT_HASANAT_SETTINGS.autoApprovePayouts,
    defaultViewLayout: typeof prefs.defaultViewLayout === 'string' ? prefs.defaultViewLayout : DEFAULT_HASANAT_SETTINGS.defaultViewLayout || 'list',
  };
}

/** Extracts field-config slice from a raw composed settings blob. */
export function normalizeHasanatSettings(raw: unknown): HasanatSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_HASANAT_SETTINGS };
  }

  const safe = raw as Partial<HasanatSettings>;
  return {
    pointsPerUnit: DEFAULT_HASANAT_SETTINGS.pointsPerUnit, // managed by preferences
    autoApprovePayouts: DEFAULT_HASANAT_SETTINGS.autoApprovePayouts, // managed by preferences
    defaultViewLayout: DEFAULT_HASANAT_SETTINGS.defaultViewLayout, // managed by preferences
    fields: safe.fields ?? DEFAULT_HASANAT_SETTINGS.fields ?? {},
    customFields: safe.customFields ?? DEFAULT_HASANAT_SETTINGS.customFields ?? [],
    fieldOrder: safe.fieldOrder ?? DEFAULT_HASANAT_SETTINGS.fieldOrder ?? [],
    formTabs: safe.formTabs,
    enabledTabs: safe.enabledTabs,
    requiredTabs: safe.requiredTabs,
  };
}

/** Recomposes preferences and field-config into the legacy flat settings shape. */
export function composeHasanatSettings(
  fieldConfig: HasanatSettings | null,
  prefs: HasanatModulePreferences,
  formTabs?: TabDefinition[]
): HasanatSettings {
  return {
    ...(fieldConfig ?? DEFAULT_HASANAT_SETTINGS),
    pointsPerUnit: prefs.pointsPerUnit,
    autoApprovePayouts: prefs.autoApprovePayouts,
    defaultViewLayout: prefs.defaultViewLayout,
    formTabs: formTabs ?? fieldConfig?.formTabs,
  };
}

/** Drops preference keys before saving field-config to avoid overriding prefs layer. */
export function stripHasanatFieldConfigForPersist(
  config: Partial<HasanatSettings>
): Partial<HasanatSettings> {
  const { pointsPerUnit, autoApprovePayouts, defaultViewLayout, ...fieldConfigOnly } = config;
  return fieldConfigOnly;
}

import { HASANAT_TAB_REGISTRY } from './moduleFieldSetupFinance.js';

export function mergeHasanatFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0 ? documentFormTabs : [...HASANAT_TAB_REGISTRY];
  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...HASANAT_TAB_REGISTRY.filter(
            (seedTab: TabDefinition) => !apiTabs.some((apiTab) => apiTab.key === seedTab.key),
          ),
        ];
  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (!tab?.key || seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}
