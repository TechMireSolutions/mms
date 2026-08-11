import React from 'react';
import {
  Cell, PieChart, Pie, Tooltip, TooltipContentProps,
  BarChart, Bar, XAxis, YAxis,
  RadarChart, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { ChartGrid, ChartPolarGrid, chartAxisTick } from '@/components/ui/ChartGrid';
import { useTranslation } from '@/hooks/useTranslation';
import { formatNumber } from '@mms/shared';
import type { HasanatPoint } from './useHasanatChartData';

const HasanatTooltip = ({ active = false, payload = [] }: Partial<TooltipContentProps>) => {
  const { t } = useTranslation();
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      title={payload?.[0]?.name}
      value={t("hasanat.dashboard.pts", { count: formatNumber(payload?.[0]?.value) })}
    />
  );
};

interface HasanatChartPlotProps {
  chartType: 'pie' | 'bar' | 'radar';
  hasanatData: HasanatPoint[];
  activeColors: { mem: string; att: string; beh: string };
}

export function HasanatChartPlot({ chartType, hasanatData, activeColors }: HasanatChartPlotProps): React.JSX.Element {
  const { t } = useTranslation();

  if (chartType === 'pie') {
    return (
      <div className="flex-shrink-0" aria-hidden="true">
        <PieChart width={120} height={120}>
          <Pie data={hasanatData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={3} dataKey="value">
            {hasanatData.map((hasanatPoint, index) => (
              <Cell key={index} fill={hasanatPoint.color} />
            ))}
          </Pie>
          <Tooltip content={<HasanatTooltip />} />
        </PieChart>
      </div>
    );
  }

  if (chartType === 'bar') {
    return (
      <div className="flex-1 w-full" aria-hidden="true">
        <SafeResponsiveContainer height={120}>
          <BarChart data={hasanatData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <ChartGrid vertical={false} />
            <XAxis dataKey="name" tick={chartAxisTick(9, true)} axisLine={false} tickLine={false} />
            <YAxis tick={chartAxisTick(9, true)} axisLine={false} tickLine={false} />
            <Tooltip content={<HasanatTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {hasanatData.map((hasanatPoint, index) => (
                <Cell key={index} fill={hasanatPoint.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </SafeResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-full sm:w-[9.375rem] h-[7.5rem]" aria-hidden="true">
      <SafeResponsiveContainer height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={hasanatData}>
          <ChartPolarGrid />
          <PolarAngleAxis dataKey="name" tick={chartAxisTick(8, true)} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={chartAxisTick(7)} />
          <Radar name={t('dashboard.widgets.hasanatPointsSeries')} dataKey="value" stroke={activeColors.mem} fill={activeColors.mem} fillOpacity={0.35} />
          <Tooltip content={<HasanatTooltip />} />
        </RadarChart>
      </SafeResponsiveContainer>
    </div>
  );
}
