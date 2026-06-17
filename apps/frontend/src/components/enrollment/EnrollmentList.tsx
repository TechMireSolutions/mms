import React, { useState, useMemo } from "react";
import { Search, Eye, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ENROLLMENT_STATUSES, STATUS_MAP, Enrollment, EnrollmentStatus } from '@/lib/data/enrollmentData';
import { SESSIONS_DATA, Session } from '@/lib/data/sessionsData';
import { getCollection } from "../../lib/db";
import { STUDENTS, Student } from '@/lib/data/studentsData';

const PAGE_SIZE = 12;

interface EnrollmentListProps {
  enrollments: Enrollment[];
  role: string;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
}

/**
 * Renders a paginated, filterable table list of enrollment records.
 *
 * @param props - Component props.
 * @param props.enrollments - All active enrollment records.
 * @param props.role - Current user role.
 * @param props.onView - Callback when view action is triggered.
 * @param props.onCancel - Callback when cancel action is triggered.
 * @returns The EnrollmentList component.
 */
export default function EnrollmentList({ enrollments, role, onView, onCancel }: EnrollmentListProps): React.ReactElement {
  const [search, setSearch]         = useState<string>("");
  const [statusFilter, setStatus]   = useState<string>("all");
  const [sessionFilter, setSession] = useState<string>("all");
  const [page, setPage]             = useState<number>(1);

  const sessions = useMemo<Session[]>(() => getCollection<Session>("sessions", SESSIONS_DATA), []);
  const students = useMemo(() => getCollection<Student>("students", STUDENTS), []);

  const filtered = useMemo<Enrollment[]>(() => {
    return enrollments.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (sessionFilter !== "all" && e.sessionId !== sessionFilter) return false;
      if (search && !e.studentName.toLowerCase().includes(search.toLowerCase()) &&
          !e.sessionName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [enrollments, search, statusFilter, sessionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusInfo = (s: string): EnrollmentStatus => STATUS_MAP[s] || { id: s as EnrollmentStatus["id"], label: s, color: "bg-muted text-muted-foreground border-border" };

  const paymentColor = (s: string): string => {
    if (s === "paid")    return "text-success";
    if (s === "pending") return "text-warning";
    if (s === "overdue") return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <section className="space-y-4" aria-label="Enrollment list interface">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search student or session…"
            aria-label="Search student or session"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status pills */}
        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold" role="group" aria-label="Filter by status">
          <button
            type="button"
            onClick={() => { setStatus("all"); setPage(1); }}
            className={`px-3 py-2 transition-colors ${statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            All
          </button>
          {ENROLLMENT_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { setStatus(s.id); setPage(1); }}
              className={`px-3 py-2 transition-colors ${statusFilter === s.id ? `${s.color} border-0` : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Session filter */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-session" className="sr-only">Session</label>
          <select
            id="filter-session"
            value={sessionFilter}
            onChange={(e) => { setSession(e.target.value); setPage(1); }}
            className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card" role="status">
          <Search className="w-10 h-10 text-muted-foreground/30 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">No enrollments found</p>
          <p className="text-xs text-muted-foreground mt-1">Try changing filters or create a new enrollment.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/40 backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b border-border/50">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Student</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Session</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Class</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Date</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Fee</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Status</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Payment</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {paginated.map((enr) => {
                  const s = statusInfo(enr.status);
                  const student = students.find((st) => String(st.id) === String(enr.studentId));
                  return (
                    <motion.tr key={enr.id} layout className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{enr.studentName}</span>
                          {student?.grNumber && (
                            <span className="text-[10px] text-primary font-bold">GR: {student.grNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground max-w-[160px] truncate">{enr.sessionName}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{enr.className || "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{enr.enrolledDate}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-foreground whitespace-nowrap">
                        PKR {enr.finalFee?.toLocaleString()}
                        {enr.discountPct > 0 && (
                          <span className="ml-1 text-[10px] text-success font-normal" aria-label={`Discount percentage: ${enr.discountPct} percent`}>–{enr.discountPct}%</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-semibold capitalize ${paymentColor(enr.paymentStatus)}`}>
                          {enr.paymentStatus || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onView(enr)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            aria-label={`View details of ${enr.studentName}'s enrollment`}
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          {role !== "accountant" && enr.status !== "cancelled" && enr.status !== "completed" && (
                            <button
                              type="button"
                              onClick={() => onCancel(enr.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Cancel enrollment of ${enr.studentName}`}
                              title="Cancel"
                            >
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground" role="navigation" aria-label="Pagination control">
        <span>{filtered.length} enrollment{filtered.length !== 1 ? "s" : ""} · Page {page} of {totalPages}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
