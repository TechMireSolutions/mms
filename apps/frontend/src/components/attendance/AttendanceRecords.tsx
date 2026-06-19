import React, { useState, useMemo } from "react";
import { Search, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { DatePicker } from "../ui/DatePicker";
import { ATTENDANCE_STATUSES, AttendanceRecord } from '@/lib/data/attendanceData';
import { useSessionsCollection } from '@/hooks/useSessions';
import usePermissions from "@/hooks/usePermissions";
import StatusBadge from "./StatusBadge";
import StatusToggle from "./StatusToggle";
import { AttendanceFilterState } from "./AttendanceFilters";

const PAGE_SIZE = 15;

interface AttendanceRecordsProps {
  filters: AttendanceFilterState;
  role: string;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

/**
 * AttendanceRecords
 * 
 * Displays a paginated, filterable table of attendance records.
 * Allows inline editing and deletion for authorized roles.
 * 
 * @param {AttendanceRecordsProps} props - The component props.
 * @returns {React.ReactElement} The rendered records table component.
 */
export default function AttendanceRecords({ filters, role, records, setRecords }: AttendanceRecordsProps) {
  const { can } = usePermissions();
  const sessions = useSessionsCollection();
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.classes || []).map((c) => ({ ...c, sessionId: s.id, sessionName: s.name }))
    );
  }, [sessions]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // record id
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filters.classId && r.classId !== filters.classId) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (search && !r.studentName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [records, filters, statusFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateRecord = <K extends keyof AttendanceRecord>(id: string, key: K, value: AttendanceRecord[K]) =>
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, [key]: value } : r));

  const deleteRecord = (id: string) => {
    if (!can("users.manage")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const classLabel = (classId: string) => allClasses.find((c) => c.id === classId)?.name || classId;

  return (
    <section className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <label htmlFor="search-student" className="sr-only">Search student</label>
          <input 
            id="search-student"
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search student…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          />
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold" role="group" aria-label="Filter by status">
          <button 
            type="button"
            onClick={() => { setStatusFilter("all"); setPage(1); }}
            className={`px-3 py-2 transition-colors ${statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            All
          </button>
          {ATTENDANCE_STATUSES.map((s: { id: string; label: string; bg: string; text: string }) => (
            <button 
              type="button"
              key={s.id} 
              onClick={() => { setStatusFilter(s.id); setPage(1); }}
              className={`px-3 py-2 transition-colors ${statusFilter === s.id ? `${s.bg} ${s.text}` : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <DatePicker
          id="date-from"
          value={dateFrom}
          onChange={(val) => { setDateFrom(val); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 max-w-[150px]"
        />
        
        <DatePicker
          id="date-to"
          value={dateTo}
          onChange={(val) => { setDateTo(val); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 max-w-[150px]"
        />
      </div>

      {/* Table */}
      <article className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Class</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Student</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Time In</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Time Out</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Notes</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No attendance recorded</td></tr>
              ) : paginated.map((r) => (
                <motion.tr key={r.id} layout className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{classLabel(r.classId)}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{r.studentName}</td>
                  <td className="px-3 py-2.5">
                    {editing === r.id
                      ? <StatusToggle value={r.status} onChange={(v) => updateRecord(r.id, "status", v as AttendanceRecord["status"])} />
                      : <StatusBadge status={r.status} />
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    {editing === r.id
                      ? <input type="time" value={r.timeIn} onChange={(e) => updateRecord(r.id, "timeIn", e.target.value)}
                          aria-label="Time In"
                          className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none" />
                      : <span className="text-xs text-muted-foreground font-mono">{r.timeIn || "—"}</span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    {editing === r.id
                      ? <input type="time" value={r.timeOut} onChange={(e) => updateRecord(r.id, "timeOut", e.target.value)}
                          aria-label="Time Out"
                          className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none" />
                      : <span className="text-xs text-muted-foreground font-mono">{r.timeOut || "—"}</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px] truncate text-xs text-muted-foreground">{r.notes || "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {can("attendance.write") && (
                        <button 
                          onClick={() => setEditing(editing === r.id ? null : r.id)}
                          aria-label={editing === r.id ? "Cancel Edit" : "Edit Record"}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        >
                          {editing === r.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {can("users.manage") && (
                        <button 
                          onClick={() => deleteRecord(r.id)}
                          aria-label="Delete Record"
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Pagination */}
      <footer className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} records · Page {page} of {totalPages}</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setPage((p) => Math.max(1, p - 1))} 
            disabled={page === 1}
            aria-label="Previous Page"
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            aria-label="Next Page"
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </section>
  );
}
