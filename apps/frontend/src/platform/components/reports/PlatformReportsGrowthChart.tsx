import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { useTranslation } from '@/hooks/useTranslation';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';
import { SubTabBar } from '@/components/ui/SubTabBar';
import type { PlatformWorkspaceRow } from '@mms/shared';

type Timeframe = 'all' | '90d' | '30d';

interface PlatformReportsGrowthChartProps {
  workspaces: PlatformWorkspaceRow[] | undefined;
}

export function PlatformReportsGrowthChart({ workspaces }: PlatformReportsGrowthChartProps): React.JSX.Element {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  const filteredWorkspaces = useMemo(() => {
    if (!workspaces) return [];
    if (timeframe === 'all') return workspaces;
    const now = Date.now();
    const days = timeframe === '90d' ? 90 : 30;
    const threshold = now - days * 24 * 60 * 60 * 1000;
    return workspaces.filter((w) => {
      const created = new Date(w.createdAt).getTime();
      return Number.isFinite(created) && created >= threshold;
    });
  }, [workspaces, timeframe]);

  const growthTrendData = useMemo(() => {
    if (!filteredWorkspaces.length) return [];
    const sorted = [...filteredWorkspaces].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const monthMap = new Map<string, number>();
    for (const w of sorted) {
      const d = new Date(w.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
    let cumulative = 0;
    const data: { period: string; count: number; cumulative: number }[] = [];
    for (const [period, count] of monthMap.entries()) {
      cumulative += count;
      data.push({ period, count, cumulative });
    }
    return data;
  }, [filteredWorkspaces]);

  return (
    <WidgetCard className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <WidgetCardHeader
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          title={t('platform.reports.growthTrend')}
          subtitle={t('platform.reports.growthTrendSub')}
        />
        <SubTabBar
          tabs={[
            { key: 'all', label: t('platform.reports.timeframeAll') },
            { key: '90d', label: t('platform.reports.timeframe90d') },
            { key: '30d', label: t('platform.reports.timeframe30d') },
          ]}
          value={timeframe}
          onChange={(k) => setTimeframe(k as Timeframe)}
        />
      </div>

      <div className="h-64 w-full pt-4">
        {growthTrendData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {t('apex.noMadrasasYet')}
          </div>
        ) : (
          <SafeResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.75rem',
                  boxShadow: 'var(--shadow-surface)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name={t('platform.reports.cumulative')}
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#growthGradient)"
              />
            </AreaChart>
          </SafeResponsiveContainer>
        )}
      </div>
    </WidgetCard>
  );
}
