import React, { lazy, Suspense, useCallback, useState } from 'react';
import { MessageSquareOff } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { useMessagingMetrics } from '@/tenant/hooks/collections/messaging';
import {
  MESSAGING_MODULE_MANIFEST,
  getChannelLabelKey,
} from '@mms/shared';
import {
  MESSAGING_CHANNEL_CONFIG,
  type MessagingChannelConfig,
} from '@/tenant/features/messaging/config';
import {
  exportMessagingLogsFiltered,
  messagingExportEndDateBound,
} from '@/tenant/features/messaging/components/messagingReportsExport';
import { calculateReportDateRange } from '@/lib/reports/reportDateUtils';
import { notify } from '@/lib/notify';
import { WORK_SURFACE, WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { SEMANTIC_TEXT, getSolidBgClass } from '@/lib/semanticTone';
import { MessagingReportHeaderBar } from './MessagingReportHeaderBar';
import { type ChannelSummaryRow, MessagingReportSummaryTable } from './MessagingReportSummaryTable';
import PinnedWidgets from '@/components/ui/reports/PinnedWidgets';

const MessagingReportsVolumeChart = lazy(() =>
  import('@/tenant/features/messaging/components/MessagingReportsVolumeChart').then((m) => ({
    default: m.MessagingReportsVolumeChart,
  }))
);
import type { ExportColumn } from '@/components/ui/ExportToolbar';

export interface MessagingReportProps {
  canWrite?: boolean;
}

export default function MessagingReport({ canWrite: canWriteProp }: MessagingReportProps = {}): React.JSX.Element {
  const { canWrite: canWritePermission } = useModulePermissions(MESSAGING_MODULE_MANIFEST);
  const canWrite = canWriteProp ?? canWritePermission;
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const queryStartDate = (() => startDate.trim() || undefined)();
  const queryEndDate = (() => (endDate.trim() ? messagingExportEndDateBound(endDate) : undefined))();

  const metricsQuery = useMessagingMetrics({
    startDate: queryStartDate,
    endDate: queryEndDate,
  });

  const stats = metricsQuery.data;
  const total = stats?.total ?? 0;

  const chartData = (() => {
    if (!stats) return [];
    return (Object.values(MESSAGING_CHANNEL_CONFIG) as MessagingChannelConfig[]).map((config) => {
      const value = (stats[`${config.id}Count` as keyof typeof stats] as number) ?? 0;
      return {
        name: t(getChannelLabelKey(config.id)),
        value,
        fillColor: `var(--color-${config.themeAccent})`,
      };
    }).filter((item) => item.value > 0);
  })();

  const showSkeleton = metricsQuery.isPending && !metricsQuery.data;

  const calcPercentage = useCallback(
    (count: number): string => {
      if (total === 0) return '0%';
      return `${Math.round((count / total) * 100)}%`;
    },
    [total],
  );

  const applyPreset = ((days?: number): void => {
    if (days === undefined) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const preset = days === 0 ? 'today' : days === 7 ? '7d' : days === 30 ? '30d' : 'none';
    const range = calculateReportDateRange(preset);
    setStartDate(range.from);
    setEndDate(range.to);
  });

  const exportAllFilteredLogs = (async (): Promise<void> => {
    if (!canWrite || exporting) return;
    setExporting(true);
    try {
      await exportMessagingLogsFiltered({
        channel: 'all',
        category: 'all',
        debouncedSearch: '',
        status: 'all',
        startDate: queryStartDate,
        endDate,
        t,
      });
    } catch {
      notify.error(t('messaging.exportFailed'), { description: t('messaging.loadFailedHint') });
    } finally {
      setExporting(false);
    }
  });

  const channelExportColumns = (() => [
    { key: 'channel', header: t('messaging.channel') },
    { key: 'count', header: t('common.details') },
    { key: 'rate', header: t('reports.kpi.growthRate') },
  ])() as ExportColumn[];

  const channelSummaryRows = (() => {
    if (!stats) return [];
    return (Object.values(MESSAGING_CHANNEL_CONFIG) as MessagingChannelConfig[]).map((config) => {
      const count = (stats[`${config.id}Count` as keyof typeof stats] as number) ?? 0;
      return {
        id: config.id,
        channel: t(getChannelLabelKey(config.id)),
        count,
        rate: calcPercentage(count),
        accent: config.themeAccent,
      };
    });
  })() as ChannelSummaryRow[];

  if (metricsQuery.isError) {
    return (
      <ErrorState
        title={t('messaging.loadFailed')}
        description={t('messaging.loadFailedHint')}
        onRetry={() => void metricsQuery.refetch()}
      />
    );
  }

  return (
    <ErrorBoundary>
      <MessagingReportHeaderBar
        startDate={startDate}
        endDate={endDate}
        exporting={exporting}
        canWrite={canWrite}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyPreset={applyPreset}
        onExport={() => void exportAllFilteredLogs()}
        t={t}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2">
          {showSkeleton ? (
            <Skeleton
              className="h-chart-lg w-full rounded-xl border border-border"
              role="status"
              aria-busy="true"
            />
          ) : total === 0 ? (
            <div className={`${WORK_SURFACE} p-8 flex flex-col items-center justify-center text-center h-full min-h-64 rounded-xl space-y-2`}>
              <MessageSquareOff className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">{t('messaging.noLogs')}</p>
              <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
            </div>
          ) : (
            <Suspense fallback={<Skeleton className="h-chart-lg w-full rounded-xl border border-border" aria-hidden />}>
              <MessagingReportsVolumeChart chartData={chartData} />
            </Suspense>
          )}
        </div>

        <div className={`${WORK_SURFACE} p-4 space-y-3 flex flex-col justify-between`}>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {t('messaging.channel')}
            </h4>

            {total > 0 && (
              <div className="mb-4 space-y-1.5">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                  {(Object.values(MESSAGING_CHANNEL_CONFIG) as MessagingChannelConfig[]).map((config) => {
                    const count = (stats?.[`${config.id}Count` as keyof typeof stats] as number) ?? 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={config.id}
                        style={{ width: `${(count / total) * 100}%` }}
                        className={`${getSolidBgClass(config.themeAccent)} transition-all duration-300`}
                        title={`${t(getChannelLabelKey(config.id))}: ${calcPercentage(count)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className={`${WORK_SURFACE_INNER} p-3 flex items-center justify-between`}>
                <span className="text-xs font-medium text-foreground">{t('messaging.stats.total')}</span>
                <span className={`font-bold text-sm ${SEMANTIC_TEXT.primary}`}>{total}</span>
              </div>
              {(Object.values(MESSAGING_CHANNEL_CONFIG) as MessagingChannelConfig[]).map((config) => {
                const count = (stats?.[`${config.id}Count` as keyof typeof stats] as number) ?? 0;
                return (
                  <div key={config.id} className={`${WORK_SURFACE_INNER} p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${getSolidBgClass(config.themeAccent)}`} />
                      <span className="text-xs font-medium text-foreground">{t(getChannelLabelKey(config.id))}</span>
                    </div>
                    <div className="text-end">
                      <span className={`font-bold text-sm ${SEMANTIC_TEXT[config.themeAccent as keyof typeof SEMANTIC_TEXT]}`}>{count}</span>
                      <span className="text-[11px] font-mono text-muted-foreground ms-1.5">({calcPercentage(count)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-4">
          <MessagingReportSummaryTable
            title={t('messaging.channel')}
            columns={channelExportColumns}
            rows={channelSummaryRows}
            detailsHeader={t('common.details')}
            growthRateHeader={t('reports.kpi.growthRate')}
          />
        </div>
      )}

      <div className="mt-4">
        <PinnedWidgets category="messaging" />
      </div>
    </ErrorBoundary>
  );
}
