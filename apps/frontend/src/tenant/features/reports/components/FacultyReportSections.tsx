import React from "react";
import { GraduationCap, BookOpen, Users, Layers } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActiveFilterBanner } from "@/components/ui/ActiveFilterBanner";
import { FacultyReportWorkloadTable } from "@/tenant/features/reports/components/FacultyReportWorkloadTable";
import type { FacultyWorkloadItem } from "@/tenant/features/reports/components/useFacultyReportData";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface FacultyReportChartSectionProps {
  t: TranslationFunction;
  facultyWorkload: FacultyWorkloadItem[];
  onBarClick: (faculty: string) => void;
}

export function FacultyReportChartSection({ t, facultyWorkload, onBarClick }: FacultyReportChartSectionProps): React.JSX.Element {
  return (
    <SectionCard title={t("teachers.report.workloadOverview")}>
      <SafeResponsiveContainer width="100%" height={200}>
        <BarChart
          data={facultyWorkload}
          barSize={28}
          layout="vertical"
          onClick={(state) => {
            const faculty = (
              state as { activePayload?: Array<{ payload?: { faculty?: string } }> } | undefined
            )?.activePayload?.[0]?.payload?.faculty;
            if (typeof faculty === "string" && faculty.length > 0) onBarClick(faculty);
          }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="faculty" type="category" tick={{ fontSize: 11 }} width={120} />
          <Tooltip />
          <Bar dataKey="totalStudents" fill="hsl(var(--primary))" name={t("teachers.report.studentsLabel")} radius={[0, 4, 4, 0]} />
          <Bar dataKey="classes" fill="hsl(var(--chart-2))" name={t("teachers.report.colClasses")} radius={[0, 4, 4, 0]} />
        </BarChart>
      </SafeResponsiveContainer>
    </SectionCard>
  );
}

interface FacultyReportKpiSectionProps {
  t: TranslationFunction;
  totalFaculty: number;
  totalStudents: number;
  totalClasses: number;
  avgStudents: string | number;
}

export function FacultyReportKpiSection({ t, totalFaculty, totalStudents, totalClasses, avgStudents }: FacultyReportKpiSectionProps): React.JSX.Element {
  return (
    <ModuleCommandMetricsGrid
      items={[
        { icon: GraduationCap, label: t("teachers.report.totalFaculty"), value: totalFaculty, accent: "primary" },
        { icon: Users, label: t("teachers.report.totalStudents"), value: totalStudents, accent: "blue" },
        { icon: Layers, label: t("teachers.report.totalClasses"), value: totalClasses, accent: "violet" },
        { icon: BookOpen, label: t("teachers.report.avgStudentsFaculty"), value: avgStudents, accent: "green" },
      ]}
    />
  );
}

interface FacultyReportFilterBarProps {
  t: TranslationFunction;
  selectedFaculty: string;
  onClear: () => void;
}

export function FacultyReportFilterBar({ t, selectedFaculty, onClear }: FacultyReportFilterBarProps): React.JSX.Element {
  return (
    <ActiveFilterBanner
      chips={[{ key: "faculty", label: t("teachers.report.facultyFilterLabel"), value: selectedFaculty }]}
      actions={[{ key: "faculty", label: t("teachers.report.clearFacultyFilter"), onClick: onClear }]}
    />
  );
}

interface FacultyReportExportSectionProps {
  t: TranslationFunction;
  filteredFacultyWorkload: FacultyWorkloadItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

export function FacultyReportExportSection({
  t,
  filteredFacultyWorkload,
  selectedFaculty,
  onToggleFacultyFilter,
}: FacultyReportExportSectionProps): React.JSX.Element {
  return (
    <>
      <ExportToolbar
        title={t("teachers.report.workloadReportTitle")}
        data={filteredFacultyWorkload}
        headers={[
          t("teachers.report.colFaculty"),
          t("teachers.report.colClasses"),
          t("teachers.report.colSessions"),
          t("teachers.report.colStudents"),
        ]}
      />
      {filteredFacultyWorkload.length === 0 ? (
        <EmptyState icon={GraduationCap} title={t("teachers.report.noFacultyData")} compact />
      ) : (
        <FacultyReportWorkloadTable
          t={t}
          rows={filteredFacultyWorkload}
          selectedFaculty={selectedFaculty}
          onToggleFacultyFilter={onToggleFacultyFilter}
        />
      )}
    </>
  );
}
