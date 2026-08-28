import { useEffect, useMemo } from "react";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import type { Student } from "@/lib/data/studentsData";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { getGrade } from "@/tenant/features/examinations/components/gradeUtils";
import { useTranslation } from "@/hooks/useTranslation";
import type { RankedResult, ResultsViewStatsData } from "@/tenant/features/examinations/components/resultsViewTypes";

export interface UseResultsViewDataOptions {
  exams: Exam[];
  results: ExamResult[];
  selectedExam: string;
  onFilteredCountChange?: (count: number) => void;
}

export type UseResultsViewDataResult = ReturnType<typeof useResultsViewData>;

export function useResultsViewData({
  exams,
  results,
  selectedExam,
  onFilteredCountChange,
}: UseResultsViewDataOptions) {
  const { t } = useTranslation();

  const exam = exams.find((examOption) => examOption.id === selectedExam);
  const studentIdsForExam = useMemo(() => {
    if (!exam) return [];
    return results
      .filter((examResult) => examResult.examId === exam.id)
      .map((examResult) => examResult.studentId);
  }, [exam, results]);

  const { data: students = [] } = useStudentsByIds(studentIdsForExam);
  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();

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
          student: student ? { name: (student as any).name || t("common.unnamedStudent"), rollNo: (student as any).grNumber || String((student as any).id) } : undefined,
          cls: classId ? { name: classNamesById.get(classId) || classId } : undefined,
          pct: percentage,
          grade: getGrade(percentage),
          passed: examResult.marksObtained >= exam.passingMarks,
        };
      })
      .sort((firstResult, secondResult) => secondResult.marksObtained - firstResult.marksObtained)
      .map((rankedResult, index) => ({ ...rankedResult, rank: index + 1 }));
  }, [classByStudentId, classNamesById, exam, results, studentsById, t]);

  useEffect(() => {
    onFilteredCountChange?.(rankedResults.length);
  }, [rankedResults.length, onFilteredCountChange]);

  const stats = useMemo<ResultsViewStatsData | null>(() => {
    if (rankedResults.length === 0) return null;
    const average = Math.round(rankedResults.reduce((sum, rankedResult) => sum + rankedResult.pct, 0) / rankedResults.length);
    const passed = rankedResults.filter((rankedResult) => rankedResult.passed).length;
    return { average, passed, failed: rankedResults.length - passed, total: rankedResults.length };
  }, [rankedResults]);

  return { exam, rankedResults, stats };
}
