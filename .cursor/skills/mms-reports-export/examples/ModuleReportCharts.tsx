import React, { lazy, Suspense } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { ReportChartCard } from '@/components/ui/reports/ReportChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { chartAxisTick, formatNumber } from '@/lib/reports/chartUtils';
import { useTranslation } from 'react-i18next';

interface ChartDataPoint {
  name: string;
  count: number;
}

interface ModuleReportChartsProps {
  data: ChartDataPoint[];
}

export function ModuleReportCharts({ data }: ModuleReportChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ReportChartCard
      title={t('module.reports.chartTitle')}
      accentColor="primary"
      heightClass="h-chart-md"
      empty={data.length === 0}
      emptyNode={<EmptyState icon={BarChart2} title={t('module.reports.noData')} compact />}
    >
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="name" tick={chartAxisTick(10)} />
        <YAxis tick={chartAxisTick(11)} />
        <Tooltip formatter={(v: number | string | undefined) => [formatNumber(Number(v) || 0), t('module.reports.label')]} />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ReportChartCard>
  );
}

// Parent component lazy loading pattern:
// const ModuleReportChartsLazy = lazy(() =>
//   import('./ModuleReportCharts').then((mod) => ({ default: mod.ModuleReportCharts })),
// );
// <Suspense fallback={<Skeleton className="h-chart-md w-full rounded-xl" />}>
//   <ModuleReportChartsLazy data={aggregates} />
// </Suspense>
