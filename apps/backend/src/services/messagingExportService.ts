import {
  buildCsvContent,
  formatDateTime,
  type Message,
  type MessagingCsvExportQueryDto,
} from '@mms/shared';
import { loadFilteredMessageLogs, resolveMessagingRecipients } from './messagingService.js';

const EXPORT_PAGE_SIZE = 500;
const RESOLVE_CHUNK_SIZE = 100;

const CSV_HEADERS = ['Recipient', 'Channel', 'Category', 'Message', 'Date Sent'] as const;

export interface MessagingCsvExportOptions {
  filename?: string;
  onProgress?: (current: number, total: number) => void | Promise<void>;
}

export interface MessagingCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

function normalizeFilename(filename?: string): string {
  const trimmed = filename?.trim() || 'message_history.csv';
  return trimmed.toLowerCase().endsWith('.csv') ? trimmed : `${trimmed}.csv`;
}

function normalizeFilters(query: MessagingCsvExportQueryDto = {}): MessagingCsvExportQueryDto {
  const channel = query.channel && query.channel !== 'all' ? query.channel : undefined;
  const category = query.category && query.category !== 'all' ? query.category : undefined;
  const status = query.status && query.status !== 'all' ? query.status : undefined;
  const search = query.search?.trim() || undefined;
  const startDate = query.startDate?.trim() || undefined;
  const endDate = query.endDate?.trim() || undefined;
  return { channel, category, status, search, startDate, endDate };
}
/**
 * Pages active message logs, resolves recipient names, and builds a CSV artifact.
 * Soft-archived logs are never included (`includeDeleted` is never set).
 */
export async function buildMessagingCsvExport(
  workspaceSubdomain: string,
  query: MessagingCsvExportQueryDto = {},
  options: MessagingCsvExportOptions = {},
): Promise<MessagingCsvExportResult> {
  const filters = normalizeFilters(query);
  const filename = normalizeFilename(options.filename);
  const logs: Message[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await loadFilteredMessageLogs(workspaceSubdomain, {
      ...filters,
      page,
      pageSize: EXPORT_PAGE_SIZE,
      // Never export soft-archived logs.
      includeDeleted: false,
    });
    logs.push(...result.logs);
    await options.onProgress?.(logs.length, Math.max(result.total, 1));
    hasMore = result.hasMore;
    page += 1;
  }

  const uniqueIds = [...new Set(logs.map((log) => String(log.contactId)))];
  const nameById = new Map<string, string>();

  for (let index = 0; index < uniqueIds.length; index += RESOLVE_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(index, index + RESOLVE_CHUNK_SIZE);
    const recipients = await resolveMessagingRecipients(workspaceSubdomain, chunk);
    for (const recipient of recipients) {
      nameById.set(String(recipient.id), recipient.name);
    }
  }

  const rows: string[][] = [
    [...CSV_HEADERS],
    ...logs.map((log) => {
      const contactKey = String(log.contactId);
      const name = nameById.get(contactKey) || `Contact #${contactKey}`;
      return [
        name,
        log.channel,
        log.category || 'general',
        log.body,
        formatDateTime(log.sentAt),
      ];
    }),
  ];

  return {
    csv: buildCsvContent(rows),
    filename,
    count: logs.length,
  };
}
