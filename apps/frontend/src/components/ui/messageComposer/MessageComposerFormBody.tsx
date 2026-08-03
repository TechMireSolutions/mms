import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCheck, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  calculateSmsSegments,
  formatDateTime,
  getMessageCategoryLabelKey,
  personalizeMessage,
  type MessageTemplate,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { MessagingMessageBodyField } from '@/components/ui/MessagingMessageBodyField';
import { useTranslation } from '@/hooks/useTranslation';
import type { ValidatedMessagingRecipient } from './useMessageComposerDispatch';

interface MessageComposerFormBodyProps {
  channel: 'sms' | 'whatsapp' | 'email';
  channelTemplates: MessageTemplate[];
  templateId: string;
  subject: string;
  message: string;
  eligibleRecipients: ValidatedMessagingRecipient[];
  previewIndex: number;
  personalizeOptions: { madrasaName?: string };
  onTemplateChange: (templateId: string) => void;
  onSubjectChange: (subject: string) => void;
  onMessageChange: (message: string) => void;
  onPreviewIndexChange: (index: number) => void;
}

export function MessageComposerFormBody({
  channel,
  channelTemplates,
  templateId,
  subject,
  message,
  eligibleRecipients,
  previewIndex,
  personalizeOptions,
  onTemplateChange,
  onSubjectChange,
  onMessageChange,
  onPreviewIndexChange,
}: MessageComposerFormBodyProps): React.JSX.Element {
  const { t } = useTranslation();
  const isEmail = channel === 'email';
  const isSms = channel === 'sms';
  const isBulk = eligibleRecipients.length > 1;
  const smsStats = calculateSmsSegments(message);
  const recipient = eligibleRecipients[previewIndex] || eligibleRecipients[0];
  const previewText = message.trim() && recipient ? personalizeMessage(message, recipient, personalizeOptions) : '';

  return (
    <div className="space-y-3">
      {isEmail && (
        <div>
          <label className={FORM_LABEL} htmlFor="emailSubject">{t('messaging.subject')}</label>
          <Input
            id="emailSubject"
            name="emailSubject"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder={t('messaging.subjectPlaceholder')}
            required
          />
        </div>
      )}

      {channelTemplates.length > 0 && (
        <div>
          <label className={FORM_LABEL} htmlFor="messageTemplate">{t('messaging.messageTemplate')}</label>
          <FormSelect
            id="messageTemplate"
            value={templateId}
            onChange={onTemplateChange}
            options={channelTemplates.map((template) => ({
              value: template.id,
              label: `${template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label} [${t(getMessageCategoryLabelKey(template.category || 'general'))}]`,
            }))}
          />
        </div>
      )}

      <MessagingMessageBodyField
        id="messageBody"
        value={message}
        onChange={onMessageChange}
        placeholder={t('messaging.templateBodyPlaceholder')}
        required
        footer={(
          <>
            <div className="mt-1 flex flex-wrap items-center justify-end gap-2 font-mono text-xs text-muted-foreground">
              {isSms && (
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                    smsStats.isUnicode
                      ? 'border border-warning/30 bg-warning/15 text-warning'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {smsStats.isUnicode ? t('messaging.encodingUnicode') : t('messaging.encodingGsm')}
                  {' • '}
                  {t('messaging.smsSegmentStats', {
                    segments: smsStats.totalSegments,
                    remaining: smsStats.remainingInSegment,
                  })}
                </span>
              )}
              <span className="shrink-0">{message.length} {t('messaging.chars')}</span>
            </div>
            {isSms && smsStats.isUnicode && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warning">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {t('messaging.unicodeWarning')}
              </p>
            )}
          </>
        )}
      />

      <AnimatePresence mode="wait">
        {previewText && recipient && (
          <motion.div
            key={`${previewIndex}-${channel}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-border/80 bg-muted/20 p-3.5 backdrop-blur-xs"
          >
            <h5 className="mb-2.5 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary" />
                <span className="min-w-0 truncate">{t('messaging.livePreview', { name: recipient.name })}</span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {isBulk && (
                  <div className="flex items-center gap-1 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11"
                      disabled={previewIndex <= 0}
                      onClick={() => onPreviewIndexChange(Math.max(0, previewIndex - 1))}
                      aria-label={t('common.previous')}
                    >
                      <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
                    </Button>
                    <span className="font-mono">{previewIndex + 1}/{eligibleRecipients.length}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11"
                      disabled={previewIndex >= eligibleRecipients.length - 1}
                      onClick={() => onPreviewIndexChange(Math.min(eligibleRecipients.length - 1, previewIndex + 1))}
                      aria-label={t('common.next')}
                    >
                      <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                    </Button>
                  </div>
                )}
                <ChannelBadge channel={channel} className="text-xs" />
              </div>
            </h5>
            {isEmail ? (
              <div className="space-y-2 rounded-xl border border-border bg-card p-3 text-xs shadow-xs">
                <div className="border-b border-border/50 pb-2 text-xs text-muted-foreground">
                  <div>
                    <span className="me-1 font-semibold text-foreground">{t('messaging.to')}:</span>
                    {recipient.name} &lt;{recipient.email}&gt;
                  </div>
                  <div className="mt-0.5">
                    <span className="me-1 font-semibold text-foreground">{t('messaging.subjectLabel')}:</span>
                    {personalizeMessage(subject || t('messaging.defaultSubject'), recipient, personalizeOptions)}
                  </div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-foreground">{previewText}</div>
              </div>
            ) : isSms ? (
              <div className="max-w-[88%] space-y-1 rounded-2xl rounded-tl-none border border-info/20 bg-info/10 p-3 text-xs text-foreground shadow-xs">
                <div className="whitespace-pre-wrap leading-relaxed">{previewText}</div>
                <div className="flex items-center justify-between border-t border-info/10 pt-1 font-mono text-xs opacity-70">
                  <span>{recipient.phone}</span>
                  <span>{t('messaging.smsSegmentBadge', { count: String(smsStats.totalSegments) })}</span>
                </div>
              </div>
            ) : (
              <div className="max-w-[88%] space-y-1.5 rounded-2xl rounded-tl-none border border-success/20 bg-success/10 p-3 text-xs text-foreground shadow-xs">
                <div className="flex items-center justify-between border-b border-success/15 pb-1 text-xs font-semibold text-success">
                  <span>{t('messaging.whatsappBroadcast')}</span>
                  <span>{recipient.phone}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{previewText}</div>
                <div className="flex items-center justify-end gap-1 font-mono text-xs text-success">
                  <span>{formatDateTime(new Date())}</span>
                  <CheckCheck className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
