import type { ModuleFieldDef, ModuleCustomField } from '@mms/shared';
import {
  getSortedTeacherFields,
  listEnabledCustomTeacherFormFields,
  resolveTeacherFieldsMapForColumnSync,
  emptyStudentLookupsMap,
  emptySessionLookupsMap,
  emptyAttendanceLookupsMap,
  emptyTeacherLookupsMap,
  normalizeUserModulePreferences,
  normalizeTeacherModulePreferences,
  normalizeStudentModulePreferences,
  normalizeSessionModulePreferences,
  normalizeEnrollmentModulePreferences,
  normalizeExaminationsModulePreferences,
  normalizeHasanatModulePreferences,
  normalizeFinanceModulePreferences,
  normalizeAccountingModulePreferences,
  normalizeAttendanceModulePreferences,
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
import { useTeacherLookupsQuery } from '@/tenant/features/faculty/hooks/useFacultyLookups';
import {
  useComposedUsersSettings,
  useUserPreferencesMutation,
} from '@/tenant/hooks/collections/users';
import {
  useComposedFacultySettings,
  useFacultyPreferencesMutation,
} from '@/tenant/hooks/collections/faculty';
import {
  useComposedStudentsSettings,
  useStudentPreferencesMutation,
} from '@/tenant/hooks/collections/students';
import {
  useComposedSessionsSettings,
  useSessionPreferencesMutation,
} from '@/tenant/hooks/collections/sessions';
import {
  useComposedEnrollmentsSettings,
  useEnrollmentPreferencesMutation,
} from '@/tenant/hooks/collections/enrollments';
import {
  useComposedExaminationsSettings,
  useExaminationPreferencesMutation,
} from '@/tenant/hooks/collections/examinations';
import {
  useComposedHasanatSettings,
  useHasanatPreferencesMutation,
} from '@/tenant/hooks/collections/hasanat';
import {
  useComposedFinanceSettings,
  useFinancePreferencesMutation,
} from '@/tenant/hooks/collections/finance';
import {
  useComposedAccountingSettings,
  useAccountingPreferencesMutation,
} from '@/tenant/hooks/collections/accounting';
import {
  useComposedAttendanceSettings,
  useAttendancePreferencesMutation,
} from '@/tenant/hooks/collections/attendance';

export type {
  StandardModuleId,
  StandardModuleSettingsMap,
  StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
export { STANDARD_MODULES_CONFIG_REGISTRY } from './standardModuleConfigRegistry';

const useUsersConfigImpl = createStandardModuleConfigHook<
  UsersSettings,
  Record<string, never>
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.users.defaultSettings as UsersSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.users.defaultFieldDefs as unknown as ModuleFieldDef[],
  useSettings: useComposedUsersSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useUserPreferencesMutation();
    return async (draft: UsersSettings) => {
      await mutation.mutateAsync(normalizeUserModulePreferences(draft));
    };
  },
});

export function useUsersConfig() {
  return useUsersConfigImpl() as StandardModuleConfigCore<UsersSettings> &
    StandardModuleConfigExtraMap['users'];
}

const useTeacherConfigImpl = createStandardModuleConfigHook<
  TeachersSettings,
  { statuses: string[]; specializations: string[]; genderFilters: string[]; designations: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.teachers.defaultSettings as TeachersSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.teachers.defaultFieldDefs as unknown as ModuleFieldDef[],
  useSettings: useComposedFacultySettings as unknown as () => TeachersSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useFacultyPreferencesMutation();
    return async (draft: TeachersSettings) => {
      await mutation.mutateAsync(normalizeTeacherModulePreferences(draft));
    };
  },
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
      designations: lookups.designations,
    };
  },
});

export function useTeacherConfig() {
  return useTeacherConfigImpl() as StandardModuleConfigCore<TeachersSettings> &
    StandardModuleConfigExtraMap['teachers'];
}

export const useFacultyConfig = useTeacherConfig;

const useStudentConfigImpl = createStandardModuleConfigHook<
  StudentsSettings,
  { statuses: string[]; genderFilters: string[]; discountTypes: string[] }
>({
  defaultSettings: STANDARD_MODULES_CONFIG_REGISTRY.students.defaultSettings as StudentsSettings,
  defaultFieldDefs: STANDARD_MODULES_CONFIG_REGISTRY.students.defaultFieldDefs as unknown as ModuleFieldDef[],
  useSettings: useComposedStudentsSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useStudentPreferencesMutation();
    return async (draft: StudentsSettings) => {
      await mutation.mutateAsync(normalizeStudentModulePreferences(draft));
    };
  },
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
  useSettings: useComposedSessionsSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useSessionPreferencesMutation();
    return async (draft: SessionsSettings) => {
      await mutation.mutateAsync(normalizeSessionModulePreferences(draft));
    };
  },
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
  useSettings: useComposedEnrollmentsSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useEnrollmentPreferencesMutation();
    return async (draft: EnrollmentsSettings) => {
      await mutation.mutateAsync(normalizeEnrollmentModulePreferences(draft));
    };
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
  useSettings: useComposedExaminationsSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useExaminationPreferencesMutation();
    return async (draft: ExaminationsSettings) => {
      await mutation.mutateAsync(normalizeExaminationsModulePreferences(draft));
    };
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
  useSettings: useComposedHasanatSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useHasanatPreferencesMutation();
    return async (draft: HasanatSettings) => {
      await mutation.mutateAsync(normalizeHasanatModulePreferences(draft));
    };
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
  useSettings: useComposedFinanceSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useFinancePreferencesMutation();
    return async (draft: FinanceSettings) => {
      await mutation.mutateAsync(normalizeFinanceModulePreferences(draft));
    };
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
  useSettings: useComposedAccountingSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useAccountingPreferencesMutation();
    return async (draft: AccountingSettings) => {
      await mutation.mutateAsync(normalizeAccountingModulePreferences(draft));
    };
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
  useSettings: useComposedAttendanceSettings,
  useUpdateSettingsAsync: () => {
    const mutation = useAttendancePreferencesMutation();
    return async (draft: AttendanceSettings) => {
      await mutation.mutateAsync(normalizeAttendanceModulePreferences(draft));
    };
  },
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
