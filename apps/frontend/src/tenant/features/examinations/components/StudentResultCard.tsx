import React from "react";
import { Award, Printer } from "lucide-react";
import { getRankSuffix, GradeInfo } from "@/tenant/features/examinations/components/gradeUtils";
import { Exam } from '@/lib/data/examinationData';
import { formatDate } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

export interface StudentResultItem {
  pct: number;
  grade: GradeInfo;
  rank: number;
  marksObtained: number;
  passed: boolean;
  student?: {
    name: string;
    rollNo: string;
  };
  cls?: {
    name: string;
  };
}

interface StudentResultCardProps {
  result: StudentResultItem;
  exam: Exam;
  allResults: StudentResultItem[]; // accepts array of results context
  onClose: () => void;
  onCertificate: () => void;
}

/**
 * Dialog card modal showcasing individual student examination status and grading results.
 *
 * @param props - Component props.
 * @param props.result - Computed result details for selected student.
 * @param props.exam - Exam paper configuration metadata.
 * @param props.allResults - All results evaluated in class.
 * @param props.onClose - Action to dismiss card.
 * @param props.onCertificate - Trigger graduation certificate view.
 * @returns The StudentResultCard component.
 */
export function StudentResultCard({ result, exam, allResults, onClose, onCertificate }: StudentResultCardProps): React.ReactElement {
  const percentage = result.pct;
  const grade = result.grade;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (percentage / 100) * circumference;

  const position = result.rank;
  const total = allResults.length;

  return (
    <Modal
      open
      onClose={onClose}
      title={result.student?.name || "Student Result"}
      subtitle={`${result.cls?.name || ""} · ${result.student?.rollNo || ""}`}
      icon={Award}
      size="sm"
      footer={
        <div className="flex gap-2.5 w-full">
          {result.passed && (
            <Button
              type="button"
              onClick={onCertificate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-warning/40 bg-warning/10 text-warning text-sm font-semibold hover:bg-warning/15"
            >
              <Award className="w-4 h-4" aria-hidden="true" /> Certificate
            </Button>
          )}
          <Button
            type="button"
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm font-semibold hover:bg-muted/80"
          >
            <Printer className="w-4 h-4" aria-hidden="true" /> Print
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Circular progress */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: `linear-gradient(135deg, ${grade.bg}, transparent)` }} />
          <div className="relative w-28 h-28 mx-auto" aria-hidden="true">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={grade.color}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[26px] font-bold" style={{ color: grade.color }}>{grade.label}</span>
              <span className="text-[11px] text-muted-foreground font-semibold">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border" role="status" aria-label="Student metrics summary">
          {[
            { label: "Marks", value: `${result.marksObtained}/${exam.totalMarks}`, className: "text-foreground" },
            { label: "Rank", value: getRankSuffix(position) + ` / ${total}`, className: "text-foreground" },
            { label: "Status", value: result.passed ? "PASS" : "FAIL", className: result.passed ? "text-success" : "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-3.5 text-center">
              <p className={`text-[14px] font-bold ${stat.className}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exam info */}
        <section className="relative overflow-hidden group/examinfo px-5.5 py-4 space-y-2 border-t border-border/60 text-[12px] text-muted-foreground" aria-label="Exam details">
          <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/examinfo:bg-primary" />
          <div className="flex justify-between ml-1">
            <span>Exam</span>
            <span className="font-semibold text-foreground">{exam.name}</span>
          </div>
          <div className="flex justify-between ml-1">
            <span>Subject</span>
            <span className="font-semibold text-foreground">{exam.subject}</span>
          </div>
          <div className="flex justify-between ml-1">
            <span>Date</span>
            <span className="font-semibold text-foreground">{formatDate(exam.date, true)}</span>
          </div>
        </section>

      </div>
    </Modal>
  );
}
