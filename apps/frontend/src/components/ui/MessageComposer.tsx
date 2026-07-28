import { useMemo, useState } from 'react';
import { Mail, MessageCircle, MessageSquare } from 'lucide-react';
import {
  mergeMessageTemplates,
  type MessageTemplate,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { useMessageTemplates } from '@/hooks/useMessaging';
import { useTranslation } from '@/hooks/useTranslation';
import { MessageComposerDispatchControls } from './messageComposer/MessageComposerDispatchControls';
import { MessageComposerFormBody } from './messageComposer/MessageComposerFormBody';
import {
  MessageComposerRecipients,
  type RecipientTab,
} from './messageComposer/MessageComposerRecipients';
import { useMessageComposerDispatch } from './messageComposer/useMessageComposerDispatch';

export interface MessageComposerProps {
  channel: 'sms' | 'whatsapp' | 'email';
  recipients: MessagingRecipient[];
  onClose: () => void;
  templates?: MessageTemplate[];
  initialMessage?: string;
  initialSubject?: string;
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
}

export default function MessageComposer({
  channel,
  recipients,
  onClose,
  templates,
  initialMessage,
  initialSubject,
  onSent,
}: MessageComposerProps): React.JSX.Element {
  const { t } = useTranslation();
  const { templates: fetchedTemplates } = useMessageTemplates();
  const activeTemplates = useMemo(
    () => templates ?? mergeMessageTemplates(fetchedTemplates),
    [fetchedTemplates, templates],
  );
  const channelTemplates = useMemo(
    () => activeTemplates.filter((template) => !template.channel || template.channel === 'all' || template.channel === channel),
    [activeTemplates, channel],
  );
  const [templateId, setTemplateId] = useState(() => channelTemplates[0]?.id || activeTemplates[0]?.id || 'custom');
  const [subject, setSubject] = useState(initialSubject || '');
  const [message, setMessage] = useState(() => initialMessage || channelTemplates[0]?.body || activeTemplates[0]?.body || '');
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);

  const dispatch = useMessageComposerDispatch({
    channel,
    recipients,
    activeTemplates,
    templateId,
    subject,
    message,
    onClose,
    onSent,
  });
  const displayedRecipients = useMemo(() => {
    const list = recipientTab === 'eligible'
      ? dispatch.eligibleRecipients
      : recipientTab === 'skipped'
        ? dispatch.skippedRecipients
        : dispatch.validatedRecipients;
    const query = recipientSearch.trim().toLowerCase();
    return query
      ? list.filter((recipient) => recipient.name.toLowerCase().includes(query)
        || recipient.phone?.includes(query)
        || recipient.email?.toLowerCase().includes(query))
      : list;
  }, [dispatch.eligibleRecipients, dispatch.skippedRecipients, dispatch.validatedRecipients, recipientSearch, recipientTab]);

  const isEmail = channel === 'email';
  const isSms = channel === 'sms';
  const isBulk = recipients.length > 1;
  const Icon = isEmail ? Mail : isSms ? MessageSquare : MessageCircle;
  const title = isBulk
    ? isEmail
      ? t('messaging.bulkEmailTitle')
      : isSms
        ? t('contacts.bulkSmsMessage')
        : t('contacts.whatsapp.bulkTitle')
    : isEmail
      ? `${t('messaging.sendEmail')} – ${recipients[0]?.name}`
      : isSms
        ? `${t('contacts.sms')} – ${recipients[0]?.name}`
        : t('contacts.whatsapp.singleTitle', { name: recipients[0]?.name ?? '' });
  const subtitle = isBulk
    ? isEmail
      ? `${dispatch.eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('messaging.selectRecipientsDesc')}`
      : isSms
        ? `${dispatch.eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('contacts.contactsHavePhone')}`
        : `${dispatch.eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('contacts.whatsapp.contactsHaveWhatsapp')}`
    : undefined;
  const note = isEmail ? t('messaging.bulkEmailDesc') : isSms ? t('contacts.smsManualSendNote') : t('contacts.whatsapp.bulkManualNote');
  const saveLabel = dispatch.pendingAudit
    ? t('messaging.retrySaveHistory')
    : dispatch.opening
      ? isEmail ? t('messaging.openingMail') : t('contacts.whatsapp.openingTabs')
      : isEmail
        ? isBulk ? t('messaging.openAllMail', { count: String(dispatch.eligibleRecipients.length) }) : t('messaging.openMailDraft')
        : isSms
          ? t('contacts.openSmsApp')
          : isBulk ? `${t('contacts.whatsapp.openAll')} (${dispatch.eligibleRecipients.length})` : t('contacts.whatsapp.open');

  const changeTemplate = (nextTemplateId: string): void => {
    setTemplateId(nextTemplateId);
    const selected = activeTemplates.find((template) => template.id === nextTemplateId);
    if (selected && selected.id !== 'custom') setMessage(selected.body);
  };

  return (
    <FormModal
      open
      priority
      onClose={dispatch.requestClose}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      cancelLabel={t('common.cancel')}
      saveLabel={saveLabel}
      saving={dispatch.opening || dispatch.saving}
      onSave={() => {
        void dispatch.sendAll();
      }}
      saveDisabled={
        dispatch.pendingAudit
          ? dispatch.saving
          : dispatch.opening
            || dispatch.saving
            || !dispatch.eligibleRecipients.length
            || !message.trim()
            || (isEmail && !subject.trim())
      }
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
        {dispatch.pendingAudit ? (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning" role="status">
            {t('messaging.pendingAuditHint')}
          </p>
        ) : null}
        <MessageComposerDispatchControls
          skippedCount={dispatch.skippedRecipients.length}
          isEmail={isEmail}
          isBulk={isBulk}
          opening={dispatch.opening}
          dispatchSpeed={dispatch.dispatchSpeed}
          dispatchProgress={dispatch.dispatchProgress}
          isPaused={dispatch.isPaused}
          onShowSkipped={() => setRecipientTab('skipped')}
          onDispatchSpeedChange={dispatch.setDispatchSpeed}
          onPausedChange={dispatch.setIsPaused}
          onCancel={dispatch.cancelDispatch}
        />
        <MessageComposerFormBody
          channel={channel}
          activeTemplates={activeTemplates}
          templateId={templateId}
          subject={subject}
          message={message}
          eligibleRecipients={dispatch.eligibleRecipients}
          previewIndex={previewIndex}
          personalizeOptions={dispatch.personalizeOptions}
          onTemplateChange={changeTemplate}
          onSubjectChange={setSubject}
          onMessageChange={setMessage}
          onPreviewIndexChange={setPreviewIndex}
        />
        {isBulk && recipients.length > 0 && (
          <MessageComposerRecipients
            isEmail={isEmail}
            isSms={isSms}
            recipientsCount={recipients.length}
            recipientTab={recipientTab}
            search={recipientSearch}
            displayedRecipients={displayedRecipients}
            validatedRecipients={dispatch.validatedRecipients}
            eligibleRecipients={dispatch.eligibleRecipients}
            skippedRecipients={dispatch.skippedRecipients}
            previewIndex={previewIndex}
            message={message}
            onRecipientTabChange={setRecipientTab}
            onSearchChange={setRecipientSearch}
            onPreviewIndexChange={setPreviewIndex}
            onSendOne={dispatch.executeSend}
          />
        )}
        {isBulk && dispatch.eligibleRecipients.length === 0 && (
          <p className="text-xs font-medium text-destructive">
            {isEmail
              ? t('messaging.selectRecipientsDesc')
              : isSms
                ? t('contacts.smsNoEligibleContacts')
                : t('contacts.whatsapp.skippedNote')}
          </p>
        )}
      </div>
    </FormModal>
  );
}
