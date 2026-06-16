import React, { useState, useMemo } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DatePicker } from "../ui/DatePicker";
import { SESSIONS_DATA, TEACHERS } from '@/lib/data/sessionsData';
import { useLiveCollection } from "../../hooks/useLiveCollection";

export interface AttendanceFilterState {
  sessionId: string;
  classId: string;
  teacherId: string;
  date: string;
}

interface AttendanceFiltersProps {
  filters: AttendanceFilterState;
  onChange: (newFilters: AttendanceFilterState) => void;
}

interface ClassInfo {
  id: string;
  name: string;
  sessionId?: string;
  sessionName?: string;
}

interface Session {
  id: string;
  name: string;
  classes?: ClassInfo[];
}

/**
 * AttendanceFilters
 * 
 * A collapsible filter component for the attendance records view.
 * Allows filtering by session, class, teacher, and date.
 * 
 * @param {AttendanceFiltersProps} props - The component props.
 * @returns {React.ReactElement} The rendered filters component.
 */
export default function AttendanceFilters({ filters, onChange }: AttendanceFiltersProps) {
  const [open, setOpen] = useState(true);
  const sessions = useLiveCollection<Session>("sessions", SESSIONS_DATA as Session[]);
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.classes || []).map((c) => ({ ...c, sessionId: s.id, sessionName: s.name }))
    );
  }, [sessions]);

  const set = (k: keyof AttendanceFilterState, v: string) => onChange({ ...filters, [k]: v });

  const sessionClasses = filters.sessionId
    ? allClasses.filter((c) => c.sessionId === filters.sessionId)
    : allClasses;

  const today = new Date().toISOString().slice(0, 10);
  
  const activeCount = [
    filters.sessionId,
    filters.classId,
    filters.teacherId,
    filters.date && filters.date !== today,
  ].filter(Boolean).length;

  const reset = () => onChange({
    sessionId: "",
    classId: "",
    teacherId: "",
    date: today,
  });

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filters-panel"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground m-0">Filters</h2>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{activeCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="filters-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Session */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-session" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Session</label>
                <select 
                  id="filter-session"
                  value={filters.sessionId} 
                  onChange={(e) => set("sessionId", e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Sessions</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Class */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-class" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                <select 
                  id="filter-class"
                  value={filters.classId} 
                  onChange={(e) => set("classId", e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Classes</option>
                  {sessionClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Teacher */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-teacher" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Teacher</label>
                <select 
                  id="filter-teacher"
                  value={filters.teacherId} 
                  onChange={(e) => set("teacherId", e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Teachers</option>
                  {TEACHERS.map((t: { id: string; name: string }) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-date" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
                <DatePicker
                  id="filter-date"
                  value={filters.date}
                  onChange={(val) => set("date", val)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
