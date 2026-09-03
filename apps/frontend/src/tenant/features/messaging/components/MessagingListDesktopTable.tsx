import React, { useState } from 'react';
import type { Message } from '@mms/shared';
import { type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { MessagingListDesktopRow } from './MessagingListDesktopRow';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
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

export const MessagingListDesktopTable = (function MessagingListDesktopTable({
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

  const handleCopyBody = (async (e: React.MouseEvent, log: Message): Promise<void> => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(log.body);
        setCopiedLogId(String(log.id));
        notify.success(t('contacts.table.copied'));
        setTimeout(() => setCopiedLogId(null), 2000);
      } catch {
        notify.error(t('messaging.loadFailedHint'));
      }
    });

  const selectedCount = Object.keys(selectedIds).length;
  const pageCountLabel = formatDirectoryPageCountLabel(logs.length, t, {
    singular: 'messaging.log',
    plural: 'messaging.logs',
  });

  return (
    <div className={cn(WORK_SURFACE, 'shadow-xs overflow-hidden')}>
      <div className="w-full overflow-x-auto">
        <Table>
          <ModuleWorkTableHeader
            columns={[
              showRecipient ? { id: 'recipient', label: t('messaging.recipient') } : null,
              showChannel ? { id: 'channel', label: t('messaging.channel') } : null,
              showBody ? { id: 'body', label: t('messaging.messageBody') } : null,
              showDateSent ? { id: 'dateSent', label: t('messaging.dateSent') } : null,
            ].filter((c): c is { id: string; label: string } => c !== null)}
            getColumnWidth={getColumnWidth}
            setColumnWidth={setColumnWidth}
            selection={{
              allSelected: allVisibleSelected,
              someSelected: someVisibleSelected,
              onSelectAll: () => onToggleAllVisible(!allVisibleSelected),
              ariaLabel: t('messaging.selectAllVisible'),
            }}
            actionsLabel={t('common.actions')}
            stickyColumnId="recipient"
          />
          <TableBody className="divide-y divide-border/50">
            {logs.map((log) => (
              <MessagingListDesktopRow
                key={log.id}
                log={log}
                isSelected={Boolean(selectedIds[String(log.id)])}
                name={getRecipientName(log.contactId)}
                isCopied={copiedLogId === String(log.id)}
                canWrite={canWrite}
                logStatusConfig={logStatusConfig}
                showRecipient={showRecipient}
                showChannel={showChannel}
                showBody={showBody}
                showDateSent={showDateSent}
                onToggleLog={onToggleLog}
                onResendLog={onResendLog}
                onViewLog={onViewLog}
                onFilterContact={onFilterContact}
                onCopyBody={handleCopyBody}
              />
            ))}
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
