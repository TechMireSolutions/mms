import React, { useState } from 'react';
import { AlertCircle, Check, Copy, Filter, RotateCcw } from 'lucide-react';
import {
  calculateSmsSegments,
  formatDateTime,
  getMessageCategoryLabelKey,
  type Message,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardFooter } from '@/components/ui/DirectoryCardFooter';
import { DirectoryCardMetaGrid } from '@/components/ui/DirectoryCardMetaGrid';
import { DirectoryCardMetaTile } from '@/components/ui/DirectoryCardMetaTile';
import { DirectoryCardViewButton } from '@/components/ui/DirectoryCardViewButton';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { notify } from '@/lib/notify';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { SEMANTIC_TEXT } from '@/lib/semanticTone';
import { type MessagingSelectedLogsMap } from './MessagingWorkTier';

export interface MessagingListCardsProps {
  logs: Message[];
  selectedIds: MessagingSelectedLogsMap;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  selectedCount: number;
  selectedCountLabel: React.ReactNode;
  pageCountLabel: React.ReactNode;
  canWrite: boolean;
  logStatusConfig: Record<string, StatusBadgeConfigItem>;
  getRecipientName: (contactId: string | number) => string;
  isColumnVisible: (key: string) => boolean;
  onToggleLog: (log: Message, shiftKey?: boolean) => void;
  onToggleAllVisible: (checked: boolean) => void;
  onResendLog: (log: Message) => void;
  onViewLog?: (log: Message) => void;
  onFilterContact?: (name: string) => void;
}

export const MessagingListCards = (function MessagingListCards({
  logs,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  selectedCount: _selectedCount,
  selectedCountLabel,
  pageCountLabel,
  canWrite,
  logStatusConfig,
  getRecipientName,
  isColumnVisible,
  onToggleLog,
  onToggleAllVisible,
  onResendLog,
  onViewLog,
  onFilterContact,
}: MessagingListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

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

  const getChannelAccentBarClass = (isSelected: boolean, channel: string): string => {
    if (isSelected) return "bg-primary/70 group-hover:bg-primary";
    if (channel === 'whatsapp') return "bg-success/50 group-hover:bg-success";
    if (channel === 'sms') return "bg-info/50 group-hover:bg-info";
    if (channel === 'email') return "bg-warning/50 group-hover:bg-warning";
    return "bg-muted-foreground/35 group-hover:bg-muted-foreground/60";
  };

  // Convert map to array for ModuleDirectoryCards
  const selectedIdsArray = Object.keys(selectedIds).filter((k) => selectedIds[k]);

  return (
    <div className="space-y-3">
      <ModuleDirectoryCards
        items={logs}
        selectedIds={selectedIdsArray}
        onSelectAll={() => onToggleAllVisible(!allVisibleSelected)}
        allSelected={allVisibleSelected}
        someSelected={someVisibleSelected}
        selectAllLabel={t('messaging.selectAllVisible')}
        deselectAllLabel={t('common.deselect')}
        selectedCountLabel={selectedCountLabel as string}
        pageCountLabel={pageCountLabel as string}
        checkboxIdPrefix="messaging-cards"
        renderItem={(log) => {
          const isSelected = Boolean(selectedIds[String(log.id)]);
          const name = getRecipientName(log.contactId);
          const isFailed = log.status === 'failed';
          const isCopied = copiedLogId === String(log.id);
          const isSms = log.channel === 'sms';
          const smsSegments = isSms ? calculateSmsSegments(log.body) : null;
          const categoryKey = log.category ? getMessageCategoryLabelKey(log.category) : null;

          return (
            <DirectoryEntityCard
              key={log.id}
              isSelected={isSelected}
              reducedMotion={reducedMotion}
              accentClassName={getChannelAccentBarClass(isSelected, log.channel)}
              className={cn(
                'transition-all group',
                isFailed && `border-destructive/30 ${SEMANTIC_TEXT.destructive}`,
              )}
            >
              <DirectoryCardHeader
                id={log.id}
                displayName={name}
                isSelected={isSelected}
                reducedMotion={reducedMotion}
                onSelect={() => onToggleLog(log)}
                selectAriaLabel={t('messaging.selectRecipient', { name })}
                onView={onViewLog ? () => onViewLog(log) : undefined}
                viewAriaLabel={`${t('contacts.table.viewProfile')} - ${name}`}
                subtitle={
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {isColumnVisible('dateSent') && (
                      <p className="text-xs font-mono text-muted-foreground">{formatDateTime(log.sentAt)}</p>
                    )}
                    {categoryKey && (
                      <span className="text-2xs px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded-md font-medium">
                        {t(categoryKey)}
                      </span>
                    )}
                  </div>
                }
              />

              <DirectoryCardMetaGrid>
                {isColumnVisible('channel') && (
                  <DirectoryCardMetaTile label={t('messaging.channel')}>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <ChannelBadge channel={log.channel} />
                      {smsSegments && (
                        <span className="text-2xs font-mono text-muted-foreground bg-muted/60 px-1 py-0.5 rounded-md">
                          {smsSegments.totalSegments} {smsSegments.totalSegments === 1 ? 'seg' : 'segs'}
                        </span>
                      )}
                      <StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} />
                      {isFailed && (
                        <AlertCircle className={`h-3.5 w-3.5 ${SEMANTIC_TEXT.destructive} shrink-0`} aria-hidden="true" />
                      )}
                    </div>
                  </DirectoryCardMetaTile>
                )}
                
                {isColumnVisible('body') && (
                  <DirectoryCardMetaTile label={t('messaging.messageBody')} className="sm:col-span-2">
                    <div className="flex items-start justify-between gap-2 mt-0.5">
                      <div className="min-w-0 flex-1">
                        {log.channel === 'email' && log.subject && (
                          <p className="font-semibold text-foreground mb-1 truncate">
                            {log.subject}
                          </p>
                        )}
                        <p className="line-clamp-2 leading-relaxed whitespace-pre-wrap">{log.body}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => void handleCopyBody(e, log)}
                        className={`h-6 w-6 min-h-6 min-w-6 shrink-0 text-muted-foreground hover:${SEMANTIC_TEXT.primary}`}
                        title={t('contacts.table.copy')}
                      >
                        {isCopied ? <Check className={`h-3 w-3 ${SEMANTIC_TEXT.success}`} /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </DirectoryCardMetaTile>
                )}
              </DirectoryCardMetaGrid>

              {isFailed && (
                <div className={`flex items-center gap-1.5 text-3xs font-medium ${SEMANTIC_TEXT.destructive}`}>
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t('messaging.loadFailedHint')}</span>
                </div>
              )}

              <DirectoryCardFooter
                trailing={
                  <>
                    {onFilterContact && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterContact(name);
                        }}
                        className={`h-7 px-2 text-xs text-muted-foreground hover:${SEMANTIC_TEXT.primary}`}
                      >
                        <Filter className="me-1 h-3 w-3" />
                        <span>{t('common.filters')}</span>
                      </Button>
                    )}
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResendLog(log);
                        }}
                        className={`h-7 px-2.5 text-xs font-semibold ${SEMANTIC_TEXT.primary} hover:bg-primary/10`}
                      >
                        <RotateCcw className="me-1 h-3 w-3" />
                        {t('messaging.resend')}
                      </Button>
                    )}
                    {onViewLog && (
                      <DirectoryCardViewButton
                        label={t('contacts.actionViewShort')}
                        ariaLabel={`${t('contacts.table.viewProfile')} - ${name}`}
                        onClick={() => onViewLog(log)}
                      />
                    )}
                  </>
                }
              />
            </DirectoryEntityCard>
          );
        }}
      />
    </div>
  );
});

