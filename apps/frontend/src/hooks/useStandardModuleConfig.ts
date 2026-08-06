import { useCallback, useMemo } from 'react';
import type { ModuleFieldDef } from '@mms/shared';
import {
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type ModuleCustomField,
  composeStudentsSettings,
  normalizeStudentModulePreferences,
  normalizeStudentsSettings,
  type StudentsSettings,
} from '@mms/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleConfig } from './useModuleConfig';
import { useLiveCollectionsAndObjects } from './useLiveCollectionsAndObjects';
import {
  STANDARD_MODULES_CONFIG_REGISTRY,
  type StandardModuleConfigExtraMap,
  type StandardModuleId,
  type StandardModuleSettingsMap,
} from './standardModuleConfigRegistry';
import {
  STUDENTS_FIELD_CONFIG_QUERY_KEY,
  STUDENTS_PREFERENCES_QUERY_KEY,
  useComposedStudentsSettings,
  useStudentFieldConfigMutation,
  useStudentPreferencesMutation,
} from '@/tenant/features/students/hooks/useStudentSetupConfig';
import {
  setStudentFieldConfigMemory,
  setStudentPreferencesMemory,
} from '@/tenant/features/students/hooks/studentSetupConfigApi';
import { STUDENT_CONFIG_COLLECTION_KEYS, STUDENT_CONFIG_OBJECT_KEYS } from './standardModuleConfigRegistryKeys';

export type {
  StudentGuardianContactDefault,
  StudentGuardianContactDefaults,
  StandardModuleId,
  StandardModuleSettingsMap,
  StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
export { STANDARD_MODULES_CONFIG_REGISTRY } from './standardModuleConfigRegistry';
export { useLiveCollectionsAndObjects } from './useLiveCollectionsAndObjects';

export function useStandardModuleConfig<M extends StandardModuleId>(
  moduleId: M,
): ReturnType<typeof useModuleConfig<StandardModuleSettingsMap[M]>> &
  StandardModuleConfigExtraMap[M] {
  const config = STANDARD_MODULES_CONFIG_REGISTRY[moduleId];

  const defaultFieldDefs = useMemo(() => {
    if (moduleId === 'teachers') {
      return (config.defaultFieldDefs as unknown as ModuleFieldDef[]).map((field) => ({
        ...field,
        label: field.label || (field as { labelKey?: string }).labelKey || field.id,
      }));
    }
    return config.defaultFieldDefs as unknown as ModuleFieldDef[];
  }, [moduleId, config.defaultFieldDefs]);

  const moduleConfigResult = useModuleConfig<StandardModuleSettingsMap[M]>({
    settingsObjectKey: config.settingsObjectKey,
    defaultSettings: config.defaultSettings as unknown as StandardModuleSettingsMap[M],
    defaultFieldDefs,
    normalizeFn: 'normalizeFn' in config ? (config.normalizeFn as unknown as (settings: unknown) => StandardModuleSettingsMap[M]) : undefined,
  });

  const aux = useLiveCollectionsAndObjects(
    'collections' in config ? (config.collections as Record<string, { dbKey: string; default: () => unknown[] }>) : undefined,
    'objects' in config ? (config.objects as Record<string, { dbKey: string; default: () => unknown }>) : undefined,
  );

  return {
    ...moduleConfigResult,
    ...aux.collections,
    ...aux.objects,
  } as ReturnType<typeof useModuleConfig<StandardModuleSettingsMap[M]>> &
    StandardModuleConfigExtraMap[M];
}

export function useUsersConfig() {
  return useStandardModuleConfig('users');
}

export function useTeacherConfig() {
  return useStandardModuleConfig('teachers');
}

/**
 * Students settings authority is typed REST + TanStack Query (not document-store getObject).
 * Lookups (statuses / gender / discount) remain live collections until a lookups pass.
 */
export function useStudentConfig() {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY.students;
  const queryClient = useQueryClient();
  const settings = useComposedStudentsSettings();
  const fieldMutation = useStudentFieldConfigMutation();
  const prefsMutation = useStudentPreferencesMutation();

  const aux = useLiveCollectionsAndObjects(
    {
      statuses: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.statuses,
        default: () => [],
      },
      genderFilters: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.genderFilters,
        default: () => [],
      },
      discountTypes: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.discountTypes,
        default: () => [],
      },
    },
    {
      guardianContactDefaults: {
        dbKey: STUDENT_CONFIG_OBJECT_KEYS.guardianContactDefaults,
        default: () => ({}),
      },
    },
  );

  const defaultSettings = registry.defaultSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const mergeSettings = useCallback(
    (settingsDraft: Partial<StudentsSettings> | null | undefined): StudentsSettings => {
      return normalizeStudentsSettings({
        ...defaultSettings,
        ...(settingsDraft ?? {}),
        formTabs: settingsDraft?.formTabs ?? defaultSettings.formTabs ?? [],
        enabledTabs: settingsDraft?.enabledTabs ?? defaultSettings.enabledTabs ?? [],
        requiredTabs: settingsDraft?.requiredTabs ?? defaultSettings.requiredTabs ?? [],
        fields: mergeTabbedFields(defaultSettings.fields || {}, settingsDraft?.fields),
        customFields: settingsDraft?.customFields ?? defaultSettings.customFields ?? [],
        fieldOrder: settingsDraft?.fieldOrder ?? defaultSettings.fieldOrder ?? [],
      });
    },
    [defaultSettings],
  );

  /** Local/cache-only — never fires network. Persist via updateSettingsAsync or Setup mutations. */
  const updateSettings = useCallback(
    (settingsDraft: StudentsSettings) => {
      const merged = normalizeStudentsSettings(settingsDraft);
      const prefs = normalizeStudentModulePreferences(settingsDraft);
      const composed = composeStudentsSettings(merged, prefs, merged.formTabs);
      setStudentFieldConfigMemory(composed);
      setStudentPreferencesMemory(prefs);
      queryClient.setQueryData(STUDENTS_FIELD_CONFIG_QUERY_KEY, composed);
      queryClient.setQueryData(STUDENTS_PREFERENCES_QUERY_KEY, prefs);
    },
    [queryClient],
  );

  const updateSettingsAsync = useCallback(
    async (settingsDraft: StudentsSettings) => {
      await fieldMutation.mutateAsync(normalizeStudentsSettings(settingsDraft));
      await prefsMutation.mutateAsync(normalizeStudentModulePreferences(settingsDraft));
    },
    [fieldMutation, prefsMutation],
  );

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(
    () => (settings.customFields || []) as ModuleCustomField[],
    [settings.customFields],
  );
  const fieldOrder = useMemo(
    () => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [],
    [settings.fieldOrder, defaultSettings.fieldOrder],
  );

  const orderedFields = useMemo(
    () => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
    [defaultFieldDefs, fieldOrder, fields, customFields],
  );

  const isFieldEnabled = useCallback(
    (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
    [fields],
  );

  const isFieldRequired = useCallback(
    (fieldId: string): boolean => !!fields[fieldId]?.required,
    [fields],
  );

  const reloadConfig = useCallback(() => {
    // Query invalidation is handled by mutations; consumers can remount.
  }, []);

  const loadSettings = useCallback(() => settings, [settings]);

  return {
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
    ...aux.collections,
    ...aux.objects,
  } as ReturnType<typeof useModuleConfig<StudentsSettings>> &
    StandardModuleConfigExtraMap['students'];
}

export function useSessionConfig() {
  return useStandardModuleConfig('sessions');
}

export function useExaminationConfig() {
  return useStandardModuleConfig('examinations');
}

export function useHasanatConfig() {
  return useStandardModuleConfig('hasanat');
}

export function useEnrollmentConfig() {
  return useStandardModuleConfig('enrollments');
}

export function useFinanceConfig() {
  return useStandardModuleConfig('finance');
}

export function useAccountingConfig() {
  return useStandardModuleConfig('accounting');
}

export function useAttendanceConfig() {
  return useStandardModuleConfig('attendance');
}
