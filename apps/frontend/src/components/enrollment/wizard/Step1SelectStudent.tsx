import React, { useState, useMemo } from "react";
import { Search, User, Calendar } from "lucide-react";
import { calcAge, Student } from '@/lib/data/studentsData';
import { FORM_INPUT_ICON } from "@/components/ui/formStyles";
import { Session } from '@/lib/data/sessionsData';

interface Step1SelectStudentProps {
  value: Student | null | undefined;
  onChange: (student: Student) => void;
  students?: Student[];
  sessions?: Session[];
}

/**
 * Step 1 component for selecting a student to enroll.
 *
 * @param props - Component props.
 * @param props.value - Selected student object.
 * @param props.onChange - Callback when student selection changes.
 * @param props.students - Dynamic list of registered students.
 * @param props.sessions - Dynamic list of sessions.
 * @returns The Step1SelectStudent component.
 */
export default function Step1SelectStudent({ value, onChange, students = [], sessions = [] }: Step1SelectStudentProps): React.ReactElement {
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo<Student[]>(() =>
    students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [search, students]
  );

  const sessionName = (sid: string): string => sessions.find((s) => s.id === sid)?.name || sid;

  return (
    <section className="space-y-4" aria-labelledby="step1-title">
      <div>
        <h3 id="step1-title" className="text-base font-bold text-foreground">Select Student</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Choose a registered student to enroll.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name…"
          aria-label="Search students by name"
          className={FORM_INPUT_ICON + " pr-4"}
        />
      </div>

      {/* Student Cards */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1" role="radiogroup" aria-label="Students list">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm" role="status">No students found</div>
        )}
        {filtered.map((st) => {
          const age = calcAge(st.dob);
          const selected = value?.id === st.id;
          return (
            <button
              key={st.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(st)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">{st.name}</p>
                  {st.grNumber && (
                    <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase tracking-wider">
                      GR: {st.grNumber}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    st.gender === "male" ? "bg-info/15 text-info" : "bg-secondary/15 text-secondary"
                  }`}>{st.gender}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    st.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>{st.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" /> Age {age ?? "?"}</span>
                  <span>Father: {st.fatherName}</span>
                  {st.city && <span>{st.city}</span>}
                </div>
                {st.enrolledSessions && st.enrolledSessions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {st.enrolledSessions.map((sid) => (
                      <span key={sid} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {sessionName(sid)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
