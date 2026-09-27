import { AlertCircle } from 'lucide-react';
import {
  calculateSmsSegments,
  getMessageCategoryLabelKey,
  type MessageTemplate,
} from '@mms/shared';
import { FormSelect } from '@/components/ui/FormSelect';
import { Field } from '@/components/ui/FormPrimitives';
import { Input } from '@/components/ui/input';
import { MessagingMessageBodyField } from '@/components/ui/MessagingMessageBodyField';
import { useTranslation } from '@/hooks/useTranslation';
import type { ValidatedMessagingRecipient } from './useMessageComposerDispatch';
import { MessageComposerLivePreview } from './MessageComposerLivePreview';

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
  const smsStats = calculateSmsSegments(message);

  return (
    <div className="space-y-3">
      {isEmail && (
        <Field id="emailSubject" label={t('messaging.subject')} required>
          <Input
            id="emailSubject"
            name="emailSubject"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder={t('messaging.subjectPlaceholder')}
            required
          />
        </Field>
      )}

      {channelTemplates.length > 0 && (
        <Field id="messageTemplate" label={t('messaging.messageTemplate')}>
          <FormSelect
            id="messageTemplate"
            name="messageTemplate"
            value={templateId}
            onChange={onTemplateChange}
            options={channelTemplates.map((template) => ({
              value: template.id,
              label: `${template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label} [${t(getMessageCategoryLabelKey(template.category || 'general'))}]`,
            }))}
          />
        </Field>
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

      <MessageComposerLivePreview
        channel={channel}
        message={message}
        subject={subject}
        eligibleRecipients={eligibleRecipients}
        previewIndex={previewIndex}
        personalizeOptions={personalizeOptions}
        onPreviewIndexChange={onPreviewIndexChange}
      />
    </div>
  );
}
