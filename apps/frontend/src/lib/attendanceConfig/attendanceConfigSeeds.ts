import type { AttendanceModuleSettings } from "@mms/shared";
import type { AttendanceStatus } from "@/lib/data/attendanceData";

export const ATTENDANCE_CONFIG_COLLECTION_KEYS = {
  statuses: "attendanceStatuses",
} as const;

export interface AttendanceConfigDefaults {
  statuses: AttendanceStatus[];
  settings: AttendanceModuleSettings;
}

export function getAttendanceConfigCollectionDefaults(): Pick<AttendanceConfigDefaults, "statuses"> {
  return {
    statuses: [
      { id: "present", label: "Present", short: "P", color: "emerald", bg: "bg-success/10", text: "text-success", border: "border-success/30", dot: "bg-success" },
      { id: "absent",  label: "Absent",  short: "A", color: "red",     bg: "bg-destructive/10",     text: "text-destructive",     border: "border-destructive/30",     dot: "bg-destructive" },
      { id: "late",    label: "Late",    short: "L", color: "amber",   bg: "bg-warning/10",   text: "text-warning",   border: "border-warning/30",   dot: "bg-warning" },
      { id: "excused", label: "Excused", short: "E", color: "blue",    bg: "bg-info/10",    text: "text-info",    border: "border-info/30",    dot: "bg-info" },
    ],
  };
}
