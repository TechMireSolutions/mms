import React from 'react';
import { BarChart3, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { useTranslation } from '@/hooks/useTranslation';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  borderColor: 'hsl(var(--border))',
  borderRadius: '0.75rem',
  boxShadow: 'var(--shadow-surface)',
};

const LEGEND_FORMATTER = (value: string) => (
  <span className="text-xs font-semibold text-foreground">{value}</span>
);

interface PlatformReportsPieChartsProps {
  totalWorkspaces: number;
  activeWorkspaces: number;
  disabledWorkspaces: number;
  verifyRequiredCount: number;
  verifyOptionalCount: number;
}

export function PlatformReportsPieCharts({
  totalWorkspaces,
  activeWorkspaces,
  disabledWorkspaces,
  verifyRequiredCount,
  verifyOptionalCount,
}: PlatformReportsPieChartsProps): React.JSX.Element {
  const { t } = useTranslation();

  const statusChartData = [
    { name: t('platform.workspaceActive'), value: activeWorkspaces, color: 'hsl(var(--success))' },
    { name: t('platform.workspaceInactive'), value: disabledWorkspaces, color: 'hsl(var(--destructive))' },
  ];

  const verificationChartData = [
    { name: t('platform.emailVerificationRequired'), value: verifyRequiredCount, color: 'hsl(var(--primary))' },
    { name: t('platform.emailVerificationOptional'), value: verifyOptionalCount, color: 'hsl(var(--muted-foreground))' },
  ];

  const renderPie = (data: typeof statusChartData, keyPrefix: string) => (
    <SafeResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          outerRadius={75}
          innerRadius={45}
          paddingAngle={4}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${keyPrefix}-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend verticalAlign="bottom" height={36} formatter={LEGEND_FORMATTER} />
      </PieChart>
    </SafeResponsiveContainer>
  );

  const emptyNode = <p className="text-xs text-muted-foreground">{t('apex.noMadrasasYet')}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <WidgetCard className="p-6 space-y-4">
        <WidgetCardHeader
          icon={<BarChart3 className="w-4 h-4 text-primary" />}
          title={t('platform.workspaceDistribution')}
          subtitle={t('platform.visualizerSubtitle')}
        />
        <div className="h-64 w-full flex flex-col items-center justify-center">
          {totalWorkspaces === 0 ? emptyNode : renderPie(statusChartData, 'status')}
        </div>
      </WidgetCard>

      <WidgetCard className="p-6 space-y-4">
        <WidgetCardHeader
          icon={<Lock className="w-4 h-4 text-primary" />}
          title={t('platform.reports.emailVerificationBreakdown')}
          subtitle={t('platform.reports.emailVerificationBreakdownSub')}
        />
        <div className="h-64 w-full flex flex-col items-center justify-center">
          {totalWorkspaces === 0 ? emptyNode : renderPie(verificationChartData, 'verify')}
        </div>
      </WidgetCard>
    </div>
  );
}
