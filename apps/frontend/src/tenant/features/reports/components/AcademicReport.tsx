import React, { useMemo, useState } from "react";
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/tenant/hooks/collections/examinations";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { getGrade } from '@mms/shared';
import { AcademicReportCharts } from "./AcademicReportCharts";
import { AcademicReportClassRankings } from "./AcademicReportClassRankings";
import {
  AcademicReportFilterBanner,
  AcademicReportKpis,
  AcademicReportResultsTable,
} from "./AcademicReportSections";

import type { AcademicReportProps, AcademicResultItem, ClassRankingItem } from "./academicReportTypes";

export type {
  AcademicReportFilters,
  AcademicReportProps,
  AcademicResultItem,
  ClassRankingItem,
} from "./academicReportTypes";

/**
 * Renders the academic/exam reports including summary KPIs, marks-distribution
 * and class-comparison bar charts, class rankings cards, and a filterable
 * exam-results table.
 *
 * @param props - The component props.
 * @returns The AcademicReport component.
 */
const AcademicReport = React.memo(function AcademicReport({ filters }: AcademicReportProps): React.JSX.Element {
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
      const student = students.find((studentOption: any) => String(studentOption.id) === String(examResult.studentId));
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
      const student = students.find((studentOption: any) => String(studentOption.id) === String(examResult.studentId));
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
      <AcademicReportKpis
        totalRecords={filteredAcademicResultsData.length}
        averageMarks={averageMarks}
        topScore={topScore}
        passRate={passRate}
      />
      <AcademicReportCharts
        academicResults={filteredAcademicResultsData}
        classRankings={filteredClassRankings}
        onToggleStudentFilter={toggleStudentFilter}
        onToggleClassFilter={toggleClassFilter}
      />

      <AcademicReportFilterBanner
        selectedStudent={selectedStudent}
        selectedClass={selectedClass}
        onClearStudent={() => setSelectedStudent(null)}
        onClearClass={() => setSelectedClass(null)}
      />
      <AcademicReportClassRankings
        classRankings={filteredClassRankings}
        onToggleClassFilter={toggleClassFilter}
      />
      <AcademicReportResultsTable
        academicResults={filteredAcademicResultsData}
        onToggleStudentFilter={toggleStudentFilter}
      />
    </div>
  );
});

export default AcademicReport;

