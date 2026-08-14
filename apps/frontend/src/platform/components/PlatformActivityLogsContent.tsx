import React from 'react';
import { Activity, ShieldAlert, User, Terminal, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformActivityLogs } from '@/platform/hooks/usePlatformActivityLogs';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';

function getActionTone(action: string): string {
  if (action.includes('delete') || action.includes('disable')) {
    return SEMANTIC_BADGE.destructive;
  }
  if (action.includes('create') || action.includes('enable')) {
    return SEMANTIC_BADGE.success;
  }
  if (action.includes('migrate') || action.includes('restart')) {
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
  }
  return SEMANTIC_BADGE.primary;
}

export function PlatformActivityLogsContent(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: logs, isLoading, isError, refetch } = usePlatformActivityLogs();

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

  const items = logs ?? [];

  return (
    <div className="space-y-6 w-full text-start">
      <WidgetCard className="p-6 space-y-6">
        <WidgetCardHeader
          icon={<Activity className="w-5 h-5 text-primary" />}
          title={t('platform.activityLogsTitle')}
          subtitle={t('platform.activityLogsSubtitle')}
        />

        {items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={t('platform.noActivityLogsYet')}
            compact
          />
        ) : (
          <div className="space-y-3">
            {items.map((log) => {
              const toneClass = getActionTone(log.action);
              const formattedDate = new Date(log.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-accent/20 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <Terminal className="w-4 h-4 text-primary" aria-hidden />
                    </div>

                    <div className="flex flex-col min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider', toneClass)}>
                          {log.action.replace(/_/g, ' ')}
                        </span>

                        <span className="text-xs font-bold text-foreground flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" aria-hidden />
                          {log.userEmail}
                        </span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-xl">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                    {log.ipAddress && (
                      <span className="font-mono bg-accent/50 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {log.ipAddress}
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden />
                      {formattedDate}
                    </span>
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
