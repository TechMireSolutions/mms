import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award } from "lucide-react";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useStudentsByIds } from "@/hooks/useStudents";
import type { Student } from "@/lib/data/studentsData";
import { useSessionsCollection } from "@/hooks/useSessions";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import type { Enrollment } from "@/lib/data/enrollmentData";
import { getGrade } from "./gradeUtils";
import { StudentResultCard, StudentResultItem } from "./StudentResultCard";
import { CertificatePreview } from "./CertificatePreview";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer } from "../ui/ModuleColumnCustomizer";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { Button } from "@/components/ui/button";

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columns: ModuleColumnRegistryEntry[]) => void;
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
export function ResultsView({
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

  const exam = exams.find((examOption) => examOption.id === selectedExam);
  const studentIdsForExam = useMemo(() => {
    if (!exam) return [];
    return results
      .filter((examResult) => examResult.examId === exam.id)
      .map((examResult) => examResult.studentId);
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
        (session.classes || []).map((sessionClass) => [sessionClass.id, `${session.name} - ${sessionClass.name}`] as const),
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
      .filter((examResult) => examResult.examId === exam.id)
      .map((examResult) => {
        const student = studentsById.get(String(examResult.studentId));
        const classId = classByStudentId.get(String(examResult.studentId));
        const percentage = Math.round((examResult.marksObtained / exam.totalMarks) * 100);
        return {
          ...examResult,
          student: student ? { name: student.name || "Unnamed student", rollNo: student.grNumber || String(student.id) } : undefined,
          cls: classId ? { name: classNamesById.get(classId) || classId } : undefined,
          pct: percentage,
          grade: getGrade(percentage),
          passed: examResult.marksObtained >= exam.passingMarks,
        };
      })
      .sort((firstResult, secondResult) => secondResult.marksObtained - firstResult.marksObtained)
      .map((rankedResult, index) => ({ ...rankedResult, rank: index + 1 }));
  }, [classByStudentId, classNamesById, exam, results, studentsById]);

  useEffect(() => {
    onFilteredCountChange?.(rankedResults.length);
  }, [rankedResults.length, onFilteredCountChange]);

  const stats = useMemo(() => {
    if (rankedResults.length === 0) return null;
    const average = Math.round(rankedResults.reduce((sum, rankedResult) => sum + rankedResult.pct, 0) / rankedResults.length);
    const passed = rankedResults.filter((rankedResult) => rankedResult.passed).length;
    return { average, passed, failed: rankedResults.length - passed, total: rankedResults.length };
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
          {exams.map((examOption) => {
            const isSelected = selectedExam === examOption.id;
            return (
              <Button
                key={examOption.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedExam(examOption.id)}
                className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
              >
                {examOption.name}
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
                { label: t("examinations.stats.classAvg"), value: `${stats.average}%` },
                { label: t("examinations.stats.passed"), value: stats.passed },
                { label: t("examinations.stats.failed"), value: stats.failed },
              ].map((stat) => (
                <Card accentColor="primary" key={stat.label} className="p-3.5 text-center shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
                  <p className="text-[20px] font-bold text-foreground leading-none">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 mb-0">{stat.label}</p>
                </Card>
              ))}
            </div>
          )}

          <Card accentColor="warning" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm" aria-label={t("examinations.rankings")}>
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 pl-6.5 bg-muted/20">
              <Trophy className="w-4 h-4 text-warning" aria-hidden="true" />
              <h3 className="text-[13px] font-bold text-foreground m-0">{t("examinations.rankingsTitle", { name: exam.name })}</h3>
            </div>
            {rankedResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground" role="status">{t("examinations.empty.results")}</div>
            ) : (
              <div className="divide-y divide-border/50 pl-6.5" role="list">
                {rankedResults.map((rankedResult) => (
                  <motion.div
                    key={rankedResult.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer flex-wrap"
                    onClick={() => setSelectedStudent(rankedResult)}
                    role="listitem"
                    aria-label={t("examinations.viewResultAria", { name: rankedResult.student?.name || t("examinations.columns.results.student") })}
                  >
                    {showRank && (
                      <div className="w-8 text-center flex-shrink-0">
                        {rankedResult.rank <= 3 ? (
                          <span className="text-lg" aria-label={t("examinations.rankLabel", { rank: rankedResult.rank })}>{RANK_ICONS[rankedResult.rank - 1]}</span>
                        ) : (
                          <span className="text-[12px] font-bold text-muted-foreground">{t("examinations.rankLabel", { rank: rankedResult.rank })}</span>
                        )}
                      </div>
                    )}

                    {showStudent && (
                      <>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                          style={{ background: rankedResult.grade.color }}
                          aria-hidden="true"
                        >
                          {rankedResult.student?.name.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2) || "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground m-0">{rankedResult.student?.name}</p>
                          {showClassRoll && (
                            <p className="text-[10px] text-muted-foreground m-0">{rankedResult.cls?.name} · {rankedResult.student?.rollNo}</p>
                          )}
                        </div>
                      </>
                    )}

                    {!showStudent && showClassRoll && (
                      <div className="flex-1 min-w-0 text-[12px] text-muted-foreground">
                        {rankedResult.cls?.name} · {rankedResult.student?.rollNo}
                      </div>
                    )}

                    {showMarks && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-[14px] font-bold text-foreground m-0">
                          {rankedResult.marksObtained}
                          <span className="text-[10px] font-normal text-muted-foreground">/{exam.totalMarks}</span>
                        </p>
                        {showPercentage && (
                          <p className="text-[10px] text-muted-foreground m-0">{rankedResult.pct}%</p>
                        )}
                      </div>
                    )}

                    {!showMarks && showPercentage && (
                      <div className="text-right flex-shrink-0 text-[12px] text-muted-foreground">{rankedResult.pct}%</div>
                    )}

                    {showGrade && (
                      <span
                        className="text-[12px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ color: rankedResult.grade.color, background: rankedResult.grade.bg, border: `1px solid ${rankedResult.grade.border}` }}
                      >
                        {rankedResult.grade.label}
                      </span>
                    )}

                    {showPassFail && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${rankedResult.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {rankedResult.passed ? t("examinations.pass") : t("examinations.fail")}
                      </span>
                    )}

                    {rankedResult.passed && rankedResult.rank <= 3 && (
                       <Button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); setCertStudent(rankedResult); }}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 transition-colors flex-shrink-0"
                      >
                        <Award className="w-3 h-3" aria-hidden="true" /> {t("examinations.certificate")}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
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
