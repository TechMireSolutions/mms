import {
  buildCsvContent,
  formatDateTime,
  getDisplayName,
  type Message,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { triggerFileDownload } from '@/lib/download';
import { notify } from '@/lib/notify';
import type { MessageLogsPageResult } from '@/hooks/useMessaging';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

const EXPORT_PAGE_SIZE = 500;
const EXPORT_MAX_PAGES = 40;

interface ExportMessagingLogsOptions {
  channel: 'all' | 'sms' | 'whatsapp' | 'email';
  category: string;
  debouncedSearch: string;
  status: 'all' | 'sent' | 'delivered' | 'failed' | 'skipped';
  t: TranslationFunction;
}

export async function exportMessagingLogsFiltered({
  channel,
  category,
  debouncedSearch,
  status,
  t,
}: ExportMessagingLogsOptions): Promise<void> {
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
    const name = contact
      ? getDisplayName(contact as Parameters<typeof getDisplayName>[0])
      : t('messaging.contactFallback', { id: log.contactId });
    return [name, log.channel, log.category || 'general', log.body, formatDateTime(log.sentAt)];
  });
  const csv = buildCsvContent([headers, ...rows]);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, `${t('messaging.exportFilename')}.csv`);
  if (exportTruncated) notify.warning(t('messaging.exportTruncated'));
}
