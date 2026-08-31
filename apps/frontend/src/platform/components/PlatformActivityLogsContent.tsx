import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformActivityLogs } from '@/platform/hooks/usePlatformActivityLogs';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { WidgetCardHeader } from '@/components/ui/WidgetCardHeader';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/SearchBar';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { triggerFileDownload } from '@/lib/download';
import { getActionCategory, type LogCategory } from './activity-logs/activityLogMeta';
import { ActivityLogRow } from './activity-logs/ActivityLogRow';
import { ActivityLogInspectModal } from './activity-logs/ActivityLogInspectModal';
import type { PlatformActivityLogItem } from '@/platform/hooks/usePlatformActivityLogs';

type LogTimeframe = 'all' | 'today' | '7d' | '30d';

export function PlatformActivityLogsContent(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: logs, isLoading, isError, refetch } = usePlatformActivityLogs();
  const [filterQuery, setFilterQuery] = useState('');
  const [category, setCategory] = useState<LogCategory>('all');
  const [timeframe, setTimeframe] = useState<LogTimeframe>('all');
  const [inspectLog, setInspectLog] = useState<PlatformActivityLogItem | null>(null);

  const items = (() => {
    const raw = logs ?? [];
    const now = Date.now();

    return raw.filter((l) => {
      if (filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
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
  })();

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
      <WidgetCard className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <WidgetCardHeader
            icon={<Activity className="w-5 h-5 text-primary" />}
            title={t('platform.activityLogsTitle')}
            subtitle={t('platform.activityLogsSubtitle')}
          />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchBar
              value={filterQuery}
              onChange={setFilterQuery}
              placeholder={t('platform.filterLogsPlaceholder')}
              className="w-full sm:w-64"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={items.length === 0}
              className="h-9 px-3 text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
              title={t('platform.exportCsv')}
            >
              <Download className="w-3.5 h-3.5 me-1.5" aria-hidden />
              {t('platform.exportCsv')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={filterQuery || category !== 'all' || timeframe !== 'all' ? t('platform.noMatchingLogs') : t('platform.noActivityLogsYet')}
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
