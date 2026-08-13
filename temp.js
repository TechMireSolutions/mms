const fs = require('fs');

const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('emptyStudentLookupsMap,', 'emptyStudentLookupsMap,\n  emptySessionLookupsMap,\n  emptyAttendanceLookupsMap,');

content = content.replace(
  `} from '@/tenant/features/sessions/hooks/sessionSetupConfigApi';`,
  `} from '@/tenant/features/sessions/hooks/sessionSetupConfigApi';\nimport { useSessionLookupsQuery } from '@/tenant/features/sessions/hooks/useSessionLookups';`
);

content = content.replace(
  `} from '@/tenant/features/attendance/hooks/attendanceSetupConfigApi';`,
  `} from '@/tenant/features/attendance/hooks/attendanceSetupConfigApi';\nimport { useAttendanceLookupsQuery } from '@/tenant/features/attendance/hooks/useAttendanceLookups';`
);

const sessionConfigRegex = /export function useSessionConfig\(\) \{[\s\S]*?as ReturnType<typeof useModuleConfig<SessionsSettings>> &\n    StandardModuleConfigExtraMap\['sessions'\];\n\}/;

const newSessionConfig = `const useSessionConfigImpl = createStandardModuleConfigHook<
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
  setPreferencesMemory: setSessionPreferencesMemory,
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
      tabs as string[],
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
  return useSessionConfigImpl() as ReturnType<typeof useModuleConfig<SessionsSettings>> &
    StandardModuleConfigExtraMap['sessions'];
}`;

content = content.replace(sessionConfigRegex, newSessionConfig);

const attendanceConfigRegex = /export function useAttendanceConfig\(\) \{[\s\S]*?as ReturnType<typeof useModuleConfig<AttendanceSettings>> &\n    StandardModuleConfigExtraMap\['attendance'\];\n\}/;

const newAttendanceConfig = `const useAttendanceConfigImpl = createStandardModuleConfigHook<
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
  setPreferencesMemory: setAttendancePreferencesMemory,
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
      tabs as string[],
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
  return useAttendanceConfigImpl() as ReturnType<typeof useModuleConfig<AttendanceSettings>> &
    StandardModuleConfigExtraMap['attendance'];
}`;

content = content.replace(attendanceConfigRegex, newAttendanceConfig);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
