import React, { useCallback, useEffect, useState, type JSX } from 'react';
import {
  calculateSmsSegments,
  formatDateTime,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { DetailDrawerShell } from '@/components/ui/DetailDrawerShell';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { SEMANTIC_TEXT, SEMANTIC_BG } from '@/lib/semanticTone';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Copy,
  Mail,
  MessageCircle,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonDetailHeroCard } from '@/components/ui/PersonDetailHeroCard';
import { EntityMessagingQuickActions } from '@/components/ui/EntityMessagingQuickActions';

export interface MessagingDetailDrawerProps {
  log: Message | null;
  recipient?: MessagingRecipient | null;
  logStatusConfig: Record<string, StatusBadgeConfigItem>;
  canWrite: boolean;
  onClose: () => void;
  onResend: (log: Message) => void;
}

export const MessagingDetailDrawer = React.memo(function MessagingDetailDrawer({
  log,
  recipient,
  logStatusConfig,
  canWrite,
  onClose,
  onResend,
}: MessagingDetailDrawerProps): JSX.Element | null {
  const { t } = useTranslation();
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleResend = useCallback((): void => {
    if (!log || !canWrite) return;
    onClose();
    onResend(log);
  }, [log, canWrite, onClose, onResend]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to trigger Resend
  useEffect(() => {
    if (!log || !canWrite) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleResend();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [log, canWrite, handleResend]);

  if (!log) return null;

  const recipientName = recipient?.name || t('messaging.contactFallback', { id: log.contactId });
  const isFailed = log.status === 'failed';
  const isSkipped = log.status === 'skipped';
  const isSms = log.channel === 'sms';
  const isWhatsapp = log.channel === 'whatsapp';
  const isEmail = log.channel === 'email';

  const cleanPhone = recipient?.phone ? recipient.phone.replace(/[^0-9]/g, '') : '';
  const smsStats = isSms ? calculateSmsSegments(log.body) : null;

  const copyToClipboard = async (text: string, isId: boolean = false): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      if (isId) {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
      notify.success(t('contacts.table.copied'));
    } catch {
      notify.error(t('messaging.loadFailedHint'));
    }
  };

  return (
    <DetailDrawerShell
      open={Boolean(log)}
      onClose={onClose}
      title={recipientName}
      subtitle={formatDateTime(log.sentAt)}
      icon={MessageSquare}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span>#{String(log.id).slice(0, 10)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => void copyToClipboard(String(log.id), true)}
              aria-label={t('contacts.table.copied')}
            >
              {copiedId ? <Check className={`h-3 w-3 ${SEMANTIC_TEXT.success}`} /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
            {canWrite && (
              <Button
                variant="default"
                size="sm"
                onClick={handleResend}
                className="gap-1.5"
                title={`${t('messaging.resend')} (⌘+Enter)`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t('messaging.resend')}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Diagnostics & Failure Reason Notice */}
        {(isFailed || isSkipped) && (
          <div className={`p-3 rounded-lg border border-destructive/30 ${SEMANTIC_BG.destructive} ${SEMANTIC_TEXT.destructive} space-y-1`}>
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>{isFailed ? t('messaging.status.failed') : t('messaging.status.skipped')}</span>
            </div>
            <p className={`text-xs ${SEMANTIC_TEXT.destructive} opacity-90`}>
              {isFailed
                ? t('messaging.loadFailedHint')
                : t('messaging.skippedNotice', { count: 1, type: t('messaging.phoneNumber') })}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <PersonDetailHeroCard
            id={log.contactId || ''}
            displayName={recipientName}
            avatar={null}
            accentColor="primary"
          >
            <ChannelBadge channel={log.channel} />
            <StatusBadge status={log.status || 'sent'} size="sm" config={logStatusConfig} />
          </PersonDetailHeroCard>

          <div className="flex items-center justify-between px-1">
            <span className="text-muted-foreground font-mono text-xs">
              {recipient?.phone || recipient?.email || t('messaging.contactFallback', { id: log.contactId })}
            </span>
            {log.contactId && (
              <Link
                to={`/contacts?contactId=${log.contactId}`}
                className={`inline-flex items-center gap-1 ${SEMANTIC_TEXT.primary} hover:underline font-semibold shrink-0 text-xs w-max`}
              >
                <span>{t('contacts.table.viewProfile')}</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <EntityMessagingQuickActions
            primaryPhone={cleanPhone}
            primaryEmail={recipient?.email}
            labels={{
              call: t('contacts.detail.call'),
              whatsapp: t('contacts.whatsapp'),
              sms: t('contacts.sms'),
              email: t('contacts.detail.emailAction'),
            }}
            onWhatsApp={cleanPhone ? () => window.open(`https://wa.me/${cleanPhone}`, '_blank') : undefined}
            onSms={cleanPhone ? () => { window.location.href = `sms:${cleanPhone}`; } : undefined}
            onEmail={recipient?.email ? () => { window.location.href = `mailto:${recipient?.email}?subject=${encodeURIComponent(log.subject || '')}`; } : undefined}
          />
        </div>

        <div className="space-y-2">
          <DetailSectionTitle>{t('messaging.messageBody')}</DetailSectionTitle>
          <Card accentColor="info" className="p-0 overflow-hidden divide-y divide-border/50">
            {log.subject && (
              <DetailAttributeRow 
                variant="inset"
                icon={Mail} 
                label={t('messaging.subjectLabel')} 
                value={log.subject} 
              />
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {smsStats
                    ? t('messaging.smsSegmentStats', {
                      segments: smsStats.totalSegments,
                      remaining: smsStats.remainingInSegment,
                    })
                    : `${log.body.length} chars`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2.5 text-xs gap-1.5 ${SEMANTIC_TEXT.primary} hover:bg-primary/10`}
                  onClick={() => void copyToClipboard(log.body)}
                >
                  {copiedBody ? <Check className={`h-3.5 w-3.5 ${SEMANTIC_TEXT.success}`} /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedBody ? t('contacts.table.copied') : t('contacts.table.copy')}</span>
                </Button>
              </div>
              <div className={`whitespace-pre-wrap rounded bg-background/80 p-3 font-sans text-xs text-foreground border border-border/40 leading-relaxed max-h-60 overflow-y-auto selection:${SEMANTIC_BG.primary}`}>
                {log.body}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-2">
          <DetailSectionTitle>{t('common.details')}</DetailSectionTitle>
          <Card accentColor="secondary" className="p-0 overflow-hidden divide-y divide-border/50">
            <DetailAttributeRow 
              variant="inset"
              icon={MessageCircle} 
              label={t('messaging.channel')} 
              value={<span className="capitalize">{log.channel}</span>} 
            />
            <DetailAttributeRow 
              variant="inset"
              icon={AlertCircle} 
              label={t('messaging.category')} 
              value={<span className="capitalize">{log.category || t('messaging.category.general')}</span>} 
            />
            <DetailAttributeRow 
              variant="inset"
              icon={Check} 
              label={t('common.status')} 
              value={<span className="capitalize">{log.status || 'sent'}</span>} 
            />
            <DetailAttributeRow 
              variant="inset"
              icon={Copy} 
              label={t('messaging.dateSent')} 
              value={<span className="font-mono">{formatDateTime(log.sentAt)}</span>} 
            />
          </Card>
        </div>
      </div>
    </DetailDrawerShell>
  );
});
