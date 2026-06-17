import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award } from "lucide-react";
import { CLASSES, STUDENTS, Exam, ExamResult } from '@/lib/data/examinationData';
import { getGrade } from "./gradeUtils";
import StudentResultCard, { StudentResultItem } from "./StudentResultCard";
import CertificatePreview from "./CertificatePreview";

interface ResultsViewProps {
  exams: Exam[];
  results: ExamResult[];
}

interface RankedResult extends StudentResultItem {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

/**
 * Rankings view component summarizing examination results and score distributions.
 *
 * @param props - Component props.
 * @param props.exams - Configured exam sessions.
 * @param props.results - Student scoring entries.
 * @returns The ResultsView component.
 */
export default function ResultsView({ exams, results }: ResultsViewProps): React.ReactElement {
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || "");
  const [selectedStudent, setSelectedStudent] = useState<RankedResult | null>(null);
  const [certStudent, setCertStudent] = useState<RankedResult | null>(null);

  const exam = exams.find((e) => e.id === selectedExam);

  const rankedResults = useMemo<RankedResult[]>(() => {
    if (!exam) return [];
    return results
      .filter((r) => r.examId === exam.id)
      .map((r) => {
        const student = STUDENTS.find((s) => s.id === r.studentId);
        const cls = CLASSES.find((c) => c.id === student?.classId);
        const pct = Math.round((r.marksObtained / exam.totalMarks) * 100);
        return {
          ...r,
          student: student ? { name: student.name, rollNo: student.rollNo } : undefined,
          cls: cls ? { name: cls.name } : undefined,
          pct,
          grade: getGrade(pct),
          passed: r.marksObtained >= exam.passingMarks,
        };
      })
      .sort((a, b) => b.marksObtained - a.marksObtained)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [exam, results]);

  const stats = useMemo(() => {
    if (rankedResults.length === 0) return null;
    const avg = Math.round(rankedResults.reduce((s, r) => s + r.pct, 0) / rankedResults.length);
    const passed = rankedResults.filter((r) => r.passed).length;
    return { avg, passed, failed: rankedResults.length - passed, total: rankedResults.length };
  }, [rankedResults]);

  return (
    <section className="space-y-5" aria-labelledby="results-view-title">
      <h2 id="results-view-title" className="sr-only">Examination Results rankings</h2>
      {/* Exam selector */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select exam results sheet">
        {exams.map((e) => {
          const isSelected = selectedExam === e.id;
          return (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedExam(e.id)}
              className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
            >
              {e.name}
            </button>
          );
        })}
      </div>

      {exam && (
        <>
          {/* Summary stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="status" aria-label="Class score statistics">
              {[
                { label: "Students", value: stats.total, icon: "👥", color: "text-primary" },
                { label: "Class Avg", value: `${stats.avg}%`, icon: "📊", color: "text-info" },
                { label: "Passed", value: stats.passed, icon: "✅", color: "text-success" },
                { label: "Failed", value: stats.failed, icon: "❌", color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 text-center">
                  <p className="text-xl mb-0.5" aria-hidden="true">{s.icon}</p>
                  <p className={`text-[20px] font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ranking table */}
          <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label="Rankings list">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" aria-hidden="true" />
              <h3 className="text-[13px] font-bold text-foreground">Rankings — {exam.name}</h3>
            </div>
            {rankedResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground" role="status">No results entered yet.</div>
            ) : (
              <div className="divide-y divide-border/50" role="list">
                {rankedResults.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(r)}
                    role="listitem"
                    aria-label={`View performance card for ${r.student?.name || "Student"}`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {r.rank <= 3 ? (
                        <span className="text-lg" aria-label={`Rank ${r.rank}`}>{RANK_ICONS[r.rank - 1]}</span>
                      ) : (
                        <span className="text-[12px] font-bold text-muted-foreground">Rank {r.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                      style={{ background: r.grade.color }}
                      aria-hidden="true"
                    >
                      {r.student?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "S"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{r.student?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.cls?.name} · {r.student?.rollNo}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-bold text-foreground">{r.marksObtained}<span className="text-[10px] font-normal text-muted-foreground">/{exam.totalMarks}</span></p>
                      <p className="text-[10px] text-muted-foreground">{r.pct}%</p>
                    </div>

                    {/* Grade badge */}
                    <span
                      className="text-[12px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ color: r.grade.color, background: r.grade.bg, border: `1px solid ${r.grade.border}` }}
                    >
                      {r.grade.label}
                    </span>

                    {/* Pass/Fail */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {r.passed ? "PASS" : "FAIL"}
                    </span>

                    {/* Certificate btn */}
                    {r.passed && r.rank <= 3 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCertStudent(r); }}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 transition-colors flex-shrink-0"
                      >
                        <Award className="w-3 h-3" aria-hidden="true" /> Cert
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Student result card modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentResultCard
            result={selectedStudent}
            exam={exam!}
            allResults={rankedResults}
            onClose={() => setSelectedStudent(null)}
            onCertificate={() => { setCertStudent(selectedStudent); setSelectedStudent(null); }}
          />
        )}
        {certStudent && (
          <CertificatePreview
            result={certStudent}
            exam={exam!}
            onClose={() => setCertStudent(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
