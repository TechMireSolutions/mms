import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Clock, Download, RotateCcw, Trash2 } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';
import {
  buildCsvContent,
  formatDateTime,
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  MESSAGE_LOGS_DEFAULT_PAGE_SIZE,
  toMessagingRecipient,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormSelect } from '@/components/ui/FormSelect';
import { ListPagination } from '@/components/ui/ListPagination';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { apiJson } from '@/lib/apiClient';
import { triggerFileDownload } from '@/lib/download';
import { notify } from '@/lib/notify';
import { type MessageLogsPageResult, useMessageLogs, useMessagingMetrics } from '@/hooks/useMessaging';
import { useMessagingContactsByIds } from '../hooks/useMessagingContactsByIds';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';

const CHART_COLORS = ['var(--color-info)', 'var(--color-success)', 'var(--color-warning)'];
const EXPORT_PAGE_SIZE = 500;
const EXPORT_MAX_PAGES = 40;

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
      const allLogs: Message[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= EXPORT_MAX_PAGES) {
        const queryParams = new URLSearchParams();
        queryParams.set('page', String(page));
        queryParams.set('pageSize', String(EXPORT_PAGE_SIZE));
        if (channel !== 'all') queryParams.set('channel', channel);
        if (category !== 'all') queryParams.set('category', category);
        if (debouncedSearch.trim()) queryParams.set('search', debouncedSearch.trim());
        if (status !== 'all') queryParams.set('status', status);
        const response = await apiJson<MessageLogsPageResult>(`/api/messaging/logs?${queryParams.toString()}`);
        allLogs.push(...(response.logs ?? []));
        hasMore = Boolean(response.hasMore);
        page += 1;
      }
      const exportTruncated = hasMore;

      const uniqueIds = [...new Set(allLogs.map((log) => String(log.contactId)))];
      const resolvedContacts: Array<{ id: string | number; name?: string }> = [];
      for (let index = 0; index < uniqueIds.length; index += 100) {
        const chunk = uniqueIds.slice(index, index + 100);
        const resolved = await apiJson<{ contacts: Array<{ id: string | number; name?: string }> }>(
          '/api/messaging/contacts/resolve',
          { method: 'POST', body: JSON.stringify({ ids: chunk }) },
        );
        resolvedContacts.push(...(resolved.contacts ?? []));
      }
      const exportContactMap = new Map(
        resolvedContacts.flatMap((contact) => [[contact.id, contact], [String(contact.id), contact]]),
      );

      const headers = [
        t('messaging.recipient'),
        t('messaging.channel'),
        t('messaging.category'),
        t('messaging.messageBody'),
        t('messaging.dateSent'),
      ];
      const rows = allLogs.map((log) => {
        const contact = exportContactMap.get(log.contactId) ?? exportContactMap.get(String(log.contactId));
        const name = contact ? getDisplayName(contact as Parameters<typeof getDisplayName>[0]) : t('messaging.contactFallback', { id: log.contactId });
        return [name, log.channel, log.category || 'general', log.body, formatDateTime(log.sentAt)];
      });
      const csv = buildCsvContent([headers, ...rows]);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      triggerFileDownload(blob, `${t('messaging.exportFilename')}.csv`);
      if (exportTruncated) notify.warning(t('messaging.exportTruncated'));
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
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={() => void exportAllFilteredLogs()}
                className="font-semibold"
              >
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

        {logsQuery.logs.length > 0 ? (
          <>
            <div className="rounded-lg border border-border/50">
              <div className="space-y-3 p-3 md:hidden">
                {logsQuery.logs.map((log) => {
                  const name = getRecipientName(log.contactId);
                  return (
                    <article key={log.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                            {getInitials(name)}
                          </span>
                          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <ChannelBadge channel={log.channel} />
                          <StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} />
                        </div>
                      </div>
                      <dl className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t('messaging.messageBody')}</dt>
                          <dd className="text-xs text-muted-foreground">{log.body}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-muted-foreground">{t('messaging.dateSent')}</dt>
                          <dd className="font-mono text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</dd>
                        </div>
                      </dl>
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const contact = contactMap.get(log.contactId) ?? contactMap.get(String(log.contactId));
                            onResend(log, contact
                              ? toMessagingRecipient(contact, { getDisplayName, getPrimaryPhone, getPrimaryEmail })
                              : { id: log.contactId, name, phone: '', email: '' });
                          }}
                          className="w-full text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          <RotateCcw className="me-1 h-3.5 w-3.5" />
                          {t('messaging.resend')}
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full table-fixed text-start text-sm">
                  <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      {(['recipient', 'channel', 'body', 'dateSent'] as const).map((column) => (
                        <ResizableTableHead key={column} columnKey={column} width={getColumnWidth(column)} onResize={setColumnWidth} className="px-4 py-3">
                          {column === 'recipient' ? t('messaging.recipient') : column === 'channel' ? t('messaging.channel') : column === 'body' ? t('messaging.messageBody') : t('messaging.dateSent')}
                        </ResizableTableHead>
                      ))}
                      <th className="px-4 py-3 text-center">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {logsQuery.logs.map((log) => {
                      const name = getRecipientName(log.contactId);
                      return (
                        <tr key={log.id} className="transition-colors hover:bg-muted/10">
                          <td className="flex items-center gap-2 px-4 py-3 font-semibold text-foreground">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                              {getInitials(name)}
                            </span>
                            {name}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <ChannelBadge channel={log.channel} />
                              <StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} />
                            </div>
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-muted-foreground" title={log.body}>{log.body}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</td>
                          <td className="px-4 py-3 text-center">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const contact = contactMap.get(log.contactId) ?? contactMap.get(String(log.contactId));
                                  onResend(log, contact
                                    ? toMessagingRecipient(contact, { getDisplayName, getPrimaryPhone, getPrimaryEmail })
                                    : { id: log.contactId, name, phone: '', email: '' });
                                }}
                                className="text-xs font-semibold text-primary hover:bg-primary/10"
                              >
                                <RotateCcw className="me-1 h-3.5 w-3.5" />
                                {t('messaging.resend')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <ListPagination
              page={logsQuery.page}
              total={logsQuery.total}
              limit={logsQuery.pageSize}
              hasMore={logsQuery.hasMore}
              onPageChange={setLogsPage}
              i18nNamespace="contacts"
              variant="range"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">{t('messaging.noLogs')}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="space-y-1">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <BarChart2 className="h-4 w-4 text-primary" />
            {t('messaging.volumeBreakdown')}
          </h4>
          <p className="text-xs text-muted-foreground">{t('messaging.volumeBreakdownDesc')}</p>
        </div>
        {chartData.length > 0 ? (
          <div className="flex h-[15rem] w-full items-center justify-center">
            <SafeResponsiveContainer height={240}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </SafeResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[15rem] flex-col items-center justify-center text-muted-foreground">
            <BarChart2 className="mb-2 h-8 w-8 opacity-45" />
            <p className="text-xs font-semibold">{t('messaging.noDispatches')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
