import { z } from 'zod';
import type { TabDefinition } from './contactTypes.js';
import { DEFAULT_ATTENDANCE_SETTINGS, type AttendanceSettings } from './attendanceModuleSettings.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/attendance/field-config — field registry JSON without prefs keys. */
export const attendanceFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
    fieldOrder: z.array(z.string()).optional(),
    formTabs: z.array(z.record(z.string(), z.unknown())).optional(),
    enabledTabs: z.array(z.string()).optional(),
    requiredTabs: z.array(z.string()).optional(),
  })
  .passthrough();

/** PUT /api/attendance/preferences — attendance prefs only. */
export const attendancePreferencesPutBodySchema = z
  .object({
    workingDays: z.array(z.string()).optional(),
    cutoffTime: z.string().optional(),
    lateThresholdMins: z.number().optional(),
    autoAbsentAfterMins: z.number().optional(),
    qrEnabled: z.boolean().optional(),
    lowAttendanceThreshold: z.number().optional(),
    notifyParents: z.boolean().optional(),
    requireNoteForAbsent: z.boolean().optional(),
    lockAfterSubmit: z.boolean().optional(),
    trackHalfDay: z.boolean().optional(),
    weeklyReport: z.boolean().optional(),
    attendanceAlerts: z.boolean().optional(),
    allowManualOverride: z.boolean().optional(),
    offlineEnabled: z.boolean().optional(),
    geoTagging: z.boolean().optional(),
    defaultViewLayout: z.string().optional(),
  })
  .passthrough();

/** Typed preference state extracted from legacy AttendanceSettings. */
export interface AttendanceModulePreferences {
  workingDays: string[];
  cutoffTime: string;
  lateThresholdMins: number;
  autoAbsentAfterMins: number;
  qrEnabled: boolean;
  lowAttendanceThreshold: number;
  notifyParents: boolean;
  requireNoteForAbsent: boolean;
  lockAfterSubmit: boolean;
  trackHalfDay: boolean;
  weeklyReport: boolean;
  attendanceAlerts: boolean;
  allowManualOverride: boolean;
  offlineEnabled: boolean;
  geoTagging: boolean;
  defaultViewLayout: string;
}

/** Extracts preferences slice from a raw composed settings blob. */
export function normalizeAttendanceModulePreferences(
  raw: unknown
): AttendanceModulePreferences {
  if (!raw || typeof raw !== 'object') {
    return {
      workingDays: DEFAULT_ATTENDANCE_SETTINGS.workingDays,
      cutoffTime: DEFAULT_ATTENDANCE_SETTINGS.cutoffTime,
      lateThresholdMins: DEFAULT_ATTENDANCE_SETTINGS.lateThresholdMins,
      autoAbsentAfterMins: DEFAULT_ATTENDANCE_SETTINGS.autoAbsentAfterMins,
      qrEnabled: DEFAULT_ATTENDANCE_SETTINGS.qrEnabled,
      lowAttendanceThreshold: DEFAULT_ATTENDANCE_SETTINGS.lowAttendanceThreshold,
      notifyParents: DEFAULT_ATTENDANCE_SETTINGS.notifyParents,
      requireNoteForAbsent: DEFAULT_ATTENDANCE_SETTINGS.requireNoteForAbsent,
      lockAfterSubmit: DEFAULT_ATTENDANCE_SETTINGS.lockAfterSubmit,
      trackHalfDay: DEFAULT_ATTENDANCE_SETTINGS.trackHalfDay,
      weeklyReport: DEFAULT_ATTENDANCE_SETTINGS.weeklyReport,
      attendanceAlerts: DEFAULT_ATTENDANCE_SETTINGS.attendanceAlerts,
      allowManualOverride: DEFAULT_ATTENDANCE_SETTINGS.allowManualOverride,
      offlineEnabled: DEFAULT_ATTENDANCE_SETTINGS.offlineEnabled,
      geoTagging: DEFAULT_ATTENDANCE_SETTINGS.geoTagging,
      defaultViewLayout: DEFAULT_ATTENDANCE_SETTINGS.defaultViewLayout || 'list',
    };
  }

  const prefs = raw as Partial<AttendanceModulePreferences>;
  return {
    workingDays: Array.isArray(prefs.workingDays) ? prefs.workingDays : DEFAULT_ATTENDANCE_SETTINGS.workingDays,
    cutoffTime: typeof prefs.cutoffTime === 'string' ? prefs.cutoffTime : DEFAULT_ATTENDANCE_SETTINGS.cutoffTime,
    lateThresholdMins: typeof prefs.lateThresholdMins === 'number' ? prefs.lateThresholdMins : DEFAULT_ATTENDANCE_SETTINGS.lateThresholdMins,
    autoAbsentAfterMins: typeof prefs.autoAbsentAfterMins === 'number' ? prefs.autoAbsentAfterMins : DEFAULT_ATTENDANCE_SETTINGS.autoAbsentAfterMins,
    qrEnabled: typeof prefs.qrEnabled === 'boolean' ? prefs.qrEnabled : DEFAULT_ATTENDANCE_SETTINGS.qrEnabled,
    lowAttendanceThreshold: typeof prefs.lowAttendanceThreshold === 'number' ? prefs.lowAttendanceThreshold : DEFAULT_ATTENDANCE_SETTINGS.lowAttendanceThreshold,
    notifyParents: typeof prefs.notifyParents === 'boolean' ? prefs.notifyParents : DEFAULT_ATTENDANCE_SETTINGS.notifyParents,
    requireNoteForAbsent: typeof prefs.requireNoteForAbsent === 'boolean' ? prefs.requireNoteForAbsent : DEFAULT_ATTENDANCE_SETTINGS.requireNoteForAbsent,
    lockAfterSubmit: typeof prefs.lockAfterSubmit === 'boolean' ? prefs.lockAfterSubmit : DEFAULT_ATTENDANCE_SETTINGS.lockAfterSubmit,
    trackHalfDay: typeof prefs.trackHalfDay === 'boolean' ? prefs.trackHalfDay : DEFAULT_ATTENDANCE_SETTINGS.trackHalfDay,
    weeklyReport: typeof prefs.weeklyReport === 'boolean' ? prefs.weeklyReport : DEFAULT_ATTENDANCE_SETTINGS.weeklyReport,
    attendanceAlerts: typeof prefs.attendanceAlerts === 'boolean' ? prefs.attendanceAlerts : DEFAULT_ATTENDANCE_SETTINGS.attendanceAlerts,
    allowManualOverride: typeof prefs.allowManualOverride === 'boolean' ? prefs.allowManualOverride : DEFAULT_ATTENDANCE_SETTINGS.allowManualOverride,
    offlineEnabled: typeof prefs.offlineEnabled === 'boolean' ? prefs.offlineEnabled : DEFAULT_ATTENDANCE_SETTINGS.offlineEnabled,
    geoTagging: typeof prefs.geoTagging === 'boolean' ? prefs.geoTagging : DEFAULT_ATTENDANCE_SETTINGS.geoTagging,
    defaultViewLayout: typeof prefs.defaultViewLayout === 'string' ? prefs.defaultViewLayout : DEFAULT_ATTENDANCE_SETTINGS.defaultViewLayout || 'list',
  };
}

/** Extracts field-config slice from a raw composed settings blob. */
export function normalizeAttendanceSettings(raw: unknown): AttendanceSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ATTENDANCE_SETTINGS };
  }

  const safe = raw as Partial<AttendanceSettings>;
  return {
    workingDays: DEFAULT_ATTENDANCE_SETTINGS.workingDays, // managed by preferences
    cutoffTime: DEFAULT_ATTENDANCE_SETTINGS.cutoffTime, // managed by preferences
    lateThresholdMins: DEFAULT_ATTENDANCE_SETTINGS.lateThresholdMins, // managed by preferences
    autoAbsentAfterMins: DEFAULT_ATTENDANCE_SETTINGS.autoAbsentAfterMins, // managed by preferences
    qrEnabled: DEFAULT_ATTENDANCE_SETTINGS.qrEnabled, // managed by preferences
    lowAttendanceThreshold: DEFAULT_ATTENDANCE_SETTINGS.lowAttendanceThreshold, // managed by preferences
    notifyParents: DEFAULT_ATTENDANCE_SETTINGS.notifyParents, // managed by preferences
    requireNoteForAbsent: DEFAULT_ATTENDANCE_SETTINGS.requireNoteForAbsent, // managed by preferences
    lockAfterSubmit: DEFAULT_ATTENDANCE_SETTINGS.lockAfterSubmit, // managed by preferences
    trackHalfDay: DEFAULT_ATTENDANCE_SETTINGS.trackHalfDay, // managed by preferences
    weeklyReport: DEFAULT_ATTENDANCE_SETTINGS.weeklyReport, // managed by preferences
    attendanceAlerts: DEFAULT_ATTENDANCE_SETTINGS.attendanceAlerts, // managed by preferences
    allowManualOverride: DEFAULT_ATTENDANCE_SETTINGS.allowManualOverride, // managed by preferences
    offlineEnabled: DEFAULT_ATTENDANCE_SETTINGS.offlineEnabled, // managed by preferences
    geoTagging: DEFAULT_ATTENDANCE_SETTINGS.geoTagging, // managed by preferences
    defaultViewLayout: DEFAULT_ATTENDANCE_SETTINGS.defaultViewLayout, // managed by preferences
    fields: safe.fields ?? DEFAULT_ATTENDANCE_SETTINGS.fields ?? {},
    customFields: safe.customFields ?? DEFAULT_ATTENDANCE_SETTINGS.customFields ?? [],
    fieldOrder: safe.fieldOrder ?? DEFAULT_ATTENDANCE_SETTINGS.fieldOrder ?? [],
    formTabs: safe.formTabs,
    enabledTabs: safe.enabledTabs,
    requiredTabs: safe.requiredTabs,
  };
}

/** Recomposes preferences and field-config into the legacy flat settings shape. */
export function composeAttendanceSettings(
  fieldConfig: AttendanceSettings | null,
  prefs: AttendanceModulePreferences,
  formTabs?: TabDefinition[]
): AttendanceSettings {
  return {
    ...(fieldConfig ?? DEFAULT_ATTENDANCE_SETTINGS),
    workingDays: prefs.workingDays,
    cutoffTime: prefs.cutoffTime,
    lateThresholdMins: prefs.lateThresholdMins,
    autoAbsentAfterMins: prefs.autoAbsentAfterMins,
    qrEnabled: prefs.qrEnabled,
    lowAttendanceThreshold: prefs.lowAttendanceThreshold,
    notifyParents: prefs.notifyParents,
    requireNoteForAbsent: prefs.requireNoteForAbsent,
    lockAfterSubmit: prefs.lockAfterSubmit,
    trackHalfDay: prefs.trackHalfDay,
    weeklyReport: prefs.weeklyReport,
    attendanceAlerts: prefs.attendanceAlerts,
    allowManualOverride: prefs.allowManualOverride,
    offlineEnabled: prefs.offlineEnabled,
    geoTagging: prefs.geoTagging,
    defaultViewLayout: prefs.defaultViewLayout,
    formTabs: formTabs ?? fieldConfig?.formTabs,
  };
}

/** Drops preference keys before saving field-config to avoid overriding prefs layer. */
export function stripAttendanceFieldConfigForPersist(
  config: Partial<AttendanceSettings>
): Partial<AttendanceSettings> {
  const { 
    workingDays,
    cutoffTime,
    lateThresholdMins,
    autoAbsentAfterMins,
    qrEnabled,
    lowAttendanceThreshold,
    notifyParents,
    requireNoteForAbsent,
    lockAfterSubmit,
    trackHalfDay,
    weeklyReport,
    attendanceAlerts,
    allowManualOverride,
    offlineEnabled,
    geoTagging,
    defaultViewLayout,
    ...fieldConfigOnly 
  } = config;
  return fieldConfigOnly;
}

export function mergeAttendanceFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {
  const documentOrDefault = documentFormTabs && documentFormTabs.length > 0 ? documentFormTabs : [];
  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
        ];
  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (!tab?.key || seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}
