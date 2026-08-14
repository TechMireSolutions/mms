import React, { useState, useMemo } from 'react';
import {
  Activity,
  ShieldAlert,
  User,
  Terminal,
  Calendar,
  Search,
  ChevronDown,
  ChevronRight,
  Trash2,
  PlusCircle,
  RefreshCw,
  Settings,
  Key,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformActivityLogs } from '@/platform/hooks/usePlatformActivityLogs';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';

function getActionMeta(action: string): { tone: string; Icon: React.ElementType } {
  if (action.includes('delete') || action.includes('disable') || action.includes('purge') || action.includes('reset')) {
    return { tone: SEMANTIC_BADGE.destructive, Icon: Trash2 };
  }
  if (action.includes('create') || action.includes('enable') || action.includes('onboard')) {
    return { tone: SEMANTIC_BADGE.success, Icon: PlusCircle };
  }
  if (action.includes('migrate') || action.includes('restart') || action.includes('reload')) {
    return { tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25', Icon: RefreshCw };
  }
  if (action.includes('login') || action.includes('auth') || action.includes('password')) {
    return { tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25', Icon: Key };
  }
  if (action.includes('setting') || action.includes('config') || action.includes('update')) {
    return { tone: SEMANTIC_BADGE.primary, Icon: Settings };
  }
  return { tone: SEMANTIC_BADGE.primary, Icon: Terminal };
}

export function PlatformActivityLogsContent(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: logs, isLoading, isError, refetch } = usePlatformActivityLogs();
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const items = useMemo(() => {
    const raw = logs ?? [];
    if (!filterQuery.trim()) return raw;
    const q = filterQuery.trim().toLowerCase();
    return raw.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
    );
  }, [logs, filterQuery]);

  if (isLoading) {
    return <CardSkeleton count={3} className="grid-cols-1" />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t('platform.loadFailed')}
        description={t('platform.loadFailedHint')}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 w-full text-start">
      <WidgetCard className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <WidgetCardHeader
            icon={<Activity className="w-5 h-5 text-primary" />}
            title={t('platform.activityLogsTitle')}
            subtitle={t('platform.activityLogsSubtitle')}
          />

          {/* Search Filter Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter logs by user, action..."
              className="w-full h-9 ps-9 pe-3 text-xs rounded-xl border border-border/80 bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={filterQuery ? 'No matching logs found' : t('platform.noActivityLogsYet')}
            compact
          />
        ) : (
          <div className="relative border-s-2 border-border/60 ms-4 ps-6 space-y-4">
            {items.map((log) => {
              const { tone, Icon } = getActionMeta(log.action);
              const formattedDate = new Date(log.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });
              const isExpanded = expandedLogId === log.id;
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -start-[37px] top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-xs">
                    <Icon className="w-3.5 h-3.5 text-foreground" aria-hidden />
                  </div>

                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-all shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider', tone)}>
                          {log.action.replace(/_/g, ' ')}
                        </span>

                        <span className="text-xs font-bold text-foreground flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                          {log.userEmail}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        {log.ipAddress && (
                          <span className="font-mono bg-muted/60 border border-border/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {log.ipAddress}
                          </span>
                        )}

                        <span className="flex items-center gap-1 font-medium text-[11px]">
                          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden />
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    {hasDetails && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          {isExpanded ? 'Hide Payload' : 'Inspect Details'}
                        </Button>

                        {isExpanded && (
                          <pre className="mt-2 p-3 rounded-lg bg-muted/70 border border-border/50 text-[11px] font-mono text-foreground overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </WidgetCard>
    </div>
  );
}

export default PlatformActivityLogsContent;
