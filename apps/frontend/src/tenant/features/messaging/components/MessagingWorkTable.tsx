import React, { useCallback, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { SEMANTIC_TEXT, SEMANTIC_BG } from '@/lib/semanticTone';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { type MessagingSelectedLogsMap } from './MessagingWorkPanel';

export interface MessagingWorkTableProps {
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

export const MessagingWorkTable = React.memo(function MessagingWorkTable({
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
}: MessagingWorkTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const showRecipient = isColumnVisible('recipient');
  const showChannel = isColumnVisible('channel');
  const showBody = isColumnVisible('body');
  const showDateSent = isColumnVisible('dateSent');

  const handleCopyBody = useCallback(
    async (e: React.MouseEvent, log: Message): Promise<void> => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(log.body);
        setCopiedLogId(String(log.id));
        notify.success(t('contacts.table.copied'));
        setTimeout(() => setCopiedLogId(null), 2000);
      } catch {
        notify.error(t('messaging.loadFailedHint'));
      }
    },
    [t],
  );

  const selectedCount = Object.keys(selectedIds).length;
  const pageCountLabel = formatDirectoryPageCountLabel(logs.length, t, {
    singular: 'messaging.log',
    plural: 'messaging.logs',
  });

  return (
    <div className={cn(WORK_SURFACE, 'shadow-xs overflow-hidden')}>
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-10 px-3 py-2">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => onToggleAllVisible(Boolean(checked))}
                  aria-label={t('messaging.selectAllVisible')}
                />
              </TableHead>
              {showRecipient && (
                <TableHead style={{ width: getColumnWidth('recipient') }} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('messaging.recipient')}
                </TableHead>
              )}
              {showChannel && (
                <TableHead style={{ width: getColumnWidth('channel') }} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('messaging.channel')}
                </TableHead>
              )}
              {showBody && (
                <TableHead style={{ width: getColumnWidth('body') }} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('messaging.messageBody')}
                </TableHead>
              )}
              {showDateSent && (
                <TableHead style={{ width: getColumnWidth('dateSent') }} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('messaging.dateSent')}
                </TableHead>
              )}
              <TableHead className="w-28 px-3 py-2 text-end text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {logs.map((log) => {
              const isSelected = Boolean(selectedIds[String(log.id)]);
              const name = getRecipientName(log.contactId);
              const isFailed = log.status === 'failed';
              const isCopied = copiedLogId === String(log.id);
              const smsSegments = log.channel === 'sms' ? calculateSmsSegments(log.body) : null;
              const categoryKey = log.category ? getMessageCategoryLabelKey(log.category) : null;

              return (
                <TableRow
                  key={log.id}
                  tabIndex={0}
                  className={cn(
                    'transition-colors cursor-pointer group focus-visible:outline-hidden focus-visible:bg-muted/40',
                    isFailed
                      ? `${SEMANTIC_BG.destructive} hover:bg-destructive/10 border-s-2 border-s-destructive`
                      : 'hover:bg-muted/20',
                  )}
                  onClick={() => onViewLog?.(log)}
                >
                  <TableCell
                    className="px-3 py-2.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLog(log, (e.nativeEvent as MouseEvent).shiftKey);
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      aria-label={t('messaging.selectRecipient', { name })}
                    />
                  </TableCell>
                  {showRecipient && (
                    <TableCell className="px-3 py-2.5 font-semibold text-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${SEMANTIC_BG.primary} text-xs font-black ${SEMANTIC_TEXT.primary}`}>
                            {getInitials(name)}
                          </span>
                          <span className={`truncate hover:${SEMANTIC_TEXT.primary} transition-colors`}>{name}</span>
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
                    </TableCell>
                  )}
                  {showChannel && (
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ChannelBadge channel={log.channel} />
                        {categoryKey && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded-md font-medium">
                            {t(categoryKey)}
                          </span>
                        )}
                        {smsSegments && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1 py-0.5 rounded-md">
                            {smsSegments.totalSegments} {smsSegments.totalSegments === 1 ? 'seg' : 'segs'}
                          </span>
                        )}
                        <StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} />
                        {isFailed && (
                          <AlertCircle className={`h-3.5 w-3.5 ${SEMANTIC_TEXT.destructive} shrink-0`} aria-hidden="true" />
                        )}
                      </div>
                    </TableCell>
                  )}
                  {showBody && (
                    <TableCell className="max-w-xs truncate px-3 py-2.5 text-muted-foreground" title={log.body}>
                      <div className="flex items-center justify-between gap-2">
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
                          {isCopied ? <Check className={`h-3 w-3 ${SEMANTIC_TEXT.success}`} /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  {showDateSent && (
                    <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {formatDateTime(log.sentAt)}
                    </TableCell>
                  )}
                  <TableCell className="px-3 py-2.5 text-end" onClick={(e) => e.stopPropagation()}>
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResendLog(log)}
                        className={`text-xs font-semibold ${SEMANTIC_TEXT.primary} hover:bg-primary/10`}
                      >
                        <RotateCcw className="me-1 h-3.5 w-3.5" />
                        {t('messaging.resend')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ModuleTableFooterCount
        selectedCount={selectedCount}
        selectedCountLabel={t('messaging.selectedCount', { count: selectedCount })}
        pageCountLabel={pageCountLabel}
      />
    </div>
  );
});
