import React from 'react';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { formatNumber } from '@mms/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HasanatChartPlot } from '@/components/dashboard-widgets/charts/HasanatChartPlot';
import { useHasanatChartData } from '@/components/dashboard-widgets/charts/useHasanatChartData';

export function HasanatChart({ isEditMode = false }: { isEditMode?: boolean }): React.JSX.Element {
  const {
    t,
    chartType,
    colorTheme,
    updatePref,
    hasanatData,
    total,
    activeColors,
  } = useHasanatChartData();

  return (
    <WidgetCard ariaLabelledby="hasanat-chart-heading" accentColor="warning" className="p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-4 ps-1.5 select-none">
        <div>
          <h3 id="hasanat-chart-heading" className="text-sm font-bold text-foreground m-0">
            {t('widget.title.hasanatDistribution')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 m-0 font-medium">
            {t('dashboard.charts.hasanat.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 ms-auto">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border/50">
              <Select
                value={chartType}
                onValueChange={(value) => {
                  updatePref('hasanatChartType', value as 'pie' | 'bar' | 'radar');
                }}
              >
                <SelectTrigger className="min-h-11 min-w-11 px-1.5 rounded text-xs font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder={t('reports.visualizer.chartType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pie">{t('dashboard.charts.hasanat.pieDonut')}</SelectItem>
                  <SelectItem value="bar">{t('dashboard.charts.hasanat.barChart')}</SelectItem>
                  <SelectItem value="radar">{t('dashboard.charts.hasanat.radarChart')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={colorTheme}
                onValueChange={(value) => {
                  updatePref('hasanatChartColor', value);
                }}
              >
                <SelectTrigger className="min-h-11 min-w-11 px-1.5 rounded text-xs font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none">
                  <SelectValue placeholder={t('reports.visualizer.colorPalette')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">{t('dashboard.charts.hasanat.mixed')}</SelectItem>
                  <SelectItem value="emerald">{t('dashboard.charts.attendance.emerald')}</SelectItem>
                  <SelectItem value="blue">{t('dashboard.charts.attendance.blue')}</SelectItem>
                  <SelectItem value="violet">{t('dashboard.charts.attendance.violet')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-lg font-black text-foreground m-0 select-none tabular-nums">{formatNumber(total)}</p>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-4 min-h-[7.5rem]">
        <HasanatChartPlot chartType={chartType} hasanatData={hasanatData} activeColors={activeColors} />

        <div className="flex-1 w-full space-y-2 text-start">
          {hasanatData.map((hasanatPoint) => {
            const percentage = total > 0 ? ((hasanatPoint.value / total) * 100).toFixed(0) : '0';
            return (
              <div key={hasanatPoint.name} aria-label={`${hasanatPoint.name}: ${percentage}%`}>
                <div className="mb-1 flex min-w-0 items-center justify-between gap-2 select-none">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="w-2 h-2 shrink-0 rounded-full" style={{ background: hasanatPoint.color }} aria-hidden="true" />
                    <span className="min-w-0 truncate text-xs text-muted-foreground">{hasanatPoint.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{percentage}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: hasanatPoint.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetCard>
  );
}
