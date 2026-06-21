import React, { useState, useMemo } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { calcAge } from '@/lib/data/studentsData';
import { SESSIONS_DATA, Session } from '@/lib/data/sessionsData';
import { runFullEligibility, suggestClass, CheckResult } from '@/lib/data/enrollmentData';
import { FORM_LABEL, FORM_SELECT } from "@/components/ui/formStyles";
import { getCollection } from "../../lib/db";
import { useStudentsByIds } from "@/hooks/useStudents";
import RegistryPersonSelect from "@/components/ui/RegistryPersonSelect";

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

export default function EligibilityCheck(): React.ReactElement {
  const [sessions] = useState<Session[]>(() => getCollection<Session>("sessions", SESSIONS_DATA));
  const [studentId, setStudentId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");

  const { data: resolvedStudents = [] } = useStudentsByIds(studentId ? [studentId] : []);
  const student = resolvedStudents[0];
  const session = sessions.find((s) => s.id === sessionId);
  const suggested = student && session ? suggestClass(student, session) : null;

  const checks = useMemo<CheckResult[]>(() => {
    if (!student || !session) return [];
    return runFullEligibility(student, session, suggested, []);
  }, [student, session, suggested]);

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
        <RegistryPersonSelect
          kind="student"
          id="select-student"
          label="Student"
          value={studentId}
          onChange={setStudentId}
        />
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
            <p className="text-xs text-muted-foreground mt-0.5">
              Age {calcAge(student.dob) ?? "?"} · {student.gender} · {student.city || "No city"}
            </p>
          </div>
        </section>
      )}

      {student && session && (
        <>
          <div className="flex items-center gap-3 flex-wrap" role="status" aria-label="Eligibility summary">
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
                <span className="text-xs font-bold text-warning">{warnCount} Warning{warnCount > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          <div className="space-y-2" role="list" aria-label="Eligibility check details">
            {checks.map((c) => (
              <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border ${ROW_BG[c.status]}`} role="listitem">
                <div className="mt-0.5">{ICONS[c.status]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${LABEL_COL[c.status]}`}>{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
