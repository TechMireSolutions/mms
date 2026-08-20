import React from "react";
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartGrid, chartAxisTick } from "@/components/ui/ChartGrid";
import { formatNumber } from "@mms/shared";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { LegendChip } from "@/components/ui/LegendChip";
import { useTranslation } from "@/hooks/useTranslation";
import type { HasanatFacultyBarItem, HasanatPieItem } from "./hasanatReportSectionTypes";

interface HasanatReportChartsProps {
  facultyChartData: HasanatFacultyBarItem[];
  redemptionPieData: HasanatPieItem[];
  pieColors: string[];
  onToggleFacultyFilter: (faculty: string) => void;
}

export const HasanatReportCharts = React.memo(function HasanatReportCharts({
  facultyChartData,
  redemptionPieData,
  pieColors,
  onToggleFacultyFilter,
}: HasanatReportChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title={t("hasanat.report.distributionByFaculty")}>
        <SafeResponsiveContainer width="100%" height={180}>
          <BarChart
            data={facultyChartData}
            barSize={22}
            onClick={(state) => {
              const faculty = (
                state as { activePayload?: Array<{ payload?: { faculty?: string } }> } | undefined
              )?.activePayload?.[0]?.payload?.faculty;
              if (typeof faculty === "string" && faculty.length > 0) onToggleFacultyFilter(faculty);
            }}
            className="cursor-pointer"
          >
            <ChartGrid />
            <XAxis dataKey="faculty" tick={chartAxisTick(11)} />
            <YAxis tick={chartAxisTick(11)} />
            <Tooltip />
            <Bar dataKey="distributed" fill="hsl(var(--primary))" name={t("hasanat.report.distributed")} radius={[4, 4, 0, 0]} />
            <Bar dataKey="redeemed" fill="hsl(var(--chart-2))" name={t("hasanat.report.redeemed")} radius={[4, 4, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </SectionCard>

      <SectionCard title={t("hasanat.report.redeemedVsBalance")}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="min-w-0 flex-1">
            <SafeResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={redemptionPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
                  {redemptionPieData.map((_, index) => (
                    <Cell key={index} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </SafeResponsiveContainer>
          </div>
          <div className="w-full shrink-0 space-y-3 sm:w-1/3">
            {redemptionPieData.map((slice, index) => (
              <LegendChip
                key={slice.name}
                dotStyle={{ background: pieColors[index % pieColors.length] }}
                label={<span className="text-xs text-muted-foreground">{slice.name}</span>}
                value={formatNumber(slice.value)}
              />
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
});

