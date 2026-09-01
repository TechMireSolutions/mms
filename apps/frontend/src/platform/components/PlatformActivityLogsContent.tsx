import React, { useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  ShieldAlert,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformActivityLogs } from '@/platform/hooks/usePlatformActivityLogs';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { triggerFileDownload } from '@/lib/download';
import { getActionCategory, type LogCategory } from './activity-logs/activityLogMeta';
import { ActivityLogRow } from './activity-logs/ActivityLogRow';
import { ActivityLogInspectModal } from './activity-logs/ActivityLogInspectModal';
import type { PlatformActivityLogItem } from '@/platform/hooks/usePlatformActivityLogs';

type LogTimeframe = 'all' | 'today' | '7d' | '30d';

export function PlatformActivityLogsContent(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: logs, isLoading, isError, refetch, isFetching } = usePlatformActivityLogs();

  const [searchParams, setSearchParams] = useSearchParams();
  const filterQuery = searchParams.get('q') ?? '';
  const category = (searchParams.get('cat') as LogCategory) ?? 'all';
  const timeframe = (searchParams.get('time') as LogTimeframe) ?? 'all';
  const [inspectLog, setInspectLog] = React.useState<PlatformActivityLogItem | null>(null);

  const deferredQuery = useDeferredValue(filterQuery);

  const setFilterQuery = (q: string) => {
    setSearchParams((p) => {
      if (q) p.set('q', q);
      else p.delete('q');
      return p;
    }, { replace: true });
  };

  const setCategory = (cat: LogCategory) => {
    setSearchParams((p) => {
      if (cat === 'all') p.delete('cat');
      else p.set('cat', cat);
      return p;
    }, { replace: true });
  };

  const setTimeframe = (time: LogTimeframe) => {
    setSearchParams((p) => {
      if (time === 'all') p.delete('time');
      else p.set('time', time);
      return p;
    }, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchParams((p) => {
      p.delete('q');
      p.delete('cat');
      p.delete('time');
      return p;
    }, { replace: true });
  };

  const isFiltered = Boolean(filterQuery || category !== 'all' || timeframe !== 'all');

  const items = React.useMemo(() => {
    const raw = logs ?? [];
    const now = Date.now();
    const q = deferredQuery.trim().toLowerCase();

    return raw.filter((l) => {
      if (q) {
        const matchesText =
          l.action.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          (l.targetResource && l.targetResource.toLowerCase().includes(q)) ||
          (l.targetId && l.targetId.toLowerCase().includes(q)) ||
          (l.metadataMessage && l.metadataMessage.toLowerCase().includes(q)) ||
          (l.ipAddress && l.ipAddress.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      if (category !== 'all' && getActionCategory(l.action) !== category) return false;

      if (timeframe !== 'all') {
        const created = new Date(l.createdAt).getTime();
        if (!Number.isFinite(created)) return true;
        if (timeframe === 'today') {
          if (created < new Date().setHours(0, 0, 0, 0)) return false;
        } else if (timeframe === '7d') {
          if (created < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (timeframe === '30d') {
          if (created < now - 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }, [logs, deferredQuery, category, timeframe]);

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

  if (isLoading) return <CardSkeleton count={3} className="grid-cols-1" />;

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
      <ModuleWorkToolbar
        regionLabel={t('platform.activityLogsTitle')}
        search={filterQuery}
        onSearchChange={setFilterQuery}
        searchPlaceholder={t('platform.filterLogsPlaceholder')}
        searchId="platform-logs-search"
        isSearching={isFetching}
        hasActiveFilters={isFiltered}
        onClearFilters={handleClearFilters}
        clearFiltersLabel={t('common.clearFilters')}
        primaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 h-11 min-w-11 w-11 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={items.length === 0}
              className="min-h-11 h-11 px-3.5 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 shrink-0 cursor-pointer"
              title={t('platform.exportCsv')}
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              {t('platform.exportCsv')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SubTabBar
            tabs={[
              { key: 'all', label: t('platform.logs.categoryAll') },
              { key: 'auth', label: t('platform.logs.categoryAuth') },
              { key: 'workspace', label: t('platform.logs.categoryWorkspace') },
              { key: 'system', label: t('platform.logs.categorySystem') },
              { key: 'admin', label: t('platform.logs.categoryAdmin') },
            ]}
            value={category}
            onChange={(k) => setCategory(k as LogCategory)}
          />

          <SubTabBar
            tabs={[
              { key: 'all', label: t('platform.logs.timeAll') },
              { key: 'today', label: t('platform.logs.timeToday') },
              { key: '7d', label: t('platform.logs.timeWeek') },
              { key: '30d', label: t('platform.logs.timeMonth') },
            ]}
            value={timeframe}
            onChange={(k) => setTimeframe(k as LogTimeframe)}
          />
        </div>
      </ModuleWorkToolbar>

      <WidgetCard className="p-6 space-y-6">
        <WidgetCardHeader
          icon={<Activity className="w-5 h-5 text-primary" />}
          title={t('platform.activityLogsTitle')}
          subtitle={t('platform.activityLogsSubtitle')}
        />

        {items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={isFiltered ? t('platform.noMatchingLogs') : t('platform.noActivityLogsYet')}
            action={
              isFiltered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="min-h-11 h-11 px-4 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t('common.clearFilters')}
                </Button>
              ) : undefined
            }
            compact
          />
        ) : (
          <div className="relative border-s-2 border-border/60 ms-4 ps-6 space-y-4 pt-2">
            {items.map((log) => (
              <ActivityLogRow key={log.id} log={log} onInspect={setInspectLog} />
            ))}
          </div>
        )}
      </WidgetCard>

      <ActivityLogInspectModal log={inspectLog} onClose={() => setInspectLog(null)} />
    </div>
  );
}

export default PlatformActivityLogsContent;
