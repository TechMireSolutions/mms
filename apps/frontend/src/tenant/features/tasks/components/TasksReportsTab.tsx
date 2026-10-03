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
  };

  const completionRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;

  const kpis = [
    {
      title: t('tasks.metrics.total'),
      value: m.total,
      icon: ListTodo,
      accent: 'border-blue-500/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: t('tasks.metrics.inProgress'),
      value: m.inProgress,
      icon: Clock,
      accent: 'border-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    {
      title: t('tasks.metrics.completed'),
      value: m.completed,
      icon: CheckCircle2,
      accent: 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: t('tasks.metrics.blocked'),
      value: m.blocked,
      icon: AlertTriangle,
      accent: 'border-red-500/20 text-red-600 dark:text-red-400',
    },
    {
      title: t('tasks.metrics.overdue'),
      value: m.overdue,
      icon: RotateCcw,
      accent: 'border-rose-500/20 text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      accent: 'border-purple-500/20 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-4 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 text-muted-foreground mb-2">
                <span className="text-xs font-medium truncate">{kpi.title}</span>
                <Icon className={`h-4 w-4 shrink-0 ${kpi.accent}`} />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress & Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-foreground">Status Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'To Do', count: m.todo, color: 'bg-slate-400' },
              { label: 'In Progress', count: m.inProgress, color: 'bg-blue-500' },
              { label: 'In Review', count: m.inReview, color: 'bg-purple-500' },
              { label: 'Blocked', count: m.blocked, color: 'bg-red-500' },
              { label: 'Completed', count: m.completed, color: 'bg-emerald-500' },
            ].map((row, i) => {
              const pct = m.total > 0 ? Math.round((row.count / m.total) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${row.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Health */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-1">Execution Health</h3>
            <p className="text-xs text-muted-foreground">
              Overall velocity and task turnaround efficiency across the active cycle.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/50">
              <span className="text-xs font-medium text-foreground">On-Time Performance</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {m.total > 0
                  ? `${Math.max(0, Math.round(((m.total - m.overdue) / m.total) * 100))}%`
                  : '100%'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/50">
              <span className="text-xs font-medium text-foreground">Blocked Impediments</span>
              <span
                className={`text-sm font-bold ${
                  m.blocked > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {m.blocked} task{m.blocked !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/50">
              <span className="text-xs font-medium text-foreground">Active Workload</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {m.inProgress + m.inReview} tasks in flight
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
