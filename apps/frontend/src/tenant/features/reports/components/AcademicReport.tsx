import React, { useMemo, useState } from "react";
import { BookOpen, Trophy, TrendingUp, Star, Filter, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/tenant/hooks/collections/examinations";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { getGrade } from '@mms/shared';
import { useTranslation } from "@/hooks/useTranslation";
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { AcademicReportCharts } from "./AcademicReportCharts";
import { AcademicReportClassRankings } from "./AcademicReportClassRankings";

import type { AcademicReportProps, AcademicResultItem, ClassRankingItem } from "./academicReportTypes";

export type {
  AcademicReportFilters,
  AcademicReportProps,
  AcademicResultItem,
  ClassRankingItem,
} from "./academicReportTypes";

/** Grade badge colour mapping. */
const GRADE_BADGE_CLS: Record<string, string> = {
  "A+": SEMANTIC_BADGE.successStrong,
  "A":  SEMANTIC_BADGE.success,
  "B+": SEMANTIC_BADGE.info,
  "B":  SEMANTIC_BADGE.info,
  "C":  SEMANTIC_BADGE.warning,
  "F":  SEMANTIC_BADGE.destructive,
};

/**
 * Renders the academic/exam reports including summary KPIs, marks-distribution
 * and class-comparison bar charts, class rankings cards, and a filterable
 * exam-results table.
 *
 * @param props - The component props.
 * @returns The AcademicReport component.
 */
export default function AcademicReport({ filters }: AcademicReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const examResults = useExaminationsResultsCollection();
  const exams = useExaminationsExamsCollection();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const studentIds = useMemo(
    () => uniqueRegistryIds(examResults.map((examResult) => examResult.studentId)),
    [examResults],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

  const academicResultsData = useMemo<AcademicResultItem[]>(() => {
    let academicResults: AcademicResultItem[] = [];

    examResults.forEach((examResult) => {
      const exam = exams.find((examOption) => examOption.id === examResult.examId);
      const student = students.find((studentOption) => String(studentOption.id) === String(examResult.studentId));
      if (!exam || !student) return;

      const percentage = Math.round((examResult.marksObtained / exam.totalMarks) * 100);
      academicResults.push({
        studentName: student.name || "",
        class: exam.name, // using exam name as proxy for class group context here
        subject: exam.subject,
        marks: percentage,
        total: 100, // normalized to percentage
        grade: getGrade(percentage).label,
        rank: 0 // to be computed
      });
    });

    // Compute rank
    academicResults.sort((firstResult, secondResult) => secondResult.marks - firstResult.marks);
    academicResults.forEach((academicResult, index) => {
      academicResult.rank = index + 1;
    });

    if (filters.class !== "all") {
      academicResults = academicResults.filter((academicResult) => academicResult.class === filters.class);
    }
    if (filters.student) {
      academicResults = academicResults.filter((academicResult) =>
        academicResult.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return academicResults;
  }, [filters, examResults, exams, students]);

  const classRankings = useMemo<ClassRankingItem[]>(() => {
    // Group by class (exam name)
    const resultsByClass: Record<string, { class: string; studentName: string; marks: number }[]> = {};
    const rankingSourceResults = examResults.map((examResult) => {
      const exam = exams.find((examOption) => examOption.id === examResult.examId);
      const student = students.find((studentOption) => String(studentOption.id) === String(examResult.studentId));
      if (!exam || !student) return null;
      return {
        class: exam.name,
        studentName: student.name,
        marks: Math.round((examResult.marksObtained / exam.totalMarks) * 100),
      };
    }).filter(Boolean) as { class: string, studentName: string, marks: number }[];

    rankingSourceResults.forEach((rankingSourceResult) => {
      if (!resultsByClass[rankingSourceResult.class]) resultsByClass[rankingSourceResult.class] = [];
      resultsByClass[rankingSourceResult.class].push(rankingSourceResult);
    });

    let classRankingItems = Object.entries(resultsByClass).map(([className, classResults]) => {
      const sortedClassResults = [...classResults].sort((firstResult, secondResult) => secondResult.marks - firstResult.marks);
      const averageMarks = Math.round(classResults.reduce((sum, classResult) => sum + classResult.marks, 0) / classResults.length);
      const passingCount = classResults.filter((classResult) => classResult.marks >= 50).length;
      return {
        class: className,
        averageMarks,
        topMarks: sortedClassResults[0]?.marks || 0,
        passRate: Math.round((passingCount / classResults.length) * 100),
        topStudent: sortedClassResults[0]?.studentName || "—"
      };
    });

    if (filters.class !== "all") {
      classRankingItems = classRankingItems.filter((classRankingItem) => classRankingItem.class === filters.class);
    }
    return classRankingItems;
  }, [filters, examResults, exams, students]);

  const filteredAcademicResultsData = useMemo(() => {
    let filteredAcademicResults = academicResultsData;
    if (selectedClass) {
      filteredAcademicResults = filteredAcademicResults.filter((academicResult) => academicResult.class === selectedClass);
    }
    if (selectedStudent) {
      filteredAcademicResults = filteredAcademicResults.filter((academicResult) => academicResult.studentName === selectedStudent);
    }
    return filteredAcademicResults;
  }, [academicResultsData, selectedClass, selectedStudent]);

  const filteredClassRankings = useMemo(
    () => (selectedClass ? classRankings.filter((classRanking) => classRanking.class === selectedClass) : classRankings),
    [classRankings, selectedClass],
  );

  const averageMarks = filteredAcademicResultsData.length
    ? (filteredAcademicResultsData.reduce((totalMarks, academicResult) => totalMarks + academicResult.marks, 0) / filteredAcademicResultsData.length).toFixed(1)
    : 0;
  const topScore = filteredAcademicResultsData.length ? Math.max(...filteredAcademicResultsData.map((academicResult) => academicResult.marks)) : 0;
  const passRate = filteredAcademicResultsData.length
    ? ((filteredAcademicResultsData.filter((academicResult) => academicResult.marks >= 50).length / filteredAcademicResultsData.length) * 100).toFixed(0)
    : 0;

  const toggleClassFilter = (className: string): void => {
    setSelectedClass((currentClass) => (currentClass === className ? null : className));
  };

  const toggleStudentFilter = (studentName: string): void => {
    setSelectedStudent((currentStudent) => (currentStudent === studentName ? null : studentName));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={BookOpen}   label={t("examinations.report.totalRecords")} value={filteredAcademicResultsData.length} color="primary" />
        <StatCard icon={TrendingUp} label={t("examinations.report.classAvg")}     value={`${averageMarks}%`} color="blue"    />
        <StatCard icon={Trophy}     label={t("examinations.report.topScore")}     value={`${topScore}%`}      color="amber"   />
        <StatCard icon={Star}       label={t("examinations.report.passRate")}     value={`${passRate}%`} color="green"   />
      </div>

      <AcademicReportCharts
        academicResults={filteredAcademicResultsData}
        classRankings={filteredClassRankings}
        onToggleStudentFilter={toggleStudentFilter}
        onToggleClassFilter={toggleClassFilter}
      />

      {(selectedStudent || selectedClass) && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-primary" />
            {selectedStudent && (
              <>
                <span className="font-medium text-foreground">{t("examinations.report.studentFilterLabel")}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                  {selectedStudent}
                </span>
              </>
            )}
            {selectedClass && (
              <>
                <span className="font-medium text-foreground">{t("examinations.report.classFilterLabel")}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                  {selectedClass}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedStudent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudent(null)}
                className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 me-1" />
                {t("examinations.report.clearStudentFilter")}
              </Button>
            )}
            {selectedClass && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClass(null)}
                className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 me-1" />
                {t("examinations.report.clearClassFilter")}
              </Button>
            )}
          </div>
        </div>
      )}

      <AcademicReportClassRankings
        classRankings={filteredClassRankings}
        onToggleClassFilter={toggleClassFilter}
      />

      <ExportToolbar 
        title={t("examinations.report.examResultsTitle")} 
        data={filteredAcademicResultsData}
        headers={[
          t("examinations.report.colRank"),
          t("examinations.report.colStudent"),
          t("examinations.report.colClass"),
          t("examinations.report.colSubject"),
          t("examinations.report.colMarks"),
          t("examinations.report.colGrade"),
        ]}
      />
      {filteredAcademicResultsData.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("examinations.report.noResultsFound")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {filteredAcademicResultsData.map((academicResult) => (
              <article
                key={`${academicResult.studentName}-${academicResult.class}`}
                className="space-y-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {academicResult.rank === 1 ? (
                      <Trophy className="h-4 w-4 shrink-0 text-warning" />
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">#{academicResult.rank}</span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleStudentFilter(academicResult.studentName)}
                      className="h-auto min-h-11 truncate px-0 py-0 text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {academicResult.studentName}
                    </Button>
                  </div>
                  <StatusBadge
                    status={academicResult.grade}
                    size="sm"
                    config={{
                      [academicResult.grade]: {
                        label: academicResult.grade,
                        cls: GRADE_BADGE_CLS[academicResult.grade] ?? SEMANTIC_BADGE.muted,
                      },
                    }}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.report.colClass")}</dt>
                    <dd className="text-foreground">{academicResult.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.report.colSubject")}</dt>
                    <dd className="text-foreground">{academicResult.subject}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.report.colMarks")}</dt>
                    <dd className="font-semibold text-foreground">{academicResult.marks}/{academicResult.total}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  t("examinations.report.colRank"),
                  t("examinations.report.colStudent"),
                  t("examinations.report.colClass"),
                  t("examinations.report.colSubject"),
                  t("examinations.report.colMarks"),
                  t("examinations.report.colGrade"),
                ].map((headerLabel) => (
                  <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAcademicResultsData.map((academicResult) => (
                <tr key={`${academicResult.studentName}-${academicResult.class}`} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    {academicResult.rank === 1
                      ? <Trophy className="w-4 h-4 text-warning" />
                      : <span className="text-muted-foreground">{academicResult.rank}</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 font-medium">{academicResult.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{academicResult.class}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{academicResult.subject}</td>
                  <td className="px-3 py-2.5 font-semibold">{academicResult.marks}/{academicResult.total}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      status={academicResult.grade}
                      size="sm"
                      config={{
                        [academicResult.grade]: {
                          label: academicResult.grade,
                          cls: GRADE_BADGE_CLS[academicResult.grade] ?? SEMANTIC_BADGE.muted,
                        },
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
}
