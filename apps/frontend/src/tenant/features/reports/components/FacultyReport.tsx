import React from "react";
import {
  FacultyReportChartSection,
  FacultyReportExportSection,
  FacultyReportFilterBar,
  FacultyReportKpiSection,
} from "@/tenant/features/reports/components/FacultyReportSections";
import { useFacultyReportData, type FacultyWorkloadItem } from "@/tenant/features/reports/components/useFacultyReportData";

export type { FacultyWorkloadItem };

interface FacultyReportFilters {
  [key: string]: string;
}

interface FacultyReportProps {
  filters?: FacultyReportFilters;
  onEditVisual?: (config: unknown) => void;
}

export default function FacultyReport({ filters: _filters }: FacultyReportProps): React.JSX.Element {
  const {
    t,
    selectedFaculty,
    setSelectedFaculty,
    facultyWorkload,
    filteredFacultyWorkload,
    totalFaculty,
    totalStudents,
    totalClasses,
    avgStudents,
    toggleFacultyFilter,
  } = useFacultyReportData();

  return (
    <div className="space-y-4">
      <FacultyReportKpiSection
        t={t}
        totalFaculty={totalFaculty}
        totalStudents={totalStudents}
        totalClasses={totalClasses}
        avgStudents={avgStudents}
      />

      <FacultyReportChartSection
        t={t}
        facultyWorkload={facultyWorkload}
        onBarClick={toggleFacultyFilter}
      />

      {selectedFaculty && (
        <FacultyReportFilterBar
          t={t}
          selectedFaculty={selectedFaculty}
          onClear={() => setSelectedFaculty(null)}
        />
      )}

      <FacultyReportExportSection
        t={t}
        filteredFacultyWorkload={filteredFacultyWorkload}
        selectedFaculty={selectedFaculty}
        onToggleFacultyFilter={toggleFacultyFilter}
      />
    </div>
  );
}
