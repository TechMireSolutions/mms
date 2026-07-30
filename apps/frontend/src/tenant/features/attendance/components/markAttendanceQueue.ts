import type { AuditEntry, OfflinePayload } from "@/tenant/features/attendance/components/markAttendanceTypes";

export const ATTENDANCE_OFFLINE_QUEUE_KEY = "att_offline_queue";
export const ATTENDANCE_AUDIT_KEY_PREFIX = "att_audit";

function auditStorageKey(classId: string, date: string): string {
  return `${ATTENDANCE_AUDIT_KEY_PREFIX}_${classId}_${date}`;
}

export function loadQueue(): OfflinePayload[] {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_OFFLINE_QUEUE_KEY) || "[]") as OfflinePayload[];
  } catch (error) {
    console.warn("Failed to load offline queue:", error);
    return [];
  }
}

export function saveQueue(queue: OfflinePayload[]): void {
  try {
    localStorage.setItem(ATTENDANCE_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save offline queue:", error);
  }
}

export function addAuditEntry(classId: string, date: string, entry: AuditEntry): void {
  try {
    const key = auditStorageKey(classId, date);
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as AuditEntry[];
    existing.unshift({ ...entry, ts: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  } catch (error) {
    console.error("Failed to save audit entry:", error);
  }
}

/**
 * Retrieves the audit log of attendance changes for a specific class and date.
 */
export function getAuditLog(classId: string, date: string): AuditEntry[] {
  try {
    const key = auditStorageKey(classId, date);
    return JSON.parse(localStorage.getItem(key) || "[]") as AuditEntry[];
  } catch (error) {
    console.error("Failed to read audit log:", error);
    return [];
  }
}
