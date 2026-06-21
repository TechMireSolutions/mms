import React, { useMemo } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { runFullEligibility, CheckResult } from '@/lib/data/enrollmentData';
import { Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';

const ICONS: Record<string, React.ReactElement> = {
  pass: <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />,
  fail: <XCircle className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />,
  warn: <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" aria-hidden="true" />,
};

const ROW_COLORS: Record<string, string> = {
  pass: "bg-success/10 border-success/30",
  fail: "bg-destructive/10 border-destructive/30",
  warn: "bg-warning/10 border-warning/30",
};

const LABEL_COLORS: Record<string, string> = {
  pass: "text-success",
  fail: "text-destructive",
  warn: "text-warning",
};

interface Step3EligibilityProps {
  student: Student;
  session: Session;
  suggestedClass: Class | null;
}

export default function Step3Eligibility({ student, session, suggestedClass }: Step3EligibilityProps): React.ReactElement {
  const checks = useMemo<CheckResult[]>(() =>
    runFullEligibility(student, session, suggestedClass, []),
    [student, session, suggestedClass]
  );

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const canProceed = failCount === 0;

  return (
    <section className="space-y-4" aria-labelledby="step3-title">
      <div>
        <h3 id="step3-title" className="text-base font-bold text-foreground">Eligibility Check</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Checking <strong>{student.name}</strong> for <strong>{session.name}</strong>
        </p>
      </div>

      {/* Summary bar */}
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

      {/* Check rows */}
      <div className="space-y-2" role="list" aria-label="Eligibility check details">
        {checks.map((c) => (
          <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border ${ROW_COLORS[c.status]}`} role="listitem">
            <div className="mt-0.5">{ICONS[c.status]}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${LABEL_COLORS[c.status]}`}>{c.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Result banner */}
      {canProceed ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold" role="status">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Student is eligible — you may proceed to class assignment.
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold" role="alert">
          <XCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {failCount} eligibility check{failCount > 1 ? "s" : ""} failed. Review issues above before proceeding.
        </div>
      )}
    </section>
  );
}
