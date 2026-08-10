import { useCallback, useMemo } from 'react';
import type { ModuleFieldDef } from '@mms/shared';
import {
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  getSortedTeacherFields,
  listEnabledCustomTeacherFormFields,
  resolveTeacherFieldsMapForColumnSync,
  type ModuleCustomField,
  composeSessionsSettings,
  composeStudentsSettings,
  composeTeachersSettings,
  composeUsersSettings,
  composeEnrollmentsSettings,
  normalizeSessionModulePreferences,
  normalizeStudentModulePreferences,
  normalizeTeacherModulePreferences,
  normalizeUserModulePreferences,
  normalizeEnrollmentModulePreferences,
  normalizeSessionsSettings,
  normalizeStudentsSettings,
  normalizeTeachersSettings,
  normalizeUsersSettings,
  normalizeEnrollmentsSettings,
  emptyStudentLookupsMap,
  emptyTeacherLookupsMap,
  type SessionsSettings,
  type StudentsSettings,
  type TeachersSettings,
  type UsersSettings,
  type EnrollmentsSettings,
} from '@mms/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createStandardModuleConfigHook } from './createStandardModuleConfigHook';
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
import {
  TEACHERS_FIELD_CONFIG_QUERY_KEY,
  TEACHERS_PREFERENCES_QUERY_KEY,
  useComposedTeachersSettings,
  useTeacherFieldConfigMutation,
  useTeacherPreferencesMutation,
} from '@/tenant/features/teachers/hooks/useTeacherSetupConfig';
import {
  setTeacherFieldConfigMemory,
  setTeacherPreferencesMemory,
} from '@/tenant/features/teachers/hooks/teacherSetupConfigApi';
import {
  SESSIONS_FIELD_CONFIG_QUERY_KEY,
  SESSIONS_PREFERENCES_QUERY_KEY,
  useComposedSessionsSettings,
  useSessionFieldConfigMutation,
  useSessionPreferencesMutation,
} from '@/tenant/features/sessions/hooks/useSessionSetupConfig';
import {
  setSessionFieldConfigMemory,
  setSessionPreferencesMemory,
} from '@/tenant/features/sessions/hooks/sessionSetupConfigApi';
import {
  USERS_FIELD_CONFIG_QUERY_KEY,
  USERS_PREFERENCES_QUERY_KEY,
  useComposedUsersSettings,
  useUserFieldConfigMutation,
  useUserPreferencesMutation,
} from '@/tenant/features/users/hooks/useUserSetupConfig';
import {
  setUserFieldConfigMemory,
  setUserPreferencesMemory,
} from '@/tenant/features/users/hooks/userSetupConfigApi';
import {
  ENROLLMENTS_FIELD_CONFIG_QUERY_KEY,
  ENROLLMENTS_PREFERENCES_QUERY_KEY,
  useComposedEnrollmentsSettings,
  useEnrollmentFieldConfigMutation,
  useEnrollmentPreferencesMutation,
} from '@/tenant/features/enrollments/hooks/useEnrollmentSetupConfig';
import {
  setEnrollmentFieldConfigMemory,
  setEnrollmentPreferencesMemory,
} from '@/tenant/features/enrollments/hooks/enrollmentSetupConfigApi';
import { useStudentLookupsQuery } from '@/tenant/features/students/hooks/useStudentLookups';
import { useTeacherLookupsQuery } from '@/tenant/features/teachers/hooks/useTeacherLookups';

export type {
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

/**
 * Users settings authority is typed REST + TanStack Query (not document-store getObject).
 * Permissions UI persists `workspaceRoles` via preferences mutation / composed updateSettings.
 */
export function useUsersConfig() {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY.users;
  const queryClient = useQueryClient();
  const settings = useComposedUsersSettings();
  const fieldMutation = useUserFieldConfigMutation();
  const prefsMutation = useUserPreferencesMutation();

  const defaultSettings = registry.defaultSettings as UsersSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const mergeSettings = useCallback(
    (settingsDraft: Partial<UsersSettings> | null | undefined): UsersSettings => {
      return normalizeUsersSettings({
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

  const updateSettings = useCallback(
    (settingsDraft: UsersSettings) => {
      const merged = normalizeUsersSettings(settingsDraft);
      const prefs = normalizeUserModulePreferences(settingsDraft);
      const composed = composeUsersSettings(merged, prefs, merged.formTabs);
      setUserFieldConfigMemory(composed);
      setUserPreferencesMemory(prefs);
      queryClient.setQueryData(USERS_FIELD_CONFIG_QUERY_KEY, composed);
      queryClient.setQueryData(USERS_PREFERENCES_QUERY_KEY, prefs);
      // Permissions Setup calls sync updateSettings (legacy saveObject fire-and-forget).
      void prefsMutation.mutateAsync(prefs);
    },
    [queryClient, prefsMutation],
  );

  const updateSettingsAsync = useCallback(
    async (settingsDraft: UsersSettings) => {
      await fieldMutation.mutateAsync(normalizeUsersSettings(settingsDraft));
      await prefsMutation.mutateAsync(normalizeUserModulePreferences(settingsDraft));
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

  const reloadConfig = useCallback(() => {}, []);
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
  } as ReturnType<typeof useModuleConfig<UsersSettings>> &
    StandardModuleConfigExtraMap['users'];
}

/**
 * Teachers settings authority is typed REST + TanStack Query (not document-store getObject).
 * Lookups (statuses / specializations) load from `/api/teachers/lookups`.
 */
const useTeacherConfigImpl = createStandardModuleConfigHook<
  TeachersSettings,
  { statuses: string[]; specializations: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.teachers.defaultSettings as TeachersSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.teachers.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedTeachersSettings,
  useFieldConfigMutation: useTeacherFieldConfigMutation,
  usePreferencesMutation: useTeacherPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setTeacherFieldConfigMemory,
  setPreferencesMemory: setTeacherPreferencesMemory as (prefs: unknown) => void,
  fieldConfigQueryKey: TEACHERS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: TEACHERS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeTeachersSettings,
  normalizePrefs: normalizeTeacherModulePreferences,
  composeSettings: composeTeachersSettings as (
    settings: unknown,
    prefs: unknown,
    formTabs?: unknown[],
  ) => TeachersSettings,
  customFieldsFrom: (settings) =>
    listEnabledCustomTeacherFormFields(resolveTeacherFieldsMapForColumnSync(settings.fields)).map(
      (field) => ({
        id: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options,
      }),
    ) as ModuleCustomField[],
  orderedFieldsFrom: ({ fieldOrder, settings }) =>
    getSortedTeacherFields(fieldOrder, settings.fields) as ModuleFieldDef[],
  lookupsFrom: function useTeacherConfigLookups() {
    const lookupsQuery = useTeacherLookupsQuery();
    const lookups = lookupsQuery.data ?? emptyTeacherLookupsMap();
    return { statuses: lookups.statuses, specializations: lookups.specializations };
  },
});

export function useTeacherConfig() {
  return useTeacherConfigImpl() as ReturnType<typeof useModuleConfig<TeachersSettings>> &
    StandardModuleConfigExtraMap['teachers'];
}

/**
 * Students settings authority is typed REST + TanStack Query (not document-store getObject).
 * Lookups (statuses / genderFilters / discountTypes) load from `/api/students/lookups`.
 */
const useStudentConfigImpl = createStandardModuleConfigHook<
  StudentsSettings,
  { statuses: string[]; genderFilters: string[]; discountTypes: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.students.defaultSettings as StudentsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.students.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedStudentsSettings,
  useFieldConfigMutation: useStudentFieldConfigMutation,
  usePreferencesMutation: useStudentPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setStudentFieldConfigMemory,
  setPreferencesMemory: setStudentPreferencesMemory as (prefs: unknown) => void,
  fieldConfigQueryKey: STUDENTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: STUDENTS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeStudentsSettings,
  normalizePrefs: normalizeStudentModulePreferences,
  composeSettings: composeStudentsSettings as (
    settings: unknown,
    prefs: unknown,
    formTabs?: unknown[],
  ) => StudentsSettings,
  lookupsFrom: function useStudentConfigLookups() {
    const lookupsQuery = useStudentLookupsQuery();
    const lookups = lookupsQuery.data ?? emptyStudentLookupsMap();
    return {
      statuses: lookups.statuses,
      genderFilters: lookups.genderFilters,
      discountTypes: lookups.discountTypes,
    };
  },
});

export function useStudentConfig() {
  return useStudentConfigImpl() as ReturnType<typeof useModuleConfig<StudentsSettings>> &
    StandardModuleConfigExtraMap['students'];
}

/**
 * Sessions settings authority is typed REST + TanStack Query (not document-store getObject).
 * Lookups (statuses / types) remain document-store collections this slice.
 */
export function useSessionConfig() {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY.sessions;
  const queryClient = useQueryClient();
  const settings = useComposedSessionsSettings();
  const fieldMutation = useSessionFieldConfigMutation();
  const prefsMutation = useSessionPreferencesMutation();

  const aux = useLiveCollectionsAndObjects(
    'collections' in registry
      ? (registry.collections as Record<string, { dbKey: string; default: () => unknown[] }>)
      : undefined,
    undefined,
  );

  const defaultSettings = registry.defaultSettings as SessionsSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const mergeSettings = useCallback(
    (settingsDraft: Partial<SessionsSettings> | null | undefined): SessionsSettings => {
      return normalizeSessionsSettings({
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

  const updateSettings = useCallback(
    (settingsDraft: SessionsSettings) => {
      const merged = normalizeSessionsSettings(settingsDraft);
      const prefs = normalizeSessionModulePreferences(settingsDraft);
      const composed = composeSessionsSettings(merged, prefs, merged.formTabs);
      setSessionFieldConfigMemory(composed);
      setSessionPreferencesMemory(prefs);
      queryClient.setQueryData(SESSIONS_FIELD_CONFIG_QUERY_KEY, composed);
      queryClient.setQueryData(SESSIONS_PREFERENCES_QUERY_KEY, prefs);
    },
    [queryClient],
  );

  const updateSettingsAsync = useCallback(
    async (settingsDraft: SessionsSettings) => {
      await fieldMutation.mutateAsync(normalizeSessionsSettings(settingsDraft));
      await prefsMutation.mutateAsync(normalizeSessionModulePreferences(settingsDraft));
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

  const reloadConfig = useCallback(() => {}, []);
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
    statuses: aux.collections.statuses,
    types: aux.collections.types,
  } as ReturnType<typeof useModuleConfig<SessionsSettings>> &
    StandardModuleConfigExtraMap['sessions'];
}

/**
 * Enrollments settings authority is typed REST + TanStack Query (not document-store getObject).
 */
export function useEnrollmentConfig() {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY.enrollments;
  const queryClient = useQueryClient();
  const settings = useComposedEnrollmentsSettings();
  const fieldMutation = useEnrollmentFieldConfigMutation();
  const prefsMutation = useEnrollmentPreferencesMutation();

  const defaultSettings = registry.defaultSettings as EnrollmentsSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const mergeSettings = useCallback(
    (settingsDraft: Partial<EnrollmentsSettings> | null | undefined): EnrollmentsSettings => {
      return normalizeEnrollmentsSettings({
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

  const updateSettings = useCallback(
    (settingsDraft: EnrollmentsSettings) => {
      const merged = normalizeEnrollmentsSettings(settingsDraft);
      const prefs = normalizeEnrollmentModulePreferences(settingsDraft);
      const composed = composeEnrollmentsSettings(merged, prefs, merged.formTabs);
      setEnrollmentFieldConfigMemory(composed);
      setEnrollmentPreferencesMemory(prefs);
      queryClient.setQueryData(ENROLLMENTS_FIELD_CONFIG_QUERY_KEY, composed);
      queryClient.setQueryData(ENROLLMENTS_PREFERENCES_QUERY_KEY, prefs);
    },
    [queryClient],
  );

  const updateSettingsAsync = useCallback(
    async (settingsDraft: EnrollmentsSettings) => {
      await fieldMutation.mutateAsync(normalizeEnrollmentsSettings(settingsDraft));
      await prefsMutation.mutateAsync(normalizeEnrollmentModulePreferences(settingsDraft));
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

  const reloadConfig = useCallback(() => {}, []);
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
  } as ReturnType<typeof useModuleConfig<EnrollmentsSettings>> &
    StandardModuleConfigExtraMap['enrollments'];
}

export function useExaminationConfig() {
  return useStandardModuleConfig('examinations');
}

export function useHasanatConfig() {
  return useStandardModuleConfig('hasanat');
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
