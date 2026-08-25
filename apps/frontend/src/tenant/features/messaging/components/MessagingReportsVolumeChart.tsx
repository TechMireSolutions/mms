import React from "react";
import { BarChart2 } from "lucide-react";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { SEMANTIC_TEXT } from "@/lib/semanticTone";

interface MessagingChartDatum {
  name: string;
  value: number;
  fillColor?: string;
}

interface MessagingReportsVolumeChartProps {
  chartData: MessagingChartDatum[];
}

export function MessagingReportsVolumeChart({
  chartData,
}: MessagingReportsVolumeChartProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`${WORK_SURFACE} flex flex-col justify-between p-4`}>
      <div className="space-y-1">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <BarChart2 className={`h-4 w-4 ${SEMANTIC_TEXT.primary}`} />
          {t("messaging.volumeBreakdown")}
        </h4>
        <p className="text-xs text-muted-foreground">{t("messaging.volumeBreakdownDesc")}</p>
      </div>
      {chartData.length > 0 ? (
        <div className="flex h-chart-lg w-full items-center justify-center">
          <SafeResponsiveContainer height={240}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fillColor || "var(--color-primary)"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </SafeResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          title={t("messaging.noDispatches")}
          icon={BarChart2}
          compact
          className="h-chart-lg"
        />
      )}
    </div>
  );
}
