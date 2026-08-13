import {
  composeAttendanceSettings,
  mergeAttendanceFormTabsFromApi,
  stripAttendanceFieldConfigForPersist,
  type FieldDefinition,
  type AttendanceSettings,
  type TabDefinition,
} from '@mms/shared';
import {
  createModuleFieldConfigService,
  mapCustomTabRowToFormTabFields,
} from '../lib/createModuleFieldConfigService.js';
import {
  getAttendanceFieldConfig,
  setAttendanceFieldConfig,
} from '../db/repositories/attendanceFieldConfigRepository.js';
import { getAttendanceModulePreferences } from '../db/repositories/attendanceModulePreferencesRepository.js';

const attendanceFieldConfig = createModuleFieldConfigService<
  Record<string, unknown>,
  AttendanceSettings,
  TabDefinition,
  Record<string, FieldDefinition[]> | undefined,
  ReturnType<typeof stripAttendanceFieldConfigForPersist>
>({
  moduleId: 'attendance',
  broadcastKey: 'attendance',
  getByWorkspace: getAttendanceFieldConfig,
  upsert: setAttendanceFieldConfig,
  mapRow: mapCustomTabRowToFormTabFields,
  merge: mergeAttendanceFormTabsFromApi,
  toDocument: async (raw, tenant) => {
    const prefs = await getAttendanceModulePreferences(tenant);
    return composeAttendanceSettings((raw as unknown) as AttendanceSettings, (prefs || {}) as any);
  },
  stripForPersist: stripAttendanceFieldConfigForPersist,
  reloadFailedMessage: 'Failed to reload attendance field config after save',
});

export const getAttendanceFieldConfigService = attendanceFieldConfig.load;

export async function updateAttendanceFieldConfigService(
  config: AttendanceSettings | Record<string, unknown>,
): Promise<AttendanceSettings> {
  return attendanceFieldConfig.save(config as Partial<AttendanceSettings> as any);
}
