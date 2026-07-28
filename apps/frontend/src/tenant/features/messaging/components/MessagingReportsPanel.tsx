import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';
import {
  formatDateTime,
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  toMessagingRecipient,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExportToolbar } from '@/components/ui/ExportToolbar';
import { FormSelect } from '@/components/ui/FormSelect';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { useContactsByIds } from '@/tenant/hooks/collections/contacts';
import { useMessageLogs, useMessagingMetrics } from '../hooks/useMessaging';
import { useMessagingHistoryColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';

const CHART_COLORS = ['var(--color-info)', 'var(--color-success)', 'var(--color-warning)'];

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
  const [channel, setChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'skipped'>('all');
  const logsQuery = useMessageLogs({ channel, category, search, status });
  const metricsQuery = useMessagingMetrics();
  const contactIds = useMemo(() => logsQuery.logs.map((log) => log.contactId), [logsQuery.logs]);
  const { data: contacts = [] } = useContactsByIds(contactIds);
  const contactMap = useMemo(() => new Map(contacts.flatMap((contact) => [[contact.id, contact], [String(contact.id), contact]])), [contacts]);
  const { getColumnWidth, setColumnWidth } = useMessagingHistoryColumnLayout();

  const getRecipientName = useCallback((contactId: string | number): string => {
    const contact = contactMap.get(contactId) ?? contactMap.get(String(contactId));
    return contact ? getDisplayName(contact) : t('messaging.contactFallback', { id: contactId });
  }, [contactMap, t]);

  const filteredLogs = useMemo(() => logsQuery.logs.filter((log) => {
    const query = search.toLowerCase();
    return (channel === 'all' || log.channel === channel)
      && (category === 'all' || (log.category || 'general') === category)
      && (log.body.toLowerCase().includes(query) || getRecipientName(log.contactId).toLowerCase().includes(query));
  }), [category, channel, getRecipientName, logsQuery.logs, search]);

  const stats = metricsQuery.data ?? {
    total: logsQuery.logs.length,
    smsCount: logsQuery.logs.filter((log) => log.channel === 'sms').length,
    whatsappCount: logsQuery.logs.filter((log) => log.channel === 'whatsapp').length,
    emailCount: logsQuery.logs.filter((log) => log.channel === 'email').length,
  };
  const chartData = [
    { name: t('messaging.channel.sms'), value: stats.smsCount },
    { name: t('messaging.channel.whatsapp'), value: stats.whatsappCount },
    { name: t('messaging.channel.email'), value: stats.emailCount },
  ].filter((item) => item.value > 0);

  if (logsQuery.isError || metricsQuery.isError) {
    return <ErrorState title={t('messaging.loadFailed')} onRetry={() => void Promise.all([logsQuery.refetch(), metricsQuery.refetch()])} />;
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
            {filteredLogs.length > 0 && (
              <ExportToolbar
                variant="compact"
                title={t('messaging.tabs.logs')}
                columns={[
                  { header: t('messaging.recipient'), key: 'recipient' },
                  { header: t('messaging.channel'), key: 'channel' },
                  { header: t('messaging.category'), key: 'category' },
                  { header: t('messaging.messageBody'), key: 'body' },
                  { header: t('messaging.dateSent'), key: 'sentAt' },
                ]}
                rows={filteredLogs.map((log) => ({ recipient: getRecipientName(log.contactId), channel: log.channel, category: log.category || 'general', body: log.body, sentAt: formatDateTime(log.sentAt) }))}
                filename={t('messaging.exportFilename')}
              />
            )}
            {logsQuery.logs.length > 0 && canClearLogs && (
              <Button variant="outline" size="sm" onClick={onClearLogsRequest} className="font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="me-1.5 h-4 w-4" /> {t('messaging.clearLogs')}
              </Button>
            )}
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border/50">
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
                {filteredLogs.map((log) => {
                  const name = getRecipientName(log.contactId);
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-muted/10">
                      <td className="flex items-center gap-2 px-4 py-3 font-semibold text-foreground"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">{getInitials(name)}</span>{name}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><ChannelBadge channel={log.channel} /><StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} /></div></td>
                      <td className="max-w-xs truncate px-4 py-3 text-muted-foreground" title={log.body}>{log.body}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</td>
                      <td className="px-4 py-3 text-center">{canWrite && <Button variant="ghost" size="sm" onClick={() => {
                        const contact = contactMap.get(log.contactId) ?? contactMap.get(String(log.contactId));
                        onResend(log, contact
                          ? toMessagingRecipient(contact, { getDisplayName, getPrimaryPhone, getPrimaryEmail })
                          : { id: log.contactId, name, phone: '', email: '' });
                      }} className="h-7 text-xs font-semibold text-primary hover:bg-primary/10"><RotateCcw className="me-1 h-3.5 w-3.5" />{t('messaging.resend')}</Button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Clock className="mb-2 h-8 w-8 opacity-40" /><p className="text-sm font-medium">{t('messaging.noLogs')}</p></div>
        )}
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="space-y-1"><h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><BarChart2 className="h-4 w-4 text-primary" />{t('messaging.volumeBreakdown')}</h4><p className="text-xs text-muted-foreground">{t('messaging.volumeBreakdownDesc')}</p></div>
        {chartData.length > 0 ? (
          <div className="flex h-[240px] w-full items-center justify-center"><SafeResponsiveContainer height={240}><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{chartData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></SafeResponsiveContainer></div>
        ) : (
          <div className="flex h-[240px] flex-col items-center justify-center text-muted-foreground"><BarChart2 className="mb-2 h-8 w-8 opacity-45" /><p className="text-xs font-semibold">{t('messaging.noDispatches')}</p></div>
        )}
      </div>
    </motion.div>
  );
}
