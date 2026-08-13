import type { TabDefinition } from "./contactTypes.js";
import type { ModuleCustomField, ModuleFieldDef } from "./moduleFieldSchema.js";

// ─── Attendance Module Settings ───────────────────────────────────────────────

export interface AttendanceSettings {
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
  defaultViewLayout?: string;
  fields?: Record<string, unknown>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  cutoffTime: "09:30",
  lateThresholdMins: 15,
  autoAbsentAfterMins: 30,
  qrEnabled: false,
  lowAttendanceThreshold: 75,
  notifyParents: true,
  requireNoteForAbsent: true,
  lockAfterSubmit: true,
  trackHalfDay: true,
  weeklyReport: true,
  attendanceAlerts: true,
  allowManualOverride: true,
  offlineEnabled: false,
  geoTagging: false,
  defaultViewLayout: "list",
  fields: {
    status: { enabled: true, required: true },
    timeIn: { enabled: true, required: true },
    timeOut: { enabled: true, required: true },
    notes: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["status", "timeIn", "timeOut", "notes"],
};

export const DEFAULT_ATTENDANCE_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "status", label: "Attendance Status", required: true },
  { id: "timeIn", label: "Time In" },
  { id: "timeOut", label: "Time Out" },
  { id: "notes", label: "Notes / Comments" },
];
