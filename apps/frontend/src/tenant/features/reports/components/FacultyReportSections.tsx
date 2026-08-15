import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import { SectionCard } from "@/components/ui/SectionCard";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import type { FacultyWorkloadItem } from "@/tenant/features/reports/components/teacherReportTypes";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface FacultyReportChartSectionProps {
  t: TranslationFunction;
  facultyWorkload: FacultyWorkloadItem[];
  onBarClick: (faculty: string) => void;
}

export const FacultyReportChartSection = React.memo(function FacultyReportChartSection({ t, facultyWorkload, onBarClick }: FacultyReportChartSectionProps): React.JSX.Element {
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
          <ChartGrid />
          <XAxis type="number" tick={chartAxisTick(11)} />
          <YAxis dataKey="faculty" type="category" tick={chartAxisTick(11)} width={120} />
          <Tooltip />
          <Bar dataKey="totalStudents" fill="hsl(var(--primary))" name={t("teachers.report.studentsLabel")} radius={[0, 4, 4, 0]} />
          <Bar dataKey="classes" fill="hsl(var(--chart-2))" name={t("teachers.report.colClasses")} radius={[0, 4, 4, 0]} />
        </BarChart>
      </SafeResponsiveContainer>
    </SectionCard>
  );
});
