import React, { useEffect, type JSX } from 'react';
import { ChevronDown, MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import { BulkSelectionBar } from '@/components/ui/BulkSelectionBar';
import {
  BulkSelectionClearAction,
  BulkSelectionDeleteAction,
  BulkSelectionExportAction,
} from '@/components/ui/BulkSelectionActions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_TEXT } from '@/lib/semanticTone';
import { MESSAGING_CHANNEL_CONFIG } from '../config';

export interface MessagingWorkBulkActionBarProps {
  selectedCount: number;
  canWrite: boolean;
  canClearLogs: boolean;
  onClearSelection: () => void;
  onBulkExport?: () => void;
  onBulkResend?: (targetChannel?: 'whatsapp' | 'sms' | 'email') => void;
  onClearLogsRequest?: () => void;
}

export const MessagingWorkBulkActionBar = (function MessagingWorkBulkActionBar({
  selectedCount,
  canWrite,
  canClearLogs,
  onClearSelection,
  onBulkExport,
  onBulkResend,
  onClearLogsRequest,
}: MessagingWorkBulkActionBarProps): JSX.Element {
  const { t } = useTranslation();

  // Keyboard shortcut: Esc to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClearSelection]);

  return (
    <BulkSelectionBar
      placement="inline"
      tone="glass"
      selectedCount={selectedCount}
      countLabel={t('messaging.selectedCount', { count: selectedCount })}
      leading={<MessageSquare className={`h-4 w-4 ${SEMANTIC_TEXT.primary}`} aria-hidden />}
      trailing={<BulkSelectionClearAction label={`${t('common.deselect')} (Esc)`} onClick={onClearSelection} />}
    >
      {canWrite && onBulkResend && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`min-h-11 gap-1.5 px-3 font-semibold text-xs ${SEMANTIC_TEXT.primary} border-primary/30 hover:bg-primary/10`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden />
              <span>{t('messaging.resend')}</span>
              <ChevronDown className="w-3 h-3 opacity-70" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => onBulkResend()}
              className="cursor-pointer gap-2 py-2 text-xs font-medium"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${SEMANTIC_TEXT.primary}`} />
              <span>{t('messaging.resend')}</span>
            </DropdownMenuItem>
            {Object.values(MESSAGING_CHANNEL_CONFIG).map((config) => {
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={config.id}
                  onClick={() => onBulkResend(config.id as 'whatsapp' | 'sms' | 'email')}
                  className="cursor-pointer gap-2 py-2 text-xs font-medium"
                >
                  <Icon className={`h-3.5 w-3.5 ${SEMANTIC_TEXT[config.themeAccent as keyof typeof SEMANTIC_TEXT]}`} />
                  <span>{t(`messaging.channel.${config.id}` as AppTranslationKey)}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canWrite && onBulkExport && (
        <BulkSelectionExportAction
          label={`${t('messaging.exportLogs')} (${selectedCount})`}
          onClick={onBulkExport}
        />
      )}
      {canClearLogs && onClearLogsRequest && (
        <>
          <div className="h-4 w-px bg-border" />
          <BulkSelectionDeleteAction
            label={t('messaging.clearLogs')}
            onClick={onClearLogsRequest}
            icon={Trash2}
          />
        </>
      )}
    </BulkSelectionBar>
  );
});
