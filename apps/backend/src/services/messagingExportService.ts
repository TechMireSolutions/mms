import {
  escapeCsvCell,
  formatDateTime,
  MESSAGING_CSV_EXPORT_MAX_BYTES,
  MESSAGING_CSV_EXPORT_MAX_ROWS,
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

/** Thrown when export would exceed row or byte caps. */
export class MessagingCsvExportLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessagingCsvExportLimitError';
  }
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
 * Fails when row count or CSV bytes would exceed shared caps.
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
    if (page === 1 && result.total > MESSAGING_CSV_EXPORT_MAX_ROWS) {
      throw new MessagingCsvExportLimitError(
        `Export exceeds maximum of ${MESSAGING_CSV_EXPORT_MAX_ROWS} rows (${result.total} matched)`,
      );
    }
    logs.push(...result.logs);
    if (logs.length > MESSAGING_CSV_EXPORT_MAX_ROWS) {
      throw new MessagingCsvExportLimitError(
        `Export exceeds maximum of ${MESSAGING_CSV_EXPORT_MAX_ROWS} rows`,
      );
    }
    await options.onProgress?.(logs.length, Math.max(result.total, 1));
    hasMore = result.hasMore;
    page += 1;
  }

  const uniqueIdSet = new Set<string>();
  for (let i = 0; i < logs.length; i++) {
    uniqueIdSet.add(String(logs[i].contactId));
  }
  const uniqueIds = [...uniqueIdSet];
  const nameById = new Map<string, string>();

  for (let index = 0; index < uniqueIds.length; index += RESOLVE_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(index, index + RESOLVE_CHUNK_SIZE);
    const recipients = await resolveMessagingRecipients(workspaceSubdomain, chunk);
    for (const recipient of recipients) {
      nameById.set(String(recipient.id), recipient.name);
    }
  }

  // Build the CSV incrementally (header + one line per log) instead of
  // materialising a full rows[][] (plus buildCsvContent's internal line array)
  // in memory. Output is byte-identical to the previous buildCsvContent(rows).
  const lines: string[] = new Array(logs.length + 1);
  lines[0] = CSV_HEADERS.map((header) => escapeCsvCell(header)).join(',');
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const contactKey = String(log.contactId);
    const name = nameById.get(contactKey) || `Contact #${contactKey}`;
    lines[i + 1] = [
      name,
      log.channel,
      log.category || 'general',
      log.body,
      formatDateTime(log.sentAt),
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(',');
  }

  const csv = lines.join('\n');
  const byteLength = Buffer.byteLength(csv, 'utf8');
  if (byteLength > MESSAGING_CSV_EXPORT_MAX_BYTES) {
    throw new MessagingCsvExportLimitError(
      `Export exceeds maximum of ${MESSAGING_CSV_EXPORT_MAX_BYTES} bytes (${byteLength} generated)`,
    );
  }

  return {
    csv,
    filename,
    count: logs.length,
  };
}
