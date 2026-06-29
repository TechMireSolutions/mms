import React, { useMemo } from "react";
import { BookOpen, Trophy, TrendingUp, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/hooks/useExaminationsApi";
import { useStudentsByIds } from "@/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { getGrade } from '@mms/shared';
import { useTranslation } from "@/hooks/useTranslation";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import { EmptyState } from "../ui/EmptyState";

/** Grade badge colour mapping. */
const GRADE_COLOR: Record<string, string> = {
  "A+": "bg-success/15 text-success",
  "A":  "bg-success/10 text-success",
  "B+": "bg-info/10 text-info",
  "B":  "bg-info/10 text-info",
  "C":  "bg-warning/10 text-warning",
  "F":  "bg-destructive/10 text-destructive",
};

/** Active filter state passed down from the parent report view. */
interface AcademicReportFilters {
  /** Class name to filter by, or "all" for no filter. */
  class: string;
  /** Substring to match against student names (case-insensitive). */
  student: string;
}

/** Props for the AcademicReport component. */
interface AcademicReportProps {
  /** Active report filters. */
  filters: AcademicReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

export interface AcademicResultItem {
  studentName: string;
  class: string;
  subject: string;
  marks: number;
  total: number;
  grade: string;
  rank: number;
}

export interface ClassRankingItem {
  class: string;
  averageMarks: number;
  topMarks: number;
  passRate: number;
  topStudent: string;
}

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
  const studentIds = useMemo(
    () => uniqueRegistryIds(examResults.map((result) => result.studentId)),
    [examResults],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

  const results = useMemo<AcademicResultItem[]>(() => {
    let academicResults: AcademicResultItem[] = [];

    examResults.forEach((result) => {
      const exam = exams.find((examOption) => examOption.id === result.examId);
      const student = students.find((studentOption) => String(studentOption.id) === String(result.studentId));
      if (!exam || !student) return;

      const percentage = Math.round((result.marksObtained / exam.totalMarks) * 100);
      academicResults.push({
        studentName: student.name,
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
      academicResults = academicResults.filter((result) => result.class === filters.class);
    }
    if (filters.student) {
      academicResults = academicResults.filter((result) =>
        result.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return academicResults;
  }, [filters, examResults, exams, students]);

  const classRankings = useMemo<ClassRankingItem[]>(() => {
    // Group by class (exam name)
    const resultsByClass: Record<string, { class: string; studentName: string; marks: number }[]> = {};
    const rankingSourceResults = examResults.map((result) => {
      const exam = exams.find((examOption) => examOption.id === result.examId);
      const student = students.find((studentOption) => String(studentOption.id) === String(result.studentId));
      if (!exam || !student) return null;
      return {
        class: exam.name,
        studentName: student.name,
        marks: Math.round((result.marksObtained / exam.totalMarks) * 100),
      };
    }).filter(Boolean) as { class: string, studentName: string, marks: number }[];

    rankingSourceResults.forEach((result) => {
      if (!resultsByClass[result.class]) resultsByClass[result.class] = [];
      resultsByClass[result.class].push(result);
    });

    let classRankingItems = Object.entries(resultsByClass).map(([className, classResults]) => {
      const sortedClassResults = [...classResults].sort((firstResult, secondResult) => secondResult.marks - firstResult.marks);
      const averageMarks = Math.round(classResults.reduce((sum, result) => sum + result.marks, 0) / classResults.length);
      const passingCount = classResults.filter((result) => result.marks >= 50).length;
      return {
        class: className,
        averageMarks,
        topMarks: sortedClassResults[0]?.marks || 0,
        passRate: Math.round((passingCount / classResults.length) * 100),
        topStudent: sortedClassResults[0]?.studentName || "—"
      };
    });

    if (filters.class !== "all") {
      classRankingItems = classRankingItems.filter((result) => result.class === filters.class);
    }
    return classRankingItems;
  }, [filters, examResults, exams, students]);

  const averageMarks = results.length
    ? (results.reduce((totalMarks, result) => totalMarks + result.marks, 0) / results.length).toFixed(1)
    : 0;
  const topScore = results.length ? Math.max(...results.map((result) => result.marks)) : 0;
  const passRate = results.length
    ? ((results.filter((result) => result.marks >= 50).length / results.length) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={BookOpen}   label={t("examinations.report.totalRecords")} value={results.length} color="primary" />
        <ReportSummaryCard icon={TrendingUp} label={t("examinations.report.classAvg")}     value={`${averageMarks}%`} color="blue"    />
        <ReportSummaryCard icon={Trophy}     label={t("examinations.report.topScore")}     value={`${topScore}%`}      color="amber"   />
        <ReportSummaryCard icon={Star}       label={t("examinations.report.passRate")}     value={`${passRate}%`} color="green"   />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("examinations.report.marksDistribution")}</p>
          <SafeResponsiveContainer width="100%" height={180}>
            <BarChart data={results} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="studentName" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={40} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => value !== undefined ? `${value} / 100` : ""} />
              <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t("examinations.report.marksLabel")} />
            </BarChart>
          </SafeResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">{t("examinations.report.classComparison")}</p>
          {classRankings.length > 0 ? (
            <SafeResponsiveContainer width="100%" height={180}>
              <BarChart data={classRankings} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="class" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="averageMarks" fill="hsl(var(--primary))"  radius={[0, 4, 4, 0]} name={t("examinations.report.avgMarks")} />
                <Bar dataKey="topMarks" fill="hsl(var(--chart-2))"  radius={[0, 4, 4, 0]} name={t("examinations.report.topMarks")} />
              </BarChart>
            </SafeResponsiveContainer>
          ) : (
            <EmptyState icon={BookOpen} title={t("examinations.report.noClassData")} compact />
          )}
        </div>
      </div>

      {/* Class Rankings */}
      <p className="text-sm font-semibold text-foreground">{t("examinations.report.classRankings")}</p>
      {classRankings.length === 0 ? (
        <EmptyState icon={Trophy} title={t("examinations.report.noClassRankingData")} compact />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {classRankings.map((classRanking, index) => (
            <div key={classRanking.class} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{classRanking.class}</p>
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  #{index + 1}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("examinations.report.topStudentLabel")}: <span className="font-semibold text-foreground">{classRanking.topStudent}</span> ({classRanking.topMarks}%)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("examinations.report.classAvg")}: <span className="font-semibold">{classRanking.averageMarks}%</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t("examinations.report.passRate")}: <span className="font-semibold text-success">{classRanking.passRate}%</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      <ReportExportBar 
        title={t("examinations.report.examResultsTitle")} 
        data={results}
        headers={[
          t("examinations.report.colRank"),
          t("examinations.report.colStudent"),
          t("examinations.report.colClass"),
          t("examinations.report.colSubject"),
          t("examinations.report.colMarks"),
          t("examinations.report.colGrade"),
        ]}
      />
      {results.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("examinations.report.noResultsFound")} compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
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
                  <th key={headerLabel} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((result) => (
                <tr key={`${result.studentName}-${result.class}`} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    {result.rank === 1
                      ? <Trophy className="w-4 h-4 text-warning" />
                      : <span className="text-muted-foreground">{result.rank}</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 font-medium">{result.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{result.class}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{result.subject}</td>
                  <td className="px-3 py-2.5 font-semibold">{result.marks}/{result.total}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${GRADE_COLOR[result.grade] ?? "bg-muted text-muted-foreground"}`}>
                      {result.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
