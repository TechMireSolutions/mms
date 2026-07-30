import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2 } from 'lucide-react';
import {
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  toMessagingRecipient,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormSelect } from '@/components/ui/FormSelect';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useMessageLogs, useMessagingMetrics } from '@/hooks/useMessaging';
import { useMessagingContactsByIds } from '../hooks/useMessagingContactsByIds';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { MessagingReportsLogTable } from './MessagingReportsLogTable';
import { MessagingReportsVolumeChart } from './MessagingReportsVolumeChart';
import { exportMessagingLogsFiltered } from './messagingReportsExport';

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
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 250);

  const filterKey = `${debouncedSearch}|${channel}|${category}|${status}`;
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
    page: pageForQuery,
    pageSize: MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  });
  const metricsQuery = useMessagingMetrics();
  const contactIds = useMemo(() => logsQuery.logs.map((log) => log.contactId), [logsQuery.logs]);
  const { data: contacts = [] } = useMessagingContactsByIds(contactIds);
  const contactMap = useMemo(
    () => new Map(contacts.flatMap((contact) => [[contact.id, contact], [String(contact.id), contact]])),
    [contacts],
  );
  const { getColumnWidth, setColumnWidth } = useMessagingHistoryColumnLayout();

  const getRecipientName = useCallback((contactId: string | number): string => {
    const contact = contactMap.get(contactId) ?? contactMap.get(String(contactId));
    return contact ? getDisplayName(contact) : t('messaging.contactFallback', { id: contactId });
  }, [contactMap, t]);

  const handleResendLog = useCallback((log: Message): void => {
    const contact = contactMap.get(log.contactId) ?? contactMap.get(String(log.contactId));
    onResend(log, contact
      ? toMessagingRecipient(contact, { getDisplayName, getPrimaryPhone, getPrimaryEmail })
      : { id: log.contactId, name: getRecipientName(log.contactId), phone: '', email: '' });
  }, [contactMap, getRecipientName, onResend]);

  const stats = metricsQuery.data ?? {
    total: logsQuery.total,
    smsCount: 0,
    whatsappCount: 0,
    emailCount: 0,
  };
  const chartData = [
    { name: t('messaging.channel.sms'), value: stats.smsCount },
    { name: t('messaging.channel.whatsapp'), value: stats.whatsappCount },
    { name: t('messaging.channel.email'), value: stats.emailCount },
  ].filter((item) => item.value > 0);

  const exportAllFilteredLogs = async (): Promise<void> => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportMessagingLogsFiltered({ channel, category, debouncedSearch, status, t });
    } catch {
      notify.error(t('settings.serverSaveFailed'));
    } finally {
      setExporting(false);
    }
  };

  if (logsQuery.isError || metricsQuery.isError) {
    return (
      <ErrorState
        title={t('messaging.loadFailed')}
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
          </div>
          <div className="flex items-center gap-2">
            {logsQuery.total > 0 && (
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
          logStatusConfig={logStatusConfig}
          getRecipientName={getRecipientName}
          getColumnWidth={getColumnWidth}
          setColumnWidth={setColumnWidth}
          onPageChange={setLogsPage}
          onResendLog={handleResendLog}
        />
      </div>

      <MessagingReportsVolumeChart chartData={chartData} />
    </motion.div>
  );
}
