import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getFlatFieldsConfig,
  getSortedFields,
  mergeTabbedFields,
  type ModuleCustomField,
  type ModuleFieldDef,
} from "@mms/shared";

/** Structural settings shape shared by the standard-module config hooks. */
export interface StandardModuleConfigSettingsLike {
  fields?: Record<string, unknown>;
  customFields?: ModuleCustomField[] | unknown[];
  fieldOrder?: string[];
  formTabs?: unknown[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

/** Shared core slice handed to the optional `useEnhance` composer. */
export interface StandardModuleConfigCore<
  TSettings extends StandardModuleConfigSettingsLike,
> {
  settings: TSettings;
  orderedFields: ModuleFieldDef[];
  fields: Record<string, { enabled: boolean; required: boolean }>;
  customFields: ModuleCustomField[];
  updateSettings: (draft: TSettings) => void;
  updateSettingsAsync: (draft: TSettings) => Promise<void>;
  reloadConfig: () => void;
  mergeSettings: (draft: Partial<TSettings> | null | undefined) => TSettings;
  loadSettings: () => TSettings;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
}

export interface CreateStandardModuleConfigHookOptions<
  TSettings extends StandardModuleConfigSettingsLike,
  TExtra extends Record<string, unknown>,
> {
  defaultSettings: TSettings;
  defaultFieldDefs: ModuleFieldDef[];
  useComposedSettings: () => TSettings;
  useFieldConfigMutation: () => {
    mutateAsync: (payload: TSettings) => Promise<unknown>;
  };
  usePreferencesMutation: () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  };
  setFieldConfigMemory: (settings: TSettings) => void;
  setPreferencesMemory: (prefs: unknown) => void;
  fieldConfigQueryKey: readonly unknown[];
  preferencesQueryKey: readonly unknown[];
  normalizeSettings: (settings: unknown) => TSettings;
  normalizePrefs: (settings: TSettings) => unknown;
  composeSettings: (settings: unknown, prefs: unknown, formTabs?: unknown[]) => TSettings;
  /** Teachers derives custom fields from the tabbed field seed instead of `settings.customFields`. */
  customFieldsFrom?: (settings: TSettings) => ModuleCustomField[];
  /** Teachers sorts with `getSortedTeacherFields` instead of the shared `getSortedFields`. */
  orderedFieldsFrom?: (ctx: { fieldOrder: string[]; settings: TSettings }) => ModuleFieldDef[];
  /** Module-specific extra values (e.g. Teachers lookups) — spread into the hook result. */
  lookupsFrom?: () => TExtra;
  /** Rich modules (Contacts) layer collections/column-layout/prefs on top of the core. */
  useEnhance?: (core: StandardModuleConfigCore<TSettings>) => TExtra;
  /** Modules persisting settings and prefs as one combined draft (default true). */
  persistPrefsWithSettings?: boolean;
  /** Users variant persists prefs inside the cache-only `updateSettings` as well. */
  updateSettingsFiresPrefs?: boolean;
}

/**
 * Shared skeleton for standard-module config hooks (Teachers/Students/Sessions/Users/Enrollments).
 * Module adapters pass their composed-settings hook, field/prefs mutations, compose/normalize
 * functions, and per-module field-derivation + lookups overrides.
 */
export function createStandardModuleConfigHook<
  TSettings extends StandardModuleConfigSettingsLike,
  TExtra extends Record<string, unknown> = Record<string, never>,
>(options: CreateStandardModuleConfigHookOptions<TSettings, TExtra>) {
  const {
    defaultSettings,
    defaultFieldDefs,
    useComposedSettings,
    useFieldConfigMutation,
    usePreferencesMutation,
    setFieldConfigMemory,
    setPreferencesMemory,
    fieldConfigQueryKey,
    preferencesQueryKey,
    normalizeSettings,
    normalizePrefs,
    composeSettings,
    customFieldsFrom,
    orderedFieldsFrom,
    lookupsFrom,
    useEnhance,
    persistPrefsWithSettings = true,
    updateSettingsFiresPrefs,
  } = options;

  return function useStandardModuleConfigHook() {
    const queryClient = useQueryClient();
    const settings = useComposedSettings();
    const { mutateAsync: saveFieldConfig } = useFieldConfigMutation();
    const { mutateAsync: savePreferences } = usePreferencesMutation();

    const mergeSettings = useCallback(
      (settingsDraft: Partial<TSettings> | null | undefined): TSettings => {
        return normalizeSettings({
          ...defaultSettings,
          ...(settingsDraft ?? {}),
          formTabs: settingsDraft?.formTabs ?? defaultSettings.formTabs ?? [],
          enabledTabs: settingsDraft?.enabledTabs ?? defaultSettings.enabledTabs ?? [],
          requiredTabs: settingsDraft?.requiredTabs ?? defaultSettings.requiredTabs ?? [],
          fields: mergeTabbedFields(defaultSettings.fields ?? {}, settingsDraft?.fields),
          customFields: settingsDraft?.customFields ?? defaultSettings.customFields ?? [],
          fieldOrder: settingsDraft?.fieldOrder ?? defaultSettings.fieldOrder ?? [],
        });
      },
      [],
    );

    const updateSettings = useCallback(
      (settingsDraft: TSettings) => {
        const merged = normalizeSettings(settingsDraft);
        const prefs = normalizePrefs(settingsDraft);
        const composed = composeSettings(merged, prefs, merged.formTabs);
        setFieldConfigMemory(composed);
        queryClient.setQueryData(fieldConfigQueryKey, composed);
        if (persistPrefsWithSettings) {
          setPreferencesMemory(prefs);
          queryClient.setQueryData(preferencesQueryKey, prefs);
          if (updateSettingsFiresPrefs) {
            void savePreferences(prefs);
          }
        }
      },
      [
        queryClient,
        savePreferences,
      ],
    );

    const updateSettingsAsync = useCallback(
      async (settingsDraft: TSettings) => {
        await saveFieldConfig(normalizeSettings(settingsDraft));
        if (persistPrefsWithSettings) {
          await savePreferences(normalizePrefs(settingsDraft));
        }
      },
      [saveFieldConfig, savePreferences],
    );

    const fields = useMemo(
      () => getFlatFieldsConfig(settings.fields),
      [settings.fields],
    );

    const customFields = useMemo<ModuleCustomField[]>(
      () =>
        customFieldsFrom
          ? customFieldsFrom(settings)
          : ((settings.customFields ?? []) as ModuleCustomField[]),
      [settings],
    );

    const fieldOrder = useMemo(
      () => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [],
      [settings.fieldOrder],
    );

    const orderedFields = useMemo(
      () =>
        orderedFieldsFrom
          ? orderedFieldsFrom({ fieldOrder, settings })
          : getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
      [fieldOrder, settings, fields, customFields],
    );

    const reloadConfig = useCallback(() => {}, []);

    const loadSettings = useCallback(() => settings, [settings]);

    const isFieldEnabled = useCallback(
      (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
      [fields],
    );

    const isFieldRequired = useCallback(
      (fieldId: string): boolean => !!fields[fieldId]?.required,
      [fields],
    );

    const extra = lookupsFrom ? lookupsFrom() : ({} as TExtra);
    const core: StandardModuleConfigCore<TSettings> = {
      settings,
      orderedFields,
      fields,
      customFields,
      updateSettings,
      updateSettingsAsync,
      reloadConfig,
      mergeSettings,
      loadSettings,
      isFieldEnabled,
      isFieldRequired,
    };
    // Unconditional call: the adapter's `useEnhance` is a stable module config hook,
    // so hook order cannot vary between renders (same contract as `lookupsFrom`).
    const enhanceForCore = useEnhance ?? (() => ({} as TExtra));
    const enhanced = enhanceForCore(core);

    return {
      ...core,
      ...extra,
      ...enhanced,
    };
  };
}
