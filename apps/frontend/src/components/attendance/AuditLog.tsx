import React, { useState, useEffect, useMemo } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { DatePicker } from "../ui/DatePicker";
import { getAuditLog } from "./MarkAttendance";
import { useSessionsCollection } from '@/hooks/useSessions';
import { AttendanceFilterState } from "./AttendanceFilters";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  edit:        { label: "Field Edit",    color: "bg-info/10 text-info border-info/30" },
  bulk_mark:   { label: "Bulk Mark",    color: "bg-warning/10 text-warning border-warning/30" },
  submitted:   { label: "Submitted",    color: "bg-success/10 text-success border-success/30" },
  draft_saved: { label: "Draft Saved",  color: "bg-muted text-muted-foreground border-border" },
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

function fmt(ts?: string | number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · " + d.toLocaleDateString();
}

import { useStudentsByIds } from "@/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";

function describeEntry(e: AuditEntry, studentNameFor: (id?: string) => string): string {
  if (e.action === "edit") {
    const who = studentNameFor(e.studentId) || e.studentName || "student";
    return `Changed ${e.field} from "${e.from}" → "${e.to}" for ${who}`;
  }
  if (e.action === "bulk_mark")   return `Marked all ${e.count} students as ${e.status}`;
  if (e.action === "submitted")   return `Submitted ${e.count} records${e.geo ? ` · geo-tagged` : ""}`;
  if (e.action === "draft_saved") return `Saved as draft`;
  return e.action;
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
export default function AuditLog({ filters }: AuditLogProps) {
  const sessions = useSessionsCollection();
  const [log, setLog] = useState<AuditEntry[]>([]);
  const studentIds = useMemo(() => uniqueRegistryIds(log.map((entry) => entry.studentId)), [log]);
  const { data: students = [] } = useStudentsByIds(studentIds);

  const studentNameFor = (id?: string): string => {
    if (!id) return "";
    return students.find((s) => String(s.id) === String(id))?.name ?? "";
  };
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.classes || []).map((c) => ({ ...c, sessionId: s.id, sessionName: s.name }))
    );
  }, [sessions]);

  const [classId, setClassId] = useState(filters.classId || "");
  const [date, setDate] = useState(filters.date || new Date().toISOString().slice(0, 10));

  const reload = () => {
    try {
      const result = getAuditLog(classId, date);
      setLog(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Failed to load audit log", err);
      setLog([]);
    }
  };

  useEffect(() => { reload(); }, [classId, date]);
  
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
          <h2 className="text-sm font-bold text-foreground m-0">Audit Log</h2>
          <span className="text-[11px] text-muted-foreground">({log.length} entries)</span>
        </div>
        <button 
          onClick={reload} 
          aria-label="Reload Audit Log"
          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <label htmlFor="audit-class-select" className="sr-only">Filter by Class</label>
        <select 
          id="audit-class-select"
          value={classId} 
          onChange={(e) => setClassId(e.target.value)}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Classes</option>
          {allClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          <p className="text-sm font-semibold text-foreground">No audit entries found</p>
          <p className="text-xs text-muted-foreground mt-1">Entries appear when attendance is marked or edited.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Time</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Action</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Details</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {log.map((e, i) => {
                const a = ACTION_LABELS[e.action] || { label: e.action, color: "bg-muted text-muted-foreground border-border" };
                return (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 text-[11px] font-mono text-muted-foreground whitespace-nowrap">{fmt(e.ts)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${a.color}`}>{a.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{describeEntry(e, studentNameFor)}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-muted-foreground capitalize">{e.by || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
