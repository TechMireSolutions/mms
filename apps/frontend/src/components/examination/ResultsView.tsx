import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award } from "lucide-react";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useStudentsByIds } from "@/hooks/useStudents";
import type { Student } from "@/lib/data/studentsData";
import { useSessionsCollection } from "@/hooks/useSessions";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import type { Enrollment } from "@/lib/data/enrollmentData";
import { getGrade } from "./gradeUtils";
import StudentResultCard, { StudentResultItem } from "./StudentResultCard";
import CertificatePreview from "./CertificatePreview";
import useTranslation from "@/hooks/useTranslation";
import ModuleColumnCustomizer from "../ui/ModuleColumnCustomizer";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { Button } from "@/components/ui/button";

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (cols: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

interface ResultsViewProps {
  exams: Exam[];
  results: ExamResult[];
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
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
 */
export default function ResultsView({
  exams,
  results,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: ResultsViewProps): React.ReactElement {
  const { t } = useTranslation();
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || "");
  const [selectedStudent, setSelectedStudent] = useState<RankedResult | null>(null);
  const [certStudent, setCertStudent] = useState<RankedResult | null>(null);

  const exam = exams.find((e) => e.id === selectedExam);
  const studentIdsForExam = useMemo(() => {
    if (!exam) return [];
    return results
      .filter((r) => r.examId === exam.id)
      .map((r) => r.studentId);
  }, [exam, results]);

  const { data: students = [] } = useStudentsByIds(studentIdsForExam);
  const sessions = useSessionsCollection();
  const enrollments = useLiveCollection<Enrollment>("enrollments");

  const studentsById = useMemo(
    () => new Map(students.map((student: Student) => [String(student.id), student])),
    [students],
  );
  const classNamesById = useMemo(
    () => new Map(
      sessions.flatMap((session) =>
        (session.classes || []).map((cls) => [cls.id, `${session.name} - ${cls.name}`] as const),
      ),
    ),
    [sessions],
  );
  const classByStudentId = useMemo(() => {
    const classIds = new Set(exam?.classIds || []);
    return new Map(
      enrollments
        .filter((enrollment) => classIds.has(enrollment.classId))
        .map((enrollment) => [String(enrollment.studentId), enrollment.classId] as const),
    );
  }, [enrollments, exam]);

  const rankedResults = useMemo<RankedResult[]>(() => {
    if (!exam) return [];
    return results
      .filter((r) => r.examId === exam.id)
      .map((r) => {
        const student = studentsById.get(String(r.studentId));
        const classId = classByStudentId.get(String(r.studentId));
        const pct = Math.round((r.marksObtained / exam.totalMarks) * 100);
        return {
          ...r,
          student: student ? { name: student.name || "Unnamed student", rollNo: student.grNumber || String(student.id) } : undefined,
          cls: classId ? { name: classNamesById.get(classId) || classId } : undefined,
          pct,
          grade: getGrade(pct),
          passed: r.marksObtained >= exam.passingMarks,
        };
      })
      .sort((a, b) => b.marksObtained - a.marksObtained)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [classByStudentId, classNamesById, exam, results, studentsById]);

  useEffect(() => {
    onFilteredCountChange?.(rankedResults.length);
  }, [rankedResults.length, onFilteredCountChange]);

  const stats = useMemo(() => {
    if (rankedResults.length === 0) return null;
    const avg = Math.round(rankedResults.reduce((s, r) => s + r.pct, 0) / rankedResults.length);
    const passed = rankedResults.filter((r) => r.passed).length;
    return { avg, passed, failed: rankedResults.length - passed, total: rankedResults.length };
  }, [rankedResults]);

  const showRank = isColumnVisible ? isColumnVisible("rank") : true;
  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showClassRoll = isColumnVisible ? isColumnVisible("classRoll") : true;
  const showMarks = isColumnVisible ? isColumnVisible("marks") : true;
  const showPercentage = isColumnVisible ? isColumnVisible("percentage") : true;
  const showGrade = isColumnVisible ? isColumnVisible("grade") : true;
  const showPassFail = isColumnVisible ? isColumnVisible("passFail") : true;

  return (
    <section className="space-y-5" aria-labelledby="results-view-title">
      <h2 id="results-view-title" className="sr-only">{t("examinations.results")}</h2>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("examinations.selectExam")}>
          {exams.map((e) => {
            const isSelected = selectedExam === e.id;
            return (
              <Button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedExam(e.id)}
                className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
              >
                {e.name}
              </Button>
            );
          })}
        </div>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </div>

      {exam && (
        <>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="status" aria-label={t("examinations.resultsStats")}>
              {[
                { label: t("examinations.stats.students"), value: stats.total },
                { label: t("examinations.stats.classAvg"), value: `${stats.avg}%` },
                { label: t("examinations.stats.passed"), value: stats.passed },
                { label: t("examinations.stats.failed"), value: stats.failed },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 text-center">
                  <p className={`text-[20px] font-bold text-foreground`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label={t("examinations.rankings")}>
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" aria-hidden="true" />
              <h3 className="text-[13px] font-bold text-foreground m-0">{t("examinations.rankingsTitle", { name: exam.name })}</h3>
            </div>
            {rankedResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground" role="status">{t("examinations.empty.results")}</div>
            ) : (
              <div className="divide-y divide-border/50" role="list">
                {rankedResults.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer flex-wrap"
                    onClick={() => setSelectedStudent(r)}
                    role="listitem"
                    aria-label={t("examinations.viewResultAria", { name: r.student?.name || t("examinations.columns.results.student") })}
                  >
                    {showRank && (
                      <div className="w-8 text-center flex-shrink-0">
                        {r.rank <= 3 ? (
                          <span className="text-lg" aria-label={t("examinations.rankLabel", { rank: r.rank })}>{RANK_ICONS[r.rank - 1]}</span>
                        ) : (
                          <span className="text-[12px] font-bold text-muted-foreground">{t("examinations.rankLabel", { rank: r.rank })}</span>
                        )}
                      </div>
                    )}

                    {showStudent && (
                      <>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                          style={{ background: r.grade.color }}
                          aria-hidden="true"
                        >
                          {r.student?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground m-0">{r.student?.name}</p>
                          {showClassRoll && (
                            <p className="text-[10px] text-muted-foreground m-0">{r.cls?.name} · {r.student?.rollNo}</p>
                          )}
                        </div>
                      </>
                    )}

                    {!showStudent && showClassRoll && (
                      <div className="flex-1 min-w-0 text-[12px] text-muted-foreground">
                        {r.cls?.name} · {r.student?.rollNo}
                      </div>
                    )}

                    {showMarks && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-[14px] font-bold text-foreground m-0">
                          {r.marksObtained}
                          <span className="text-[10px] font-normal text-muted-foreground">/{exam.totalMarks}</span>
                        </p>
                        {showPercentage && (
                          <p className="text-[10px] text-muted-foreground m-0">{r.pct}%</p>
                        )}
                      </div>
                    )}

                    {!showMarks && showPercentage && (
                      <div className="text-right flex-shrink-0 text-[12px] text-muted-foreground">{r.pct}%</div>
                    )}

                    {showGrade && (
                      <span
                        className="text-[12px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ color: r.grade.color, background: r.grade.bg, border: `1px solid ${r.grade.border}` }}
                      >
                        {r.grade.label}
                      </span>
                    )}

                    {showPassFail && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {r.passed ? t("examinations.pass") : t("examinations.fail")}
                      </span>
                    )}

                    {r.passed && r.rank <= 3 && (
                       <Button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCertStudent(r); }}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 transition-colors flex-shrink-0"
                      >
                        <Award className="w-3 h-3" aria-hidden="true" /> {t("examinations.certificate")}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

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
