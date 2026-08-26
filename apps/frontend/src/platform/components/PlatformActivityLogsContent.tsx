import React, { useState, useMemo } from 'react';
import {
  Activity,
  ShieldAlert,
  User,
  Terminal,
  Calendar,
  Search,
  Trash2,
  PlusCircle,
  RefreshCw,
  Settings,
  Key,
  Download,
} from 'lucide-react';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformActivityLogs } from '@/platform/hooks/usePlatformActivityLogs';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerFileDownload } from '@/lib/download';
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
    return { tone: SEMANTIC_BADGE.info, Icon: RefreshCw };
  }
  if (action.includes('login') || action.includes('auth') || action.includes('password')) {
    return { tone: SEMANTIC_BADGE.warning, Icon: Key };
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

  const items = useMemo(() => {
    const raw = logs ?? [];
    if (!filterQuery.trim()) return raw;
    const q = filterQuery.trim().toLowerCase();
    return raw.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        (l.targetResource && l.targetResource.toLowerCase().includes(q)) ||
        (l.targetId && l.targetId.toLowerCase().includes(q)) ||
        (l.metadataMessage && l.metadataMessage.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
    );
  }, [logs, filterQuery]);

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const headers = ['ID', 'Date', 'Action', 'User Email', 'Target Resource', 'Target ID', 'IP Address', 'Metadata'];
    const rows = items.map((log) => [
      log.id,
      log.createdAt,
      log.action,
      log.userEmail,
      log.targetResource ?? '',
      log.targetId ?? '',
      log.ipAddress ?? '',
      (log.metadataMessage ?? '').replace(/"/g, '""'),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `platform-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`);
  };

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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Filter Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
              <Input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={t('platform.filterLogsPlaceholder')}
                className="w-full h-9 ps-9 pe-3 text-xs rounded-xl"
                aria-label={t('platform.filterLogsPlaceholder')}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={items.length === 0}
              className="h-9 px-3 text-xs font-semibold rounded-xl shrink-0"
              title={t('platform.exportCsv')}
            >
              <Download className="w-3.5 h-3.5 me-1.5" aria-hidden />
              {t('platform.exportCsv')}
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={filterQuery ? t('platform.noMatchingLogs') : t('platform.noActivityLogsYet')}
            compact
          />
        ) : (
          <div className="relative border-s-2 border-border/60 ms-4 ps-6 space-y-4">
            {items.map((log) => {
              const { tone, Icon } = getActionMeta(log.action);
              const formattedDate = formatDate(log.createdAt);
              const hasMetadata = Boolean(log.metadataMessage || log.targetResource || log.targetId);

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -start-9 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-xs">
                    <Icon className="w-3.5 h-3.5 text-foreground" aria-hidden />
                  </div>

                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-all shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider', tone)}>
                          {log.action.replace(/_/g, ' ')}
                        </span>

                        {log.targetResource && (
                          <span className="px-2 py-0.5 rounded-md text-3xs font-medium bg-muted text-muted-foreground border border-border/40">
                            {log.targetResource}{log.targetId ? `: ${log.targetId}` : ''}
                          </span>
                        )}

                        <span className="text-xs font-bold text-foreground flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                          {log.userEmail}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        {log.ipAddress && (
                          <span className="font-mono bg-muted/60 border border-border/40 px-2 py-0.5 rounded text-3xs font-semibold">
                            {log.ipAddress}
                          </span>
                        )}

                        <span className="flex items-center gap-1 font-medium text-3xs">
                          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden />
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    {hasMetadata && log.metadataMessage && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 border border-border/30 font-mono">
                          {log.metadataMessage}
                        </p>
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
