import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, ChevronUp, X, Calendar } from "lucide-react";
import { DatePicker } from "../ui/DatePicker";
import { getCollection } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';

const STATUSES: string[] = ["all", "active", "inactive", "completed"];

export interface ReportFilterFields {
  session: string;
  class: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  student: string;
}

interface ReportFiltersProps {
  category: string;
  filters: ReportFilterFields;
  onChange: (filters: ReportFilterFields) => void;
}

const CATEGORY_FILTERS: Record<string, (keyof ReportFilterFields)[]> = {
  attendance: ["session", "class", "dateFrom", "dateTo", "student"],
  students:   ["session", "class", "status", "student"],
  contacts:   ["status", "student"],
  financial:  ["session", "dateFrom", "dateTo", "status"],
  academic:   ["session", "class", "status", "student"],
  hasanat:    ["session", "class", "dateFrom", "dateTo"],
  sessions:   ["status"],
};

export default function ReportFilters({ category, filters, onChange }: ReportFiltersProps): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(true);

  const allowed = CATEGORY_FILTERS[category] || ["session", "class", "status", "dateFrom", "dateTo", "student"];

  const rawSessions = useLiveCollection<Session>("sessions", SESSIONS_DATA);

  const sessions = useMemo(() => {
    return [{ id: "all", name: "All Sessions" }, ...rawSessions.map(s => ({ id: s.id, name: s.name }))];
  }, [rawSessions]);

  const classes = useMemo(() => {
    const uniqueClasses = new Set<string>();
    rawSessions.forEach(s => (s.classes || []).forEach(c => uniqueClasses.add(c.name)));
    return [{ id: "all", name: "All Classes" }, ...Array.from(uniqueClasses).map(name => ({ id: name, name }))];
  }, [rawSessions]);

    const set = (key: keyof ReportFilterFields, value: string): void => {

    onChange({ ...filters, [key]: value });
  };

  const activeCount = [
    filters.session !== "all",
    filters.class !== "all",
    filters.status !== "all",
    !!(filters.dateFrom || filters.dateTo),
    !!filters.student,
  ].filter(Boolean).length;

  const reset = (): void => {
    onChange({
      session: "all",
      class: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
      student: "",
    });
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              type="button"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Filter fields */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
              {/* Session */}
              {allowed.includes("session") && (
                <div className="flex flex-col gap-1 text-left min-w-[140px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Session</label>
                  <select
                    value={filters.session}
                    onChange={(e) => set("session", e.target.value)}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class */}
              {allowed.includes("class") && (
                <div className="flex flex-col gap-1 text-left min-w-[140px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                  <select
                    value={filters.class}
                    onChange={(e) => set("class", e.target.value)}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              {allowed.includes("status") && (
                <div className="flex flex-col gap-1 text-left min-w-[120px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => set("status", e.target.value)}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date From */}
              {allowed.includes("dateFrom") && (
                <div className="flex flex-col gap-1 text-left min-w-[130px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" />From</label>
                  <DatePicker
                    value={filters.dateFrom}
                    onChange={(val) => set("dateFrom", val)}
                  />
                </div>
              )}

              {/* Date To */}
              {allowed.includes("dateTo") && (
                <div className="flex flex-col gap-1 text-left min-w-[130px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" />To</label>
                  <DatePicker
                    value={filters.dateTo}
                    onChange={(val) => set("dateTo", val)}
                  />
                </div>
              )}

              {/* Student */}
              {allowed.includes("student") && (
                <div className="flex flex-col gap-1 text-left min-w-[150px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Student</label>
                  <input
                    type="text"
                    value={filters.student}
                    onChange={(e) => set("student", e.target.value)}
                    placeholder="Search name…"
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
