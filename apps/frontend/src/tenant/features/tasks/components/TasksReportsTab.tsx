/**
 * @file TasksReportsTab.tsx
 * @description Tasks Reports tier — KPI cards, Recharts series, and execution health.
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { useTaskMetrics } from '@/tenant/features/tasks/hooks/useTasksApi';
import { StatsSkeleton } from '@/components/ui/LoadingState';
import { useTranslation } from '@/hooks/useTranslation';
import { TasksReportsCharts } from './TasksReportsCharts';

export function TasksReportsTab(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: metrics, isLoading } = useTaskMetrics();

  if (isLoading) {
    return <StatsSkeleton count={6} />;
  }

  const m = metrics ?? {
    total: 0,
    todo: 0,
    inProgress: 0,
    inReview: 0,
    blocked: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
  };

  const completionRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
  const onTimeRate =
    m.total > 0 ? Math.max(0, Math.round(((m.total - m.overdue) / m.total) * 100)) : 100;

  const kpis: Array<{
    title: string;
    value: string | number;
    icon: typeof ListTodo;
    accentClass: string;
  }> = [
    {
      title: t('tasks.metrics.total'),
      value: m.total,
      icon: ListTodo,
      accentClass: 'text-primary',
    },
    {
      title: t('tasks.metrics.inProgress'),
      value: m.inProgress,
      icon: Clock,
      accentClass: 'text-warning',
    },
    {
      title: t('tasks.metrics.completed'),
      value: m.completed,
      icon: CheckCircle2,
      accentClass: 'text-success',
    },
    {
      title: t('tasks.metrics.blocked'),
      value: m.blocked,
      icon: AlertTriangle,
      accentClass: 'text-destructive',
    },
    {
      title: t('tasks.metrics.overdue'),
      value: m.overdue,
      icon: RotateCcw,
      accentClass: 'text-destructive',
    },
    {
      title: t('tasks.metrics.completionRate'),
      value: `${completionRate}%`,
      icon: TrendingUp,
      accentClass: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="rounded-lg border border-border bg-card p-4 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 text-muted-foreground mb-2">
                <span className="text-xs font-medium truncate">{kpi.title}</span>
                <Icon className={`h-4 w-4 shrink-0 ${kpi.accentClass}`} aria-hidden />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      <TasksReportsCharts metrics={m} />

      <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-foreground mb-1">
            {t('tasks.reports.executionHealth')}
          </h3>
          <p className="text-xs text-muted-foreground text-wrap-pretty">
            {t('tasks.reports.executionHealthHint')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/50">
            <span className="text-xs font-medium text-foreground">{t('tasks.reports.onTime')}</span>
            <span className="text-sm font-bold text-success">{onTimeRate}%</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/50">
            <span className="text-xs font-medium text-foreground">{t('tasks.metrics.blocked')}</span>
            <span
              className={`text-sm font-bold ${
                m.blocked > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {t('tasks.reports.blockedCount', { count: m.blocked })}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/50">
            <span className="text-xs font-medium text-foreground">
              {t('tasks.reports.activeWorkload')}
            </span>
            <span className="text-sm font-bold text-primary">
              {t('tasks.reports.inFlight', { count: m.inProgress + m.inReview })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
