import React, { useMemo } from "react";
import { BookOpen, Trophy, TrendingUp, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { EXAM_RESULTS, EXAMS, ExamResult, Exam } from '@/lib/data/examinationData';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useStudentsByIds } from "@/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { getGrade } from '@mms/shared';
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

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
  avgMarks: number;
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
  const examResults = useLiveCollection<ExamResult>("exam_results", EXAM_RESULTS);
  const exams = useLiveCollection<Exam>("exams", EXAMS);
  const studentIds = useMemo(
    () => uniqueRegistryIds(examResults.map((r) => r.studentId)),
    [examResults],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

  const results = useMemo<AcademicResultItem[]>(() => {
    let list: AcademicResultItem[] = [];

    examResults.forEach(r => {
      const exam = exams.find(e => e.id === r.examId);
      const student = students.find((s) => String(s.id) === String(r.studentId));
      if (!exam || !student) return;

      const pct = Math.round((r.marksObtained / exam.totalMarks) * 100);
      list.push({
        studentName: student.name,
        class: exam.name, // using exam name as proxy for class group context here
        subject: exam.subject,
        marks: pct,
        total: 100, // normalized to percentage
        grade: getGrade(pct).label,
        rank: 0 // to be computed
      });
    });

    // Compute rank
    list.sort((a, b) => b.marks - a.marks);
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

    if (filters.class !== "all") {
      list = list.filter((r) => r.class === filters.class);
    }
    if (filters.student) {
      list = list.filter((r) =>
        r.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return list;
  }, [filters, examResults, exams, students]);

  const classRankings = useMemo<ClassRankingItem[]>(() => {
    // Group by class (exam name)
    const grouped: Record<string, { class: string; studentName: string; marks: number }[]> = {};
    const baseResults = examResults.map(r => {
      const exam = exams.find(e => e.id === r.examId);
      const student = students.find((s) => String(s.id) === String(r.studentId));
      if (!exam || !student) return null;
      return {
        class: exam.name,
        studentName: student.name,
        marks: Math.round((r.marksObtained / exam.totalMarks) * 100),
      };
    }).filter(Boolean) as { class: string, studentName: string, marks: number }[];

    baseResults.forEach(r => {
      if (!grouped[r.class]) grouped[r.class] = [];
      grouped[r.class].push(r);
    });

    let list = Object.entries(grouped).map(([className, items]) => {
      const sorted = [...items].sort((a, b) => b.marks - a.marks);
      const avg = Math.round(items.reduce((s, r) => s + r.marks, 0) / items.length);
      const passes = items.filter(r => r.marks >= 50).length;
      return {
        class: className,
        avgMarks: avg,
        topMarks: sorted[0]?.marks || 0,
        passRate: Math.round((passes / items.length) * 100),
        topStudent: sorted[0]?.studentName || "—"
      };
    });

    if (filters.class !== "all") {
      list = list.filter((r) => r.class === filters.class);
    }
    return list;
  }, [filters, examResults, exams, students]);

  const avgMarks = results.length
    ? (results.reduce((a, r) => a + r.marks, 0) / results.length).toFixed(1)
    : 0;
  const topMark  = results.length ? Math.max(...results.map((r) => r.marks)) : 0;
  const passRate = results.length
    ? ((results.filter((r) => r.marks >= 50).length / results.length) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ReportSummaryCard icon={BookOpen}   label="Total Records" value={results.length} color="primary" />
        <ReportSummaryCard icon={TrendingUp} label="Class Avg"     value={`${avgMarks}%`} color="blue"    />
        <ReportSummaryCard icon={Trophy}     label="Top Score"     value={`${topMark}%`}  color="amber"   />
        <ReportSummaryCard icon={Star}       label="Pass Rate"     value={`${passRate}%`} color="green"   />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Marks Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={results} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="studentName" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={40} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => v !== undefined ? `${v} / 100` : ""} />
              <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Marks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Class Performance Comparison</p>
          {classRankings.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={classRankings} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="class" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="avgMarks" fill="hsl(var(--primary))"  radius={[0, 4, 4, 0]} name="Avg Marks" />
                <Bar dataKey="topMarks" fill="hsl(var(--chart-2))"  radius={[0, 4, 4, 0]} name="Top Marks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BookOpen} title="No class data" compact />
          )}
        </div>
      </div>

      {/* Class Rankings */}
      <p className="text-sm font-semibold text-foreground">Class Rankings</p>
      {classRankings.length === 0 ? (
        <EmptyState icon={Trophy} title="No class ranking data" compact />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {classRankings.map((c, i) => (
            <div key={c.class} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{c.class}</p>
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  #{i + 1}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Top: <span className="font-semibold text-foreground">{c.topStudent}</span> ({c.topMarks}%)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Class Avg: <span className="font-semibold">{c.avgMarks}%</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Pass Rate: <span className="font-semibold text-success">{c.passRate}%</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      <ReportExportBar 
        title="Exam Results" 
        data={results}
        headers={["Rank", "Student", "Class", "Subject", "Marks", "Grade"]}
      />
      {results.length === 0 ? (
        <EmptyState icon={BookOpen} title="No exam results found" compact />
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Rank", "Student", "Class", "Subject", "Marks", "Grade"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((r) => (
                <tr key={`${r.studentName}-${r.class}`} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    {r.rank === 1
                      ? <Trophy className="w-4 h-4 text-warning" />
                      : <span className="text-muted-foreground">{r.rank}</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 font-medium">{r.studentName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.class}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.subject}</td>
                  <td className="px-3 py-2.5 font-semibold">{r.marks}/{r.total}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${GRADE_COLOR[r.grade] ?? "bg-muted text-muted-foreground"}`}>
                      {r.grade}
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
