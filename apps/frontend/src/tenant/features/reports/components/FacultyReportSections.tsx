import React from "react";
import { GraduationCap, BookOpen, Users, Layers, Filter, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { StatCard } from "@/components/ui/StatCard";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={GraduationCap} label={t("teachers.report.totalFaculty")} value={totalFaculty} color="primary" />
      <StatCard icon={Users} label={t("teachers.report.totalStudents")} value={totalStudents} color="blue" />
      <StatCard icon={Layers} label={t("teachers.report.totalClasses")} value={totalClasses} color="violet" />
      <StatCard icon={BookOpen} label={t("teachers.report.avgStudentsFaculty")} value={avgStudents} color="green" />
    </div>
  );
}

interface FacultyReportFilterBarProps {
  t: TranslationFunction;
  selectedFaculty: string;
  onClear: () => void;
}

export function FacultyReportFilterBar({ t, selectedFaculty, onClear }: FacultyReportFilterBarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{t("teachers.report.facultyFilterLabel")}</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {selectedFaculty}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <X className="me-1 h-3 w-3" />
        {t("teachers.report.clearFacultyFilter")}
      </Button>
    </div>
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
        <Card className="overflow-hidden">
          <FacultyReportWorkloadTable
            t={t}
            rows={filteredFacultyWorkload}
            selectedFaculty={selectedFaculty}
            onToggleFacultyFilter={onToggleFacultyFilter}
          />
        </Card>
      )}
    </>
  );
}
