import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { runEligibilityChecks, Student, StudentSession, EligibilityResult } from '@/lib/data/studentsData';

const STATUS_CONFIG = {
  pass: { Icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/20", bar: "bg-success", label: "Pass" },
  fail: { Icon: XCircle,      color: "text-destructive",     bg: "bg-destructive/10 border-destructive/20",         bar: "bg-destructive",     label: "Fail" },
  warn: { Icon: AlertTriangle,color: "text-warning",   bg: "bg-warning/10 border-warning/20",     bar: "bg-warning",   label: "Warning" },
};

interface CheckRowProps {
  check: EligibilityResult;
  index: number;
}

/**
 * Row displaying an individual eligibility check result.
 *
 * @param props - Component props.
 * @param props.check - The eligibility result details.
 * @param props.index - Index for motion animation delay.
 * @returns Row layout element.
 */
function CheckRow({ check, index }: CheckRowProps): React.ReactElement {
  const cfg = STATUS_CONFIG[check.status];
  const { Icon } = cfg;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg}`}
      role="listitem"
    >
      <div className={`flex-shrink-0 mt-0.5 ${cfg.color}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-foreground">{check.label}</p>
          <span className={`rounded-full border bg-card px-1.5 py-0.5 text-[10px] font-bold ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{check.detail}</p>
      </div>
    </motion.div>
  );
}

interface OverallBadgeProps {
  checks: EligibilityResult[];
}

/**
 * Renders the overall eligibility status summary badge.
 *
 * @param props - Component props.
 * @param props.checks - Results of all checking parameters.
 * @returns Summary component.
 */
function OverallBadge({ checks }: OverallBadgeProps): React.ReactElement {
  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const passes = checks.filter((c) => c.status === "pass").length;

  if (fails > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30" role="alert">
        <XCircle className="w-6 h-6 text-destructive flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-destructive">Not Eligible</p>
          <p className="text-xs text-destructive">{fails} check{fails > 1 ? "s" : ""} failed. Enrollment cannot proceed.</p>
        </div>
      </div>
    );
  }
  if (warns > 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30" role="alert">
        <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-warning">Eligible with Warnings</p>
          <p className="text-xs text-warning">{warns} warning{warns > 1 ? "s" : ""} noted. Review before confirming.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30" role="status">
      <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold text-success">Fully Eligible</p>
        <p className="text-xs text-success">All {passes} checks passed. Ready to enroll.</p>
      </div>
    </div>
  );
}

/**
 * Checks if the list of eligibility checks contains no failures.
 *
 * @param checks - Array of checking outputs.
 * @returns True if student eligibility is passed.
 */
export function eligibilityPassed(checks: EligibilityResult[]): boolean {
  return !checks.some((c) => c.status === "fail");
}

interface EligibilityReportProps {
  student: Partial<Student>;
  session: StudentSession;
}

/**
 * Report showing overall eligibility of a student for a specific session.
 *
 * @param props - Component props.
 * @param props.student - Student details.
 * @param props.session - Target session details.
 * @returns The EligibilityReport component.
 */
export default function EligibilityReport({ student, session }: EligibilityReportProps): React.ReactElement {
  const checks = runEligibilityChecks(student, session);

  return (
    <article className="space-y-4" aria-label="Eligibility Report">
      {/* Session + student summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Student</p>
          <p className="text-[13px] font-semibold text-foreground truncate">{student.name || "—"}</p>
          <p className="text-[11px] text-muted-foreground">{student.gender || "—"} · DOB {student.dob ? new Date(student.dob).getFullYear() : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Session</p>
          <p className="text-[13px] font-semibold text-foreground truncate">{session.name}</p>
          <p className="text-[11px] text-muted-foreground">{session.time} · {session.type}</p>
        </div>
      </div>

      {/* Overall */}
      <OverallBadge checks={checks} />

      {/* Individual checks */}
      <div className="space-y-2.5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Validation Checks</h3>
        <div className="space-y-2.5" role="list">
          {checks.map((check, i) => <CheckRow key={check.id} check={check} index={i} />)}
        </div>
      </div>
    </article>
  );
}
