import React, { useState, useEffect, useMemo, useCallback } from "react";
import { formatDateTime, type AppTranslationKey } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { getAuditLog } from "@/tenant/features/attendance/components/MarkAttendance";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import { useTranslation } from "@/hooks/useTranslation";

const ACTION_LABELS: Record<string, { labelKey: string; color: string }> = {
  edit:        { labelKey: "attendance.audit.action.edit",    color: "bg-info/10 text-info border-info/30" },
  bulk_mark:   { labelKey: "attendance.audit.action.bulkMark",    color: "bg-warning/10 text-warning border-warning/30" },
  submitted:   { labelKey: "attendance.audit.action.submitted",    color: "bg-success/10 text-success border-success/30" },
  draft_saved: { labelKey: "attendance.audit.action.draftSaved",  color: "bg-muted text-muted-foreground border-border" },
};

export interface AuditEntry {
  ts?: string | number;
  action: string;
  studentId?: string;
  field?: string;
  from?: string;
  to?: string;
  studentName?: string;
  count?: number;
  status?: string;
  geo?: boolean | { lat: number; lng: number } | null;
  by?: string;
}

interface AuditLogProps {
  filters: Partial<AttendanceFilterState>;
}

function formatTimestamp(timestamp?: string | number): string {
  if (timestamp === undefined) return "—";
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  return formatDateTime(date);
}

import { useStudentsByIds } from "@/tenant/features/students/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";

function describeEntry(entry: AuditEntry, studentNameFor: (id?: string) => string, t: any): string {
  if (entry.action === "edit") {
    const studentLabel = studentNameFor(entry.studentId) || entry.studentName || "student";
    return t("attendance.audit.desc.edit", { field: entry.field, from: entry.from, to: entry.to, name: studentLabel });
  }
  if (entry.action === "bulk_mark") {
    return t("attendance.audit.desc.bulkMark", { count: entry.count, status: entry.status });
  }
  if (entry.action === "submitted") {
    return entry.geo
      ? t("attendance.audit.desc.submittedGeo", { count: entry.count })
      : t("attendance.audit.desc.submitted", { count: entry.count });
  }
  if (entry.action === "draft_saved") {
    return t("attendance.audit.desc.draftSaved");
  }
  return entry.action;
}

/**
 * AuditLog
 * 
 * Displays a log of actions taken regarding attendance (e.g., editing, bulk marking).
 * Allows filtering by class and date.
 * 
 * @param {AuditLogProps} props - The component props.
 * @returns {React.ReactElement} The rendered audit log component.
 */
export function AuditLog({ filters }: AuditLogProps) {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const [log, setLog] = useState<AuditEntry[]>([]);
  const studentIds = useMemo(() => uniqueRegistryIds(log.map((entry) => entry.studentId)), [log]);
  const { data: students = [] } = useStudentsByIds(studentIds);

  const studentNameFor = (id?: string): string => {
    if (!id) return "";
    return students.find((student) => String(student.id) === String(id))?.name ?? "";
  };
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const [classId, setClassId] = useState(filters.classId || "");
  const [date, setDate] = useState(filters.date || new Date().toISOString().slice(0, 10));

  const reload = useCallback(() => {
    try {
      const result = getAuditLog(classId, date);
      setLog(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to load audit log", error);
      setLog([]);
    }
  }, [classId, date]);

  useEffect(() => { reload(); }, [reload]);
  
  useEffect(() => {
    if (filters.classId) setClassId(filters.classId);
    if (filters.date)    setDate(filters.date);
  }, [filters.classId, filters.date]);

  return (
    <section className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">{t("attendance.audit.title")}</h2>
          <span className="text-[11px] text-muted-foreground">{t("attendance.audit.entriesCount", { count: log.length })}</span>
        </div>
        <Button 
          type="button"
          variant="outline"
          size="icon"
          onClick={reload} 
          aria-label={t("attendance.audit.reload")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <label htmlFor="audit-class-select" className="sr-only">{t("attendance.audit.filterClass")}</label>
        <select 
          id="audit-class-select"
          value={classId} 
          onChange={(event) => setClassId(event.target.value)}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">{t("attendance.audit.allClasses")}</option>
          {allClasses.map((sessionClass) => <option key={sessionClass.id} value={sessionClass.id}>{sessionClass.name}</option>)}
        </select>
        
        <DatePicker
          id="audit-date-select"
          value={date}
          onChange={setDate}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2"
        />
      </div>

      {/* Log */}
      {log.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">{t("attendance.audit.emptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("attendance.audit.emptyDesc")}</p>
        </div>
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("attendance.audit.colTime")}</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("attendance.audit.colAction")}</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("attendance.audit.colDetails")}</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("attendance.audit.colBy")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {log.map((entry, index) => {
                const actionLabel = ACTION_LABELS[entry.action] || { labelKey: entry.action as AppTranslationKey, color: "bg-muted text-muted-foreground border-border" };
                return (
                  <tr key={index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 text-[11px] font-mono text-muted-foreground whitespace-nowrap">{formatTimestamp(entry.ts)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${actionLabel.color}`}>{t(actionLabel.labelKey as AppTranslationKey)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{describeEntry(entry, studentNameFor, t)}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-muted-foreground capitalize">{entry.by || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
