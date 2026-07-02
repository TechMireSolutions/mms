import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DatePicker } from "../ui/DatePicker";
import { Button } from "../ui/button";
import { FormSelect } from "../ui/FormSelect";
import { useSessionsCollection } from '@/hooks/useSessions';
import { useTeachersPaginated } from '@/hooks/useTeachers';
import { TEACHERS_MODULE_CONTRACT } from '@mms/shared';
import { activeTeachersForAssignment } from '@/lib/teachers/teacherAssignment';
import { useTranslation } from '@/hooks/useTranslation';

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
export function AttendanceFilters({ filters, onChange }: AttendanceFiltersProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const sessions = useSessionsCollection();
  const { data: activeTeachersPage } = useTeachersPaginated({
    page: 1,
    limit: TEACHERS_MODULE_CONTRACT.maxPageSize,
    status: 'active',
  });
  const assignableTeachers = useMemo(
    () => activeTeachersForAssignment((activeTeachersPage?.teachers ?? []) as import('@mms/shared').Teacher[]),
    [activeTeachersPage],
  );
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const setFilterValue = (key: keyof AttendanceFilterState, value: string) => onChange({ ...filters, [key]: value });

  const sessionClasses = filters.sessionId
    ? allClasses.filter((sessionClass) => sessionClass.sessionId === filters.sessionId)
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
    <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-controls="filters-panel"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors h-auto rounded-none justify-between hover:text-foreground"
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
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => { event.stopPropagation(); reset(); }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors h-auto p-0 hover:bg-transparent"
            >
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </Button>

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
                <FormSelect
                  id="filter-session"
                  value={filters.sessionId}
                  onChange={(value) => setFilterValue("sessionId", value)}
                  placeholder="All Sessions"
                  options={sessions.map((session) => ({ value: session.id, label: session.name }))}
                />
              </div>

              {/* Class */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-class" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                <FormSelect
                  id="filter-class"
                  value={filters.classId}
                  onChange={(value) => setFilterValue("classId", value)}
                  placeholder="All Classes"
                  options={sessionClasses.map((sessionClass) => ({ value: sessionClass.id, label: sessionClass.name }))}
                />
              </div>

              {/* Teacher */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-teacher" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Teacher</label>
                <FormSelect
                  id="filter-teacher"
                  value={filters.teacherId}
                  onChange={(value) => setFilterValue("teacherId", value)}
                  placeholder={t('attendance.filters.allTeachers')}
                  options={assignableTeachers.map((teacher) => ({ value: teacher.id, label: teacher.name || "Unknown" }))}
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-date" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
                <DatePicker
                  id="filter-date"
                  value={filters.date}
                  onChange={(value) => setFilterValue("date", value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
