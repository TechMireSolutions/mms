import React from "react";
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";

import type { AttendanceSummaryItem } from "./attendanceReportTypes";

interface AttendanceReportChartsProps {
  summary: AttendanceSummaryItem[];
  onToggleClassFilter: (className: string) => void;
}

function getActiveLabel(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("activeLabel" in state)) {
    return null;
  }

  const activeLabel = state.activeLabel;
  return typeof activeLabel === "string" && activeLabel.length > 0 ? activeLabel : null;
}

export const AttendanceReportCharts = React.memo(function AttendanceReportCharts({
  summary,
  onToggleClassFilter,
}: AttendanceReportChartsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (summary.length === 0) {
    return null;
  }

  return (
    <SectionCard title={t("attendance.report.rateByClass")}>
      <SafeResponsiveContainer width="100%" height={180}>
        <BarChart
          data={summary}
          barSize={36}
          onClick={(state) => {
            const className = getActiveLabel(state);
            if (className) onToggleClassFilter(className);
          }}
          style={{ cursor: "pointer" }}
        >
          <ChartGrid />
          <XAxis dataKey="class" tick={chartAxisTick(12)} />
          <YAxis domain={[0, 100]} tick={chartAxisTick(11)} unit="%" />
          <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ""} />
          <Bar dataKey="avgRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </SafeResponsiveContainer>
    </SectionCard>
  );
});

