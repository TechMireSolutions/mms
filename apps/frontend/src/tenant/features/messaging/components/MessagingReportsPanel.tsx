import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2 } from 'lucide-react';
import {
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormSelect } from '@/components/ui/FormSelect';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useMessageLogs, useMessagingMetrics } from '@/hooks/useMessaging';
import { useMessagingRecipientsByIds } from '../hooks/useMessagingContactsByIds';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { MessagingReportsLogTable } from './MessagingReportsLogTable';
import {
  exportMessagingLogsFiltered,
  messagingExportEndDateBound,
} from './messagingReportsExport';

const MessagingReportsVolumeChart = lazy(() =>
  import('./MessagingReportsVolumeChart').then((mod) => ({ default: mod.MessagingReportsVolumeChart })),
);

interface MessagingReportsPanelProps {
  canWrite: boolean;
  canClearLogs: boolean;
  onClearLogsRequest: () => void;
  onResend: (log: Message, recipient: MessagingRecipient) => void;
}

export function MessagingReportsPanel({
  canWrite,
  canClearLogs,
  onClearLogsRequest,
  onResend,
}: MessagingReportsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { categorySelectOptions, channelSelectOptions, statusOptions, logStatusConfig } = useMessagingPageOptions();
  const [search, setSearch] = useState('');
  const [logsPage, setLogsPage] = useState(1);
  const [channel, setChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'skipped'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 250);

  const queryStartDate = startDate.trim() || undefined;
  const queryEndDate = endDate.trim() ? messagingExportEndDateBound(endDate) : undefined;

  const filterKey = `${debouncedSearch}|${channel}|${category}|${status}|${startDate}|${endDate}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (filterKey !== activeFilterKey) {
    setActiveFilterKey(filterKey);
    if (logsPage !== 1) setLogsPage(1);
  }
  const pageForQuery = filterKey !== activeFilterKey ? 1 : logsPage;

  const logsQuery = useMessageLogs({
    channel,
    category,
    search: debouncedSearch,
    status,
    startDate: queryStartDate,
    endDate: queryEndDate,
    page: pageForQuery,
    pageSize: MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  });
  const metricsQuery = useMessagingMetrics({
    startDate: queryStartDate,
    endDate: queryEndDate,
  });
  const contactIds = useMemo(() => logsQuery.logs.map((log) => log.contactId), [logsQuery.logs]);
  const { data: recipients = [] } = useMessagingRecipientsByIds(contactIds);
  const recipientMap = useMemo(
    () => new Map(recipients.flatMap((recipient) => [[recipient.id, recipient], [String(recipient.id), recipient]])),
    [recipients],
  );
  const { getColumnWidth, setColumnWidth } = useMessagingHistoryColumnLayout();

  const getRecipientName = useCallback((contactId: string | number): string => {
    const recipient = recipientMap.get(contactId) ?? recipientMap.get(String(contactId));
    return recipient?.name || t('messaging.contactFallback', { id: contactId });
  }, [recipientMap, t]);

  const handleResendLog = useCallback((log: Message): void => {
    const recipient = recipientMap.get(log.contactId) ?? recipientMap.get(String(log.contactId));
    onResend(log, recipient ?? {
      id: log.contactId,
      name: getRecipientName(log.contactId),
      phone: '',
      email: '',
    });
  }, [recipientMap, getRecipientName, onResend]);

  const stats = metricsQuery.data;
  const chartData = stats
    ? [
      { name: t('messaging.channel.sms'), value: stats.smsCount },
      { name: t('messaging.channel.whatsapp'), value: stats.whatsappCount },
      { name: t('messaging.channel.email'), value: stats.emailCount },
    ].filter((item) => item.value > 0)
    : [];
  const metricsPending = metricsQuery.isPending && !metricsQuery.data;

  const exportAllFilteredLogs = async (): Promise<void> => {
    if (!canWrite || exporting) return;
    setExporting(true);
    try {
      await exportMessagingLogsFiltered({
        channel,
        category,
        debouncedSearch,
        status,
        startDate: queryStartDate,
        endDate,
        t,
      });
    } catch {
      notify.error(t('messaging.exportFailed'), { description: t('messaging.loadFailedHint') });
    } finally {
      setExporting(false);
    }
  };

  if (logsQuery.isError || metricsQuery.isError) {
    return (
      <ErrorState
        title={t('messaging.loadFailed')}
        description={t('messaging.loadFailedHint')}
        onRetry={() => void Promise.all([logsQuery.refetch(), metricsQuery.refetch()])}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-grow flex-wrap items-center gap-2">
            <SearchBar placeholder={t('messaging.search.placeholder')} value={search} onChange={setSearch} className="max-w-xs flex-grow" />
            <SegmentedPillFilter options={channelSelectOptions} value={channel} onChange={(value) => setChannel(value as typeof channel)} size="sm" />
            <SegmentedPillFilter options={statusOptions} value={status} onChange={(value) => setStatus(value as typeof status)} size="sm" />
            <FormSelect id="logCategory" value={category} onChange={setCategory} options={categorySelectOptions} />
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="text-sm"
              placeholder={t('messaging.dateFrom')}
            />
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              className="text-sm"
              placeholder={t('messaging.dateTo')}
            />
          </div>
          <div className="flex items-center gap-2">
            {canWrite && logsQuery.total > 0 && (
              <Button variant="outline" size="sm" disabled={exporting} onClick={() => void exportAllFilteredLogs()} className="font-semibold">
                <Download className="me-1.5 h-4 w-4" />
                {exporting ? t('common.loading') : t('messaging.exportLogs')}
              </Button>
            )}
            {logsQuery.total > 0 && canClearLogs && (
              <Button variant="outline" size="sm" onClick={onClearLogsRequest} className="font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="me-1.5 h-4 w-4" /> {t('messaging.clearLogs')}
              </Button>
            )}
          </div>
        </div>

        <MessagingReportsLogTable
          logs={logsQuery.logs}
          total={logsQuery.total}
          page={logsQuery.page}
          pageSize={logsQuery.pageSize}
          hasMore={logsQuery.hasMore}
          canWrite={canWrite}
          isPending={logsQuery.isPending}
          isFetching={logsQuery.isFetching}
          logStatusConfig={logStatusConfig}
          getRecipientName={getRecipientName}
          getColumnWidth={getColumnWidth}
          setColumnWidth={setColumnWidth}
          onPageChange={setLogsPage}
          onResendLog={handleResendLog}
        />
      </div>

      {metricsPending ? (
        <div
          className="h-[15rem] animate-pulse rounded-xl border border-border bg-muted/20"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : (
        <Suspense fallback={<div className="h-[15rem] animate-pulse rounded-xl border border-border bg-muted/20" aria-hidden />}>
          <MessagingReportsVolumeChart chartData={chartData} />
        </Suspense>
      )}
    </motion.div>
  );
}
