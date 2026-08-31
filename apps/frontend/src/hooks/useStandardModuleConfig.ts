import type { ModuleFieldDef, ModuleCustomField } from '@mms/shared';
import {
  getFlatFieldsConfig,
  getSortedFields,
  getSortedTeacherFields,
  listEnabledCustomTeacherFormFields,
  resolveTeacherFieldsMapForColumnSync,
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
  type FinanceSettings,
  type AttendanceSettings,
  type AccountingSettings,
  type ExaminationsSettings,
} from '@mms/shared';
import { createStandardModuleConfigHook, type StandardModuleConfigCore } from './createStandardModuleConfigHook';
import {
  STANDARD_MODULES_CONFIG_REGISTRY,
  type StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
import { useSessionLookupsQuery } from '@/tenant/features/sessions/hooks/useSessionLookups';
import { useAttendanceLookupsQuery } from '@/tenant/features/attendance/hooks/useAttendanceLookups';
import { useStudentLookupsQuery } from '@/tenant/features/students/hooks/useStudentLookups';
import { useTeacherLookupsQuery } from '@/tenant/features/teachers/hooks/useTeacherLookups';

export type {
  StandardModuleId,
  StandardModuleSettingsMap,
  StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
export { STANDARD_MODULES_CONFIG_REGISTRY } from './standardModuleConfigRegistry';

export function useUsersConfig(): StandardModuleConfigCore<UsersSettings> {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY.users;

  const defaultSettings = registry.defaultSettings as UsersSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const settings = defaultSettings;
  const fields = (() => getFlatFieldsConfig(settings.fields))();
  const customFields = (() => (settings.customFields || []) as ModuleCustomField[])();
  const fieldOrder = (() => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [])();
  const orderedFields = (() => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields))();

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings: () => {},
    updateSettingsAsync: async () => {},
    reloadConfig: () => {},
    mergeSettings: (draft) => draft as UsersSettings,
    loadSettings: () => settings,
    isFieldEnabled: (fieldId) => fields[fieldId]?.enabled !== false,
    isFieldRequired: (fieldId) => !!fields[fieldId]?.required,
  };
}

const useTeacherConfigImpl = createStandardModuleConfigHook<
  TeachersSettings,
  { statuses: string[]; specializations: string[]; genderFilters: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.teachers.defaultSettings as TeachersSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.teachers.defaultFieldDefs as unknown as ModuleFieldDef[],
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

const useStudentConfigImpl = createStandardModuleConfigHook<
  StudentsSettings,
  { statuses: string[]; genderFilters: string[]; discountTypes: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.students.defaultSettings as StudentsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.students.defaultFieldDefs as unknown as ModuleFieldDef[],
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

const useSessionConfigImpl = createStandardModuleConfigHook<
  SessionsSettings,
  { statuses: string[]; types: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.sessions.defaultSettings as SessionsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.sessions.defaultFieldDefs as unknown as ModuleFieldDef[],
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

const useEnrollmentConfigImpl = createStandardModuleConfigHook<
  EnrollmentsSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.enrollments.defaultSettings as EnrollmentsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.enrollments.defaultFieldDefs as unknown as ModuleFieldDef[],
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
