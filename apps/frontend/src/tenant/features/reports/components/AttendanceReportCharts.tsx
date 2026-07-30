import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
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

export function AttendanceReportCharts({
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
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="class" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(value) => value !== undefined ? `${value}%` : ""} />
          <Bar dataKey="avgRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </SafeResponsiveContainer>
    </SectionCard>
  );
}
