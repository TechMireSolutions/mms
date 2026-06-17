import React, { useState, useMemo } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";
import { STUDENTS, calcAge, Student } from '@/lib/data/studentsData';
import { SESSIONS_DATA, Session } from '@/lib/data/sessionsData';
import { runFullEligibility, suggestClass, CheckResult } from '@/lib/data/enrollmentData';
import { FORM_LABEL, FORM_SELECT } from "@/components/ui/formStyles";
import { getCollection } from "../../lib/db";

const ICONS: Record<string, React.ReactElement> = {
  pass: <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />,
  fail: <XCircle      className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />,
  warn: <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" aria-hidden="true" />,
};

const ROW_BG: Record<string, string> = {
  pass: "bg-success/10 border-success/30",
  fail: "bg-destructive/10 border-destructive/30",
  warn: "bg-warning/10 border-warning/30",
};

const LABEL_COL: Record<string, string> = {
  pass: "text-success",
  fail: "text-destructive",
  warn: "text-warning",
};

/**
 * Eligibility Check component to check a student's eligibility for any session dynamically.
 *
 * @returns The EligibilityCheck component.
 */
export default function EligibilityCheck(): React.ReactElement {
  const [students] = useState<Student[]>(() => getCollection<Student>("students", STUDENTS));
  const [sessions] = useState<Session[]>(() => getCollection<Session>("sessions", SESSIONS_DATA));
  const [studentId, setStudentId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");

  const student = students.find((s) => s.id === studentId);
  const session = sessions.find((s) => s.id === sessionId);
  const suggested = student && session ? suggestClass(student, session) : null;

  const checks = useMemo<CheckResult[]>(() => {
    if (!student || !session) return [];
    return runFullEligibility(student, session, suggested, students);
  }, [student, session, suggested, students]);

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const passCount = checks.filter((c) => c.status === "pass").length;

  return (
    <article className="max-w-2xl space-y-5" aria-labelledby="eligibility-title">
      <div>
        <h3 id="eligibility-title" className="text-base font-bold text-foreground">Eligibility Check</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Verify a student's eligibility for any session without creating an enrollment.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="select-student" className={FORM_LABEL}>Student</label>
          <select
            id="select-student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={FORM_SELECT}
          >
            <option value="">— Select student —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.grNumber ? ` (GR: ${s.grNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="select-session" className={FORM_LABEL}>Session</label>
          <select
            id="select-session"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className={FORM_SELECT}
          >
            <option value="">— Select session —</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Student preview */}
      {student && (
        <section className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted border border-border" aria-label="Student details preview">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{student.name.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">{student.name}</p>
              {student.grNumber && (
                <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase">
                  GR: {student.grNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {student.gender} · Age {calcAge(student.dob) ?? "?"} · {student.city}
            </p>
          </div>
        </section>
      )}

      {/* Results */}
      {checks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center rounded-xl border border-dashed border-border" role="status">
          <Search className="w-10 h-10 text-muted-foreground/30 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Select a student and session to check eligibility</p>
        </div>
      )}

      {checks.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 flex-wrap" role="status" aria-label="Validation summary">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
              <span className="text-xs font-bold text-success">{passCount} Passed</span>
            </div>
            {failCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/30">
                <XCircle className="w-3.5 h-3.5 text-destructive" aria-hidden="true" />
                <span className="text-xs font-bold text-destructive">{failCount} Failed</span>
              </div>
            )}
            {warnCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/10 border border-warning/30">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
                <span className="text-xs font-bold text-warning">{warnCount} Warnings</span>
              </div>
            )}
          </div>

          {/* Check rows */}
          <div className="space-y-2" role="list" aria-label="Eligibility checks list">
            {checks.map((c) => (
              <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border ${ROW_BG[c.status]}`} role="listitem">
                <div className="mt-0.5">{ICONS[c.status]}</div>
                <div>
                  <p className={`text-xs font-bold ${LABEL_COL[c.status]}`}>{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested class */}
          {suggested && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20" role="status">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">Suggested Class: {suggested.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {suggested.teacherName} · {suggested.room || "TBD"} · {suggested.capacity - suggested.enrolled} spots left
                </p>
              </div>
            </div>
          )}

          {/* Verdict */}
          {failCount === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold" role="status">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Student is eligible for this session.
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold" role="alert">
              <XCircle className="w-4 h-4" aria-hidden="true" /> Not eligible — {failCount} check{failCount > 1 ? "s" : ""} failed.
            </div>
          )}
        </div>
      )}
    </article>
  );
}
