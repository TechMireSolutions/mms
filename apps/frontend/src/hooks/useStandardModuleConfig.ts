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
  emptySessionLookupsMap,
  emptyAttendanceLookupsMap,
  emptyTeacherLookupsMap,
  type SessionsSettings,
  type StudentsSettings,
  type TeachersSettings,
  type UsersSettings,
  type EnrollmentsSettings,
  type HasanatSettings,
  composeHasanatSettings,
  normalizeHasanatModulePreferences,
  normalizeHasanatSettings,
  type FinanceSettings,
  composeFinanceSettings,
  normalizeFinanceModulePreferences,
  normalizeFinanceSettings,
  type AttendanceSettings,
  composeAttendanceSettings,
  normalizeAttendanceModulePreferences,
  normalizeAttendanceSettings,
  type AccountingSettings,
  composeAccountingSettings,
  normalizeAccountingModulePreferences,
  normalizeAccountingSettings,
  type ExaminationsSettings,
  composeExaminationsSettings,
  normalizeExaminationsModulePreferences,
  normalizeExaminationsSettings,
} from '@mms/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createStandardModuleConfigHook, type StandardModuleConfigCore } from './createStandardModuleConfigHook';
import {
  STANDARD_MODULES_CONFIG_REGISTRY,
  type StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
import {
  STUDENTS_FIELD_CONFIG_QUERY_KEY,
  STUDENTS_PREFERENCES_QUERY_KEY,
  setStudentFieldConfigMemory,
  setStudentPreferencesMemory,
  useComposedStudentsSettings,
  useStudentFieldConfigMutation,
  useStudentLookupsQuery,
  useStudentPreferencesMutation,
} from '@/tenant/hooks/collections/students';
import {
  TEACHERS_FIELD_CONFIG_QUERY_KEY,
  TEACHERS_PREFERENCES_QUERY_KEY,
  setTeacherFieldConfigMemory,
  setTeacherPreferencesMemory,
  useComposedTeachersSettings,
  useTeacherFieldConfigMutation,
  useTeacherLookupsQuery,
  useTeacherPreferencesMutation,
} from '@/tenant/hooks/collections/teachers';
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
import { useSessionLookupsQuery } from '@/tenant/features/sessions/hooks/useSessionLookups';
import {
  USERS_FIELD_CONFIG_QUERY_KEY,
  USERS_PREFERENCES_QUERY_KEY,
  useComposedUsersSettings,
  useUserFieldConfigMutation,
  useUserPreferencesMutation,
  setUserFieldConfigMemory,
  setUserPreferencesMemory,
} from '@/tenant/hooks/collections/users';
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
import {
  FINANCE_FIELD_CONFIG_QUERY_KEY,
  FINANCE_PREFERENCES_QUERY_KEY,
  useComposedFinanceSettings,
  useFinanceFieldConfigMutation,
  useFinancePreferencesMutation,
} from '@/tenant/features/finance/hooks/useFinanceSetupConfig';
import {
  setFinanceFieldConfigMemory,
  setFinancePreferencesMemory,
} from '@/tenant/features/finance/hooks/financeSetupConfigApi';
import {
  HASANAT_FIELD_CONFIG_QUERY_KEY,
  HASANAT_PREFERENCES_QUERY_KEY,
  useComposedHasanatSettings,
  useHasanatFieldConfigMutation,
  useHasanatPreferencesMutation,
} from '@/tenant/features/hasanat/hooks/useHasanatSetupConfig';
import {
  useComposedExaminationsSettings,
  useExaminationFieldConfigMutation,
  useExaminationPreferencesMutation,
  EXAMINATIONS_FIELD_CONFIG_QUERY_KEY,
  EXAMINATIONS_PREFERENCES_QUERY_KEY,
} from '@/tenant/features/examinations/hooks/useExaminationSetupConfig';
import {
  setExaminationFieldConfigMemory,
  setExaminationPreferencesMemory,
} from '@/tenant/features/examinations/hooks/examinationSetupConfigApi';
import {
  setHasanatFieldConfigMemory,
  setHasanatPreferencesMemory,
} from '@/tenant/features/hasanat/hooks/hasanatSetupConfigApi';
import {
  ATTENDANCE_FIELD_CONFIG_QUERY_KEY,
  ATTENDANCE_PREFERENCES_QUERY_KEY,
  useComposedAttendanceSettings,
  useAttendanceFieldConfigMutation,
  useAttendancePreferencesMutation,
} from '@/tenant/features/attendance/hooks/useAttendanceSetupConfig';
import {
  setAttendanceFieldConfigMemory,
  setAttendancePreferencesMemory,
} from '@/tenant/features/attendance/hooks/attendanceSetupConfigApi';
import { useAttendanceLookupsQuery } from '@/tenant/features/attendance/hooks/useAttendanceLookups';
import {
  ACCOUNTING_FIELD_CONFIG_QUERY_KEY,
  ACCOUNTING_PREFERENCES_QUERY_KEY,
  useComposedAccountingSettings,
  useAccountingFieldConfigMutation,
  useAccountingPreferencesMutation,
} from '@/tenant/features/accounting/hooks/useAccountingSetupConfig';
import {
  setAccountingFieldConfigMemory,
  setAccountingPreferencesMemory,
} from '@/tenant/features/accounting/hooks/accountingSetupConfigApi';


export type {
  StandardModuleId,
  StandardModuleSettingsMap,
  StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
export { STANDARD_MODULES_CONFIG_REGISTRY } from './standardModuleConfigRegistry';

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
  } as StandardModuleConfigCore<UsersSettings> &
    StandardModuleConfigExtraMap['users'];
}

/**
 * Teachers settings authority is typed REST + TanStack Query (not document-store getObject).
 * Lookups (statuses / specializations / genderFilters) load from `/api/teachers/lookups`.
 */
const useTeacherConfigImpl = createStandardModuleConfigHook<
  TeachersSettings,
  { statuses: string[]; specializations: string[]; genderFilters: string[] }
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
    return {
      statuses: lookups.statuses,
      specializations: lookups.specializations,
      genderFilters: lookups.genderFilters,
    };
  },
});

export function useTeacherConfig() {
  return useTeacherConfigImpl() as StandardModuleConfigCore<TeachersSettings> &
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
  return useStudentConfigImpl() as StandardModuleConfigCore<StudentsSettings> &
    StandardModuleConfigExtraMap['students'];
}

/**
 * Sessions settings authority is typed REST + TanStack Query (not document-store getObject).
 * Lookups (statuses / types) remain document-store collections this slice.
 */
const useSessionConfigImpl = createStandardModuleConfigHook<
  SessionsSettings,
  { statuses: string[]; types: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.sessions.defaultSettings as SessionsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.sessions.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedSessionsSettings,
  useFieldConfigMutation: useSessionFieldConfigMutation,
  usePreferencesMutation: useSessionPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setSessionFieldConfigMemory,
  setPreferencesMemory: setSessionPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: SESSIONS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: SESSIONS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeSessionsSettings,
  normalizePrefs: normalizeSessionModulePreferences as unknown as (
    settings: SessionsSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeSessionsSettings(
      merged as SessionsSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useSessionConfigLookups() {
    const lookupsQuery = useSessionLookupsQuery();
    const lookups = lookupsQuery.data ?? emptySessionLookupsMap;
    return {
      statuses: lookups.statuses,
      types: lookups.types,
    };
  },
});

export function useSessionConfig() {
  return useSessionConfigImpl() as StandardModuleConfigCore<SessionsSettings> &
    StandardModuleConfigExtraMap['sessions'];
}

/**
 * Enrollments settings authority is typed REST + TanStack Query (not document-store getObject).
 */
const useEnrollmentConfigImpl = createStandardModuleConfigHook<
  EnrollmentsSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.enrollments.defaultSettings as EnrollmentsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.enrollments.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedEnrollmentsSettings,
  useFieldConfigMutation: useEnrollmentFieldConfigMutation,
  usePreferencesMutation: useEnrollmentPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setEnrollmentFieldConfigMemory,
  setPreferencesMemory: setEnrollmentPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: ENROLLMENTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ENROLLMENTS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeEnrollmentsSettings,
  normalizePrefs: normalizeEnrollmentModulePreferences as unknown as (
    settings: EnrollmentsSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeEnrollmentsSettings(
      merged as EnrollmentsSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useEnrollmentConfigLookups() {
    return {};
  },
});

export function useEnrollmentConfig() {
  return useEnrollmentConfigImpl() as StandardModuleConfigCore<EnrollmentsSettings> &
    StandardModuleConfigExtraMap['enrollments'];
}

const useExaminationConfigImpl = createStandardModuleConfigHook<
  ExaminationsSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.examinations.defaultSettings as ExaminationsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.examinations.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedExaminationsSettings,
  useFieldConfigMutation: useExaminationFieldConfigMutation,
  usePreferencesMutation: useExaminationPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setExaminationFieldConfigMemory,
  setPreferencesMemory: setExaminationPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: EXAMINATIONS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: EXAMINATIONS_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeExaminationsSettings,
  normalizePrefs: normalizeExaminationsModulePreferences as unknown as (
    settings: ExaminationsSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeExaminationsSettings(
      merged as ExaminationsSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useExaminationConfigLookups() {
    return {};
  },
});

export function useExaminationConfig() {
  return useExaminationConfigImpl() as StandardModuleConfigCore<ExaminationsSettings> &
    StandardModuleConfigExtraMap['examinations'];
}

const useHasanatConfigImpl = createStandardModuleConfigHook<
  HasanatSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.hasanat.defaultSettings as HasanatSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.hasanat.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedHasanatSettings,
  useFieldConfigMutation: useHasanatFieldConfigMutation,
  usePreferencesMutation: useHasanatPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setHasanatFieldConfigMemory,
  setPreferencesMemory: setHasanatPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: HASANAT_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: HASANAT_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeHasanatSettings,
  normalizePrefs: normalizeHasanatModulePreferences as unknown as (
    settings: HasanatSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeHasanatSettings(
      merged as HasanatSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useHasanatConfigLookups() {
    return {};
  },
});

export function useHasanatConfig() {
  return useHasanatConfigImpl() as StandardModuleConfigCore<HasanatSettings> &
    StandardModuleConfigExtraMap['hasanat'];
}

const useFinanceConfigImpl = createStandardModuleConfigHook<
  FinanceSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.finance.defaultSettings as FinanceSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.finance.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedFinanceSettings,
  useFieldConfigMutation: useFinanceFieldConfigMutation,
  usePreferencesMutation: useFinancePreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setFinanceFieldConfigMemory,
  setPreferencesMemory: setFinancePreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: FINANCE_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: FINANCE_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeFinanceSettings,
  normalizePrefs: normalizeFinanceModulePreferences as unknown as (
    settings: FinanceSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeFinanceSettings(
      merged as FinanceSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useFinanceConfigLookups() {
    return {};
  },
});

export function useFinanceConfig() {
  return useFinanceConfigImpl() as StandardModuleConfigCore<FinanceSettings> &
    StandardModuleConfigExtraMap['finance'];
}

const useAccountingConfigImpl = createStandardModuleConfigHook<
  AccountingSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.accounting.defaultSettings as AccountingSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.accounting.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedAccountingSettings,
  useFieldConfigMutation: useAccountingFieldConfigMutation,
  usePreferencesMutation: useAccountingPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setAccountingFieldConfigMemory,
  setPreferencesMemory: setAccountingPreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: ACCOUNTING_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ACCOUNTING_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeAccountingSettings,
  normalizePrefs: normalizeAccountingModulePreferences as unknown as (
    settings: AccountingSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeAccountingSettings(
      merged as AccountingSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useAccountingConfigLookups() {
    return {};
  },
});

export function useAccountingConfig() {
  return useAccountingConfigImpl() as StandardModuleConfigCore<AccountingSettings> &
    StandardModuleConfigExtraMap['accounting'];
}

const useAttendanceConfigImpl = createStandardModuleConfigHook<
  AttendanceSettings,
  { statuses: import('@/lib/data/attendanceData').AttendanceStatus[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.attendance.defaultSettings as AttendanceSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.attendance.defaultFieldDefs as unknown as ModuleFieldDef[],
  useComposedSettings: useComposedAttendanceSettings,
  useFieldConfigMutation: useAttendanceFieldConfigMutation,
  usePreferencesMutation: useAttendancePreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory: setAttendanceFieldConfigMemory,
  setPreferencesMemory: setAttendancePreferencesMemory as unknown as (prefs: unknown) => void,
  fieldConfigQueryKey: ATTENDANCE_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: ATTENDANCE_PREFERENCES_QUERY_KEY,
  normalizeSettings: normalizeAttendanceSettings,
  normalizePrefs: normalizeAttendanceModulePreferences as unknown as (
    settings: AttendanceSettings,
  ) => unknown,
  composeSettings: (merged, prefs, tabs) =>
    composeAttendanceSettings(
      merged as AttendanceSettings,
      prefs as any,
      tabs as any,
    ),
  lookupsFrom: function useAttendanceConfigLookups() {
    const lookupsQuery = useAttendanceLookupsQuery();
    const lookups = lookupsQuery.data ?? emptyAttendanceLookupsMap;
    return {
      statuses: lookups.statuses,
    };
  },
});

export function useAttendanceConfig() {
  return useAttendanceConfigImpl() as StandardModuleConfigCore<AttendanceSettings> &
    StandardModuleConfigExtraMap['attendance'];
}
