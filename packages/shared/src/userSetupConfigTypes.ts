import { z } from 'zod';
import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import {
  DEFAULT_USERS_SETTINGS,
  type UsersSettings,
} from './usersModuleSettings.js';
import { USERS_TAB_REGISTRY } from './moduleFieldSetupPersons.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';
import type { WorkspaceRole } from './userEntityTypes.js';

/** PUT /api/users/field-config — field registry JSON without formTabs SSOT. */
export const userFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    columnRegistry: z.array(z.record(z.string(), z.unknown())).optional(),
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

/** PUT /api/users/preferences — registration policy + workspace roles. */
export const userPreferencesPutBodySchema = z
  .object({
    allowSelfRegistration: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    defaultViewLayout: z.string().optional(),
    workspaceRoles: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

export type UserModulePreferences = Pick<
  UsersSettings,
  | 'allowSelfRegistration'
  | 'requireEmailVerification'
  | 'defaultViewLayout'
  | 'workspaceRoles'
>;

const PREF_KEYS = [
  'allowSelfRegistration',
  'requireEmailVerification',
  'defaultViewLayout',
  'workspaceRoles',
] as const;

function normalizeWorkspaceRoles(raw: unknown): WorkspaceRole[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const roles = raw.filter(
    (role): role is WorkspaceRole =>
      !!role && typeof role === 'object' && !Array.isArray(role) && typeof (role as { id?: unknown }).id === 'string',
  );
  return roles.length > 0 ? roles : undefined;
}

/** Normalize Users module preferences (typed `user_module_preferences`). */
export function normalizeUserModulePreferences(
  partial?: Partial<UserModulePreferences> | Record<string, unknown> | null,
): UserModulePreferences {
  const defaults: UserModulePreferences = {
    allowSelfRegistration: DEFAULT_USERS_SETTINGS.allowSelfRegistration,
    requireEmailVerification: DEFAULT_USERS_SETTINGS.requireEmailVerification,
    defaultViewLayout: DEFAULT_USERS_SETTINGS.defaultViewLayout,
    workspaceRoles: DEFAULT_USERS_SETTINGS.workspaceRoles,
  };
  if (!partial || typeof partial !== 'object') return { ...defaults };

  const workspaceRoles = normalizeWorkspaceRoles(partial.workspaceRoles);

  return {
    allowSelfRegistration:
      typeof partial.allowSelfRegistration === 'boolean'
        ? partial.allowSelfRegistration
        : defaults.allowSelfRegistration,
    requireEmailVerification:
      typeof partial.requireEmailVerification === 'boolean'
        ? partial.requireEmailVerification
        : defaults.requireEmailVerification,
    defaultViewLayout:
      typeof partial.defaultViewLayout === 'string' && partial.defaultViewLayout.trim()
        ? partial.defaultViewLayout.trim()
        : defaults.defaultViewLayout,
    workspaceRoles: workspaceRoles ?? defaults.workspaceRoles,
  };
}

/** Field-config slice persisted on `user_field_configs` (never formTabs / module prefs). */
export function stripUserFieldConfigForPersist(
  config: UsersSettings | Record<string, unknown>,
): Record<string, unknown> {
  const {
    formTabs: _formTabs,
    allowSelfRegistration: _allowSelfRegistration,
    requireEmailVerification: _requireEmailVerification,
    defaultViewLayout: _defaultViewLayout,
    workspaceRoles: _workspaceRoles,
    ...rest
  } = config as UsersSettings & Record<string, unknown>;
  return rest;
}

/** Normalize UsersSettings from typed REST or legacy document blobs. */
export function normalizeUsersSettings(config: unknown): UsersSettings {
  const defaults = { ...DEFAULT_USERS_SETTINGS, formTabs: [...USERS_TAB_REGISTRY] };
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ...defaults };
  }
  const raw = config as Record<string, unknown>;
  const prefs = normalizeUserModulePreferences(raw);
  return {
    ...defaults,
    ...(raw as Partial<UsersSettings>),
    ...prefs,
    customFields: Array.isArray(raw.customFields)
      ? (raw.customFields as UsersSettings['customFields'])
      : defaults.customFields,
    fieldOrder: Array.isArray(raw.fieldOrder)
      ? (raw.fieldOrder as string[])
      : defaults.fieldOrder,
    formTabs: Array.isArray(raw.formTabs)
      ? (raw.formTabs as TabDefinition[])
      : defaults.formTabs,
    enabledTabs: Array.isArray(raw.enabledTabs)
      ? (raw.enabledTabs as string[])
      : (raw.enabledTabs as string[] | undefined),
    requiredTabs: Array.isArray(raw.requiredTabs)
      ? (raw.requiredTabs as string[])
      : (raw.requiredTabs as string[] | undefined),
    fields:
      raw.fields && typeof raw.fields === 'object' && !Array.isArray(raw.fields)
        ? (raw.fields as UsersSettings['fields'])
        : defaults.fields,
  };
}

/** Split a legacy `users_settings` blob into typed field-config + preferences rows. */
export function splitUsersSettingsBlob(raw: unknown): {
  fieldConfig: Record<string, unknown>;
  preferences: UserModulePreferences;
} {
  const settings = normalizeUsersSettings(raw);
  return {
    fieldConfig: stripUserFieldConfigForPersist(settings),
    preferences: normalizeUserModulePreferences(settings),
  };
}

/** Compose FE/validation UsersSettings from typed parts (+ optional custom tabs). */
export function composeUsersSettings(
  fieldConfig: unknown,
  preferences: unknown,
  formTabs?: TabDefinition[],
): UsersSettings {
  const prefs = normalizeUserModulePreferences(
    preferences as Partial<UserModulePreferences> | null,
  );
  return normalizeUsersSettings({
    ...(fieldConfig && typeof fieldConfig === 'object' && !Array.isArray(fieldConfig)
      ? (fieldConfig as Record<string, unknown>)
      : {}),
    ...prefs,
    ...(formTabs ? { formTabs } : {}),
  });
}

/**
 * Merge API custom_tabs with document/default form tabs for Users Setup/forms.
 */
export function mergeUsersFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
  _fields?: Record<string, FieldDefinition[]> | undefined,
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0
      ? documentFormTabs
      : [...USERS_TAB_REGISTRY];

  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...USERS_TAB_REGISTRY.filter(
            (seedTab) => !apiTabs.some((apiTab) => apiTab.key === seedTab.key),
          ),
        ];

  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (!tab?.key || seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}

export { PREF_KEYS as USER_MODULE_PREFERENCE_KEYS };
