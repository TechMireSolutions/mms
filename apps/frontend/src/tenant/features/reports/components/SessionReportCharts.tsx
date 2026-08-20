import React from "react";
import { Bar, BarChart, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";

import type { CapacityBarDatum, EnrollmentTrendItem } from "./sessionReportTypes";

interface SessionReportChartsProps {
  capacityChartData: CapacityBarDatum[];
  enrollmentTrends: EnrollmentTrendItem[];
  onToggleClassFilter: (className: string) => void;
  onToggleSessionFilter: (sessionName: string) => void;
}

function getActiveLabel(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("activeLabel" in state)) {
    return null;
  }

  const activeLabel = state.activeLabel;
  return typeof activeLabel === "string" && activeLabel.length > 0 ? activeLabel : null;
}

function getTrendPayload(state: unknown): EnrollmentTrendItem | null {
  if (!state || typeof state !== "object" || !("activePayload" in state)) {
    return null;
  }

  const activePayload = state.activePayload;
  if (!Array.isArray(activePayload)) {
    return null;
  }

  const payload = (activePayload[0] as { payload?: unknown } | undefined)?.payload;
  if (!payload || typeof payload !== "object" || !("sessionName" in payload)) {
    return null;
  }

  return payload as EnrollmentTrendItem;
}

export const SessionReportCharts = React.memo(function SessionReportCharts({
  capacityChartData,
  enrollmentTrends,
  onToggleClassFilter,
  onToggleSessionFilter,
}: SessionReportChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title={t("sessions.report.capacityByClass")}>
        <SafeResponsiveContainer width="100%" height={180}>
          <BarChart
            data={capacityChartData}
            barSize={28}
            onClick={(state) => {
              const className = getActiveLabel(state);
              if (className) onToggleClassFilter(className);
            }}
            className="cursor-pointer"
          >
            <ChartGrid />
            <XAxis dataKey="class" tick={chartAxisTick(11)} />
            <YAxis tick={chartAxisTick(11)} />
            <Tooltip />
            <Bar dataKey="enrolled" fill="hsl(var(--primary))" stackId="a" name={t("sessions.report.enrolledLabel")} radius={[0, 0, 0, 0]} />
            <Bar dataKey="available" fill="hsl(var(--muted))" stackId="a" name={t("sessions.report.availableLabel")} radius={[4, 4, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </SectionCard>

      <SectionCard title={t("sessions.report.enrollmentTrend")}>
        <SafeResponsiveContainer width="100%" height={180}>
          <LineChart
            data={enrollmentTrends}
            onClick={(state) => {
              const trendPayload = getTrendPayload(state);
              if (trendPayload?.sessionName) onToggleSessionFilter(trendPayload.sessionName);
            }}
            className="cursor-pointer"
          >
            <ChartGrid />
            <XAxis dataKey="month" tick={chartAxisTick(11)} />
            <YAxis tick={chartAxisTick(11)} />
            <Tooltip />
            <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name={t("sessions.report.studentsLabel")} />
          </LineChart>
        </SafeResponsiveContainer>
      </SectionCard>
    </div>
  );
});

