import {
  type AttendanceModuleSettings as AttendanceSettings,
  DEFAULT_ATTENDANCE_SETTINGS as DEFAULT_ATT_SETTINGS
} from "@mms/shared";

export type { AttendanceSettings };
export { DEFAULT_ATT_SETTINGS };

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  status: "present" | "absent" | "late" | "excused";
  timeIn: string;
  timeOut: string;
  notes: string;
}

export const ATTENDANCE_STATUSES = [
  { id: "present", label: "Present", short: "P", color: "emerald", bg: "bg-success/10", text: "text-success", border: "border-success/30", dot: "bg-success" },
  { id: "absent",  label: "Absent",  short: "A", color: "red",     bg: "bg-destructive/10",     text: "text-destructive",     border: "border-destructive/30",     dot: "bg-destructive"     },
  { id: "late",    label: "Late",    short: "L", color: "amber",   bg: "bg-warning/10",   text: "text-warning",   border: "border-warning/30",   dot: "bg-warning"   },
  { id: "excused", label: "Excused", short: "E", color: "blue",    bg: "bg-info/10",    text: "text-info",    border: "border-info/30",    dot: "bg-info"    },
];

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export interface ClassStudent {
  id: string;
  name: string;
  gender: "male" | "female";
  rollNo: string;
}

export type AttendanceStatus = {
  id: string;
  label: string;
  short: string;
  color: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

export const STATUS_MAP: Record<string, AttendanceStatus> = {
  present: ATTENDANCE_STATUSES[0] as AttendanceStatus,
  absent: ATTENDANCE_STATUSES[1] as AttendanceStatus,
  late: ATTENDANCE_STATUSES[2] as AttendanceStatus,
  excused: ATTENDANCE_STATUSES[3] as AttendanceStatus
};

export const CLASS_STUDENTS: Record<string, ClassStudent[]> = {};

export function calcClassStats(classId: string, records: AttendanceRecord[]) {
  const classRecs = records.filter(r => r.classId === classId);
  let present = 0, absent = 0, late = 0, excused = 0;
  classRecs.forEach(r => {
    if (r.status === "present") present++;
    else if (r.status === "absent") absent++;
    else if (r.status === "late") late++;
    else if (r.status === "excused") excused++;
  });
  const total = present + absent + late + excused;
  const rate = total ? Math.round(((present + late) / total) * 100) : 0;
  return { present, absent, late, excused, rate };
}

export function calcStudentRate(studentId: string, records: AttendanceRecord[]): number {
  const studRecs = records.filter(r => r.studentId === studentId);
  const present = studRecs.filter(r => r.status === "present" || r.status === "late").length;
  const total = studRecs.length;
  return total ? Math.round((present / total) * 100) : 100;
}

export function getMonthlyTrend(classId: string, records: AttendanceRecord[]): { month: string; rate: number }[] {
  const classRecs = records.filter(r => r.classId === classId);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const grouped: Record<string, { present: number; total: number }> = {};
  classRecs.forEach(r => {
    if (!r.date) return;
    const dateObj = new Date(r.date);
    const m = months[dateObj.getMonth()];
    if (!grouped[m]) grouped[m] = { present: 0, total: 0 };
    grouped[m].total++;
    if (r.status === "present" || r.status === "late") {
      grouped[m].present++;
    }
  });
  return months.map(m => {
    const data = grouped[m];
    return {
      month: m,
      rate: data && data.total ? Math.round((data.present / data.total) * 100) : 90
    };
  });
}
