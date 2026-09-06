import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  calculateSmsSegments,
  formatDateTime,
  getInitials,
  getMessageCategoryLabelKey,
  type Message,
} from '@mms/shared';
import { type StatusBadgeConfigItem, StatusBadge } from '@/components/ui/StatusBadge';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { Button } from '@/components/ui/button';
import { WorkBatchTable, type WorkBatchTableColumn } from '@/components/common/work';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { SEMANTIC_TEXT, SEMANTIC_BG } from '@/lib/semanticTone';
import { type MessagingSelectedLogsMap } from './MessagingWorkTier';

export interface MessagingListDesktopTableProps {
  logs: Message[];
  selectedIds: MessagingSelectedLogsMap;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  canWrite: boolean;
  logStatusConfig: Record<string, StatusBadgeConfigItem>;
  getRecipientName: (contactId: string | number) => string;
  getColumnWidth: (key: string) => number | undefined;
  isColumnVisible: (key: string) => boolean;
  setColumnWidth: (key: string, width: number) => void;
  onToggleLog: (log: Message, shiftKey?: boolean) => void;
  onToggleAllVisible: (checked: boolean) => void;
  onResendLog: (log: Message) => void;
  onViewLog?: (log: Message) => void;
  onFilterContact?: (name: string) => void;
}

export function MessagingListDesktopTable({
  logs,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  canWrite,
  logStatusConfig,
  getRecipientName,
  getColumnWidth,
  isColumnVisible,
  onToggleLog,
  onToggleAllVisible,
  onResendLog,
  onViewLog,
  onFilterContact,
  setColumnWidth,
}: MessagingListDesktopTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const showRecipient = isColumnVisible('recipient');
  const showChannel = isColumnVisible('channel');
  const showBody = isColumnVisible('body');
  const showDateSent = isColumnVisible('dateSent');

  const handleCopyBody = useCallback(async (e: React.MouseEvent, log: Message): Promise<void> => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(log.body);
      setCopiedLogId(String(log.id));
      notify.success(t('contacts.table.copied'));
      setTimeout(() => setCopiedLogId(null), 2000);
    } catch {
      notify.error(t('messaging.loadFailedHint'));
    }
  }, [t]);

  const selectedCount = Object.keys(selectedIds).length;
  const pageCountLabel = formatDirectoryPageCountLabel(logs.length, t, {
    singular: 'messaging.log',
    plural: 'messaging.logs',
  });

  const columns = useMemo<WorkBatchTableColumn<Message>[]>(() => {
    const cols: WorkBatchTableColumn<Message>[] = [];

    if (showRecipient) {
      cols.push({
        id: 'recipient',
        label: t('messaging.recipient'),
        cellClassName: 'font-semibold text-foreground',
        render: (log) => {
          const name = getRecipientName(log.contactId);
          return (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${SEMANTIC_BG.primary} text-xs font-black ${SEMANTIC_TEXT.primary}`}
                >
                  {getInitials(name)}
                </span>
                <span className={`truncate hover:${SEMANTIC_TEXT.primary} transition-colors`}>
                  {name}
                </span>
              </div>
              {onFilterContact && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterContact(name);
                  }}
                  className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:${SEMANTIC_TEXT.primary}`}
                  title={t('messaging.selectRecipientsDesc')}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        },
      });
    }

    if (showChannel) {
      cols.push({
        id: 'channel',
        label: t('messaging.channel'),
        render: (log) => {
          const isFailed = log.status === 'failed';
          const smsSegments = log.channel === 'sms' ? calculateSmsSegments(log.body) : null;
          const categoryKey = log.category ? getMessageCategoryLabelKey(log.category) : null;
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChannelBadge channel={log.channel} />
              {categoryKey && (
                <span className="text-2xs px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded-md font-medium">
                  {t(categoryKey)}
                </span>
              )}
              {smsSegments && (
                <span className="text-2xs font-mono text-muted-foreground bg-muted/60 px-1 py-0.5 rounded-md">
                  {smsSegments.totalSegments} {smsSegments.totalSegments === 1 ? 'seg' : 'segs'}
                </span>
              )}
              <StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} />
              {isFailed && (
                <AlertCircle
                  className={`h-3.5 w-3.5 ${SEMANTIC_TEXT.destructive} shrink-0`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        },
      });
    }

    if (showBody) {
      cols.push({
        id: 'body',
        label: t('messaging.messageBody'),
        cellClassName: 'max-w-xs truncate text-muted-foreground',
        render: (log) => {
          const isCopied = copiedLogId === String(log.id);
          return (
            <div className="flex items-center justify-between gap-2" title={log.body}>
              <span className="truncate">
                {log.channel === 'email' && log.subject && (
                  <strong className="text-foreground font-semibold me-1.5">
                    {log.subject}:
                  </strong>
                )}
                {log.body}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => void handleCopyBody(e, log)}
                className={`h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:${SEMANTIC_TEXT.primary}`}
                title={t('contacts.table.copy')}
              >
                {isCopied ? (
                  <Check className={`h-3 w-3 ${SEMANTIC_TEXT.success}`} />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          );
        },
      });
    }

    if (showDateSent) {
      cols.push({
        id: 'dateSent',
        label: t('messaging.dateSent'),
        cellClassName: 'font-mono text-xs text-muted-foreground',
        render: (log) => formatDateTime(log.sentAt),
      });
    }

    return cols;
  }, [
    copiedLogId,
    getRecipientName,
    handleCopyBody,
    logStatusConfig,
    onFilterContact,
    showBody,
    showChannel,
    showDateSent,
    showRecipient,
    t,
  ]);

  return (
    <WorkBatchTable<Message>
      data={logs}
      columns={columns}
      caption={t('messaging.logs')}
      className="table-fixed text-xs"
      stickyColumnId="recipient"
      onRowClick={onViewLog}
      rowClassName={(log) =>
        log.status === 'failed'
          ? `${SEMANTIC_BG.destructive} hover:bg-destructive/10 border-s-2 border-s-destructive`
          : undefined
      }
      selection={{
        selectedIds: Object.keys(selectedIds),
        onSelectOne: (id: string) => {
          const found = logs.find((l) => String(l.id) === id);
          if (found) onToggleLog(found);
        },
        onSelectAll: () => onToggleAllVisible(!allVisibleSelected),
        allSelected: allVisibleSelected,
        someSelected: someVisibleSelected,
        selectAllAriaLabel: t('messaging.selectAllVisible'),
        selectRowAriaLabel: (log) =>
          t('messaging.selectRecipient', { name: getRecipientName(log.contactId) }),
      }}
      columnResize={{
        getColumnWidth,
        onColumnResize: setColumnWidth,
      }}
      renderRowActions={
        canWrite
          ? (log) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResendLog(log)}
                className={`text-xs font-semibold ${SEMANTIC_TEXT.primary} hover:bg-primary/10`}
              >
                <RotateCcw className="me-1 h-3.5 w-3.5" />
                {t('messaging.resend')}
              </Button>
            )
          : undefined
      }
      actionsLabel={t('common.actions')}
      footerCount={{
        selectedCountLabel: t('messaging.selectedCount', { count: selectedCount }),
        pageCountLabel,
      }}
    />
  );
}
