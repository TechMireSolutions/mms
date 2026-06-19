import React from "react";
import { motion } from "framer-motion";
import { X, Award, Printer } from "lucide-react";
import { getRankSuffix, GradeInfo } from "./gradeUtils";
import { Exam } from '@/lib/data/examinationData';
import { formatDate } from "../../lib/db";

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
export default function StudentResultCard({ result, exam, allResults, onClose, onCertificate }: StudentResultCardProps): React.ReactElement {
  const pct = result.pct;
  const grade = result.grade;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;

  const position = result.rank;
  const total = allResults.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="result-card-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10 overflow-hidden"
      >
        {/* Header gradient */}
        <div className="px-6 pt-8 pb-6 text-center bg-card" style={{ background: `linear-gradient(135deg, ${grade.bg}, white)` }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close card"
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/10 text-muted-foreground"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Circular progress */}
          <div className="relative w-28 h-28 mx-auto mb-4" aria-hidden="true">
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
              <span className="text-[11px] text-muted-foreground font-semibold">{pct}%</span>
            </div>
          </div>

          <h2 id="result-card-title" className="text-[17px] font-bold text-foreground">{result.student?.name || "Student"}</h2>
          <p className="text-[12px] text-muted-foreground">{result.cls?.name} · {result.student?.rollNo}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border" role="status" aria-label="Student metrics summary">
          {[
            { label: "Marks", value: `${result.marksObtained}/${exam.totalMarks}`, className: "text-foreground" },
            { label: "Rank", value: getRankSuffix(position) + ` / ${total}`, className: "text-foreground" },
            { label: "Status", value: result.passed ? "PASS" : "FAIL", className: result.passed ? "text-success" : "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="px-3 py-3.5 text-center">
              <p className={`text-[14px] font-bold ${s.className}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Exam info */}
        <section className="px-5 py-4 space-y-2 border-t border-border text-[12px] text-muted-foreground" aria-label="Exam details">
          <div className="flex justify-between">
            <span>Exam</span>
            <span className="font-semibold text-foreground">{exam.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Subject</span>
            <span className="font-semibold text-foreground">{exam.subject}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-semibold text-foreground">{formatDate(exam.date, true)}</span>
          </div>
        </section>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2.5">
          {result.passed && (
            <button
              type="button"
              onClick={onCertificate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-warning/40 bg-warning/10 text-warning text-sm font-semibold hover:bg-warning/15"
            >
              <Award className="w-4 h-4" aria-hidden="true" /> Certificate
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm font-semibold hover:bg-muted/80"
          >
            <Printer className="w-4 h-4" aria-hidden="true" /> Print
          </button>
        </div>
      </motion.div>
    </div>
  );
}
