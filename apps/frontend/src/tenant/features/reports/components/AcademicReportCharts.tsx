import React from "react";
import { BookOpen } from "lucide-react";
import {
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";

import type { AcademicResultItem, ClassRankingItem } from "./academicReportTypes";

interface AcademicReportChartsProps {
  academicResults: AcademicResultItem[];
  classRankings: ClassRankingItem[];
  onToggleStudentFilter: (studentName: string) => void;
  onToggleClassFilter: (className: string) => void;
}

function getActiveLabel(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("activeLabel" in state)) {
    return null;
  }

  const activeLabel = state.activeLabel;
  return typeof activeLabel === "string" && activeLabel.length > 0 ? activeLabel : null;
}

export const AcademicReportCharts = React.memo(function AcademicReportCharts({
  academicResults,
  classRankings,
  onToggleStudentFilter,
  onToggleClassFilter,
}: AcademicReportChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title={t("examinations.report.marksDistribution")}>
        <SafeResponsiveContainer width="100%" height={180}>
          <BarChart
            data={academicResults}
            barSize={28}
            onClick={(state) => {
              const studentName = getActiveLabel(state);
              if (studentName) onToggleStudentFilter(studentName);
            }}
            style={{ cursor: "pointer" }}
          >
            <ChartGrid />
            <XAxis dataKey="studentName" tick={chartAxisTick(10)} angle={-25} textAnchor="end" height={40} />
            <YAxis domain={[0, 100]} tick={chartAxisTick(11)} />
            <Tooltip formatter={(value) => value !== undefined ? `${value} / 100` : ""} />
            <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t("examinations.report.marksLabel")} />
          </BarChart>
        </SafeResponsiveContainer>
      </SectionCard>

      <SectionCard title={t("examinations.report.classComparison")}>
        {classRankings.length > 0 ? (
          <SafeResponsiveContainer width="100%" height={180}>
            <BarChart
              data={classRankings}
              barSize={32}
              layout="vertical"
              onClick={(state) => {
                const className = getActiveLabel(state);
                if (className) onToggleClassFilter(className);
              }}
              style={{ cursor: "pointer" }}
            >
              <ChartGrid />
              <XAxis type="number" domain={[0, 100]} tick={chartAxisTick(11)} />
              <YAxis dataKey="class" type="category" tick={chartAxisTick(11)} width={90} />
              <Tooltip />
              <Bar dataKey="averageMarks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name={t("examinations.report.avgMarks")} />
              <Bar dataKey="topMarks" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name={t("examinations.report.topMarks")} />
            </BarChart>
          </SafeResponsiveContainer>
        ) : (
          <EmptyState icon={BookOpen} title={t("examinations.report.noClassData")} compact />
        )}
      </SectionCard>
    </div>
  );
});
