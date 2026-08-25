import { useCallback, useMemo, useState } from 'react';
import { Mail, MessageCircle, MessageSquare } from 'lucide-react';
import {
  mergeMessageTemplates,
  type MessageTemplate,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { WarningCallout } from '@/components/ui/WarningCallout';
import { useMessageTemplates } from '@/hooks/useMessaging';
import { notify } from '@/lib/notify';
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
    () => activeTemplates.filter(
      (tpl) => !tpl.channel || tpl.channel === 'all' || tpl.channel === channel,
    ),
    [activeTemplates, channel],
  );

  const [templateId, setTemplateId] = useState(
    () => channelTemplates[0]?.id || activeTemplates[0]?.id || 'custom',
  );
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [message, setMessage] = useState(
    () => initialMessage || channelTemplates[0]?.body || activeTemplates[0]?.body || '',
  );
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [localRecipients, setLocalRecipients] = useState<MessagingRecipient[]>(recipients);
  const [step, setStep] = useState<'pick' | 'compose'>(recipients.length > 0 ? 'compose' : 'pick');

  // Fix #1: read current state before setter — no mutation inside the updater closure
  const addRecipient = useCallback((candidate: MessagingRecipient): void => {
    const isDuplicate = localRecipients.some((r) => String(r.id) === String(candidate.id));
    if (!isDuplicate) {
      setLocalRecipients((prev) => [...prev, candidate]);
      notify.success(t('messaging.recipientAdded'));
    } else {
      notify.warning(t('messaging.recipientAlreadyAdded'));
    }
  }, [localRecipients, t]);

  const removeRecipient = useCallback((id: string | number): void => {
    setLocalRecipients((prev) => prev.filter((r) => String(r.id) !== String(id)));
    notify.success(t('messaging.recipientRemoved'));
  }, [t]);

  const dispatch = useMessageComposerDispatch({
    channel,
    recipients: localRecipients,
    activeTemplates,
    templateId,
    subject,
    message,
    onClose,
    onSent,
  });

  const displayedRecipients = useMemo(() => {
    const list =
      recipientTab === 'eligible'
        ? dispatch.eligibleRecipients
        : recipientTab === 'skipped'
          ? dispatch.skippedRecipients
          : dispatch.validatedRecipients;
    const query = recipientSearch.trim().toLowerCase();
    return query
      ? list.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.phone?.includes(query) ||
            r.email?.toLowerCase().includes(query),
        )
      : list;
  }, [
    dispatch.eligibleRecipients,
    dispatch.skippedRecipients,
    dispatch.validatedRecipients,
    recipientSearch,
    recipientTab,
  ]);

  const isEmail = channel === 'email';
  const isSms = channel === 'sms';
  const isBulk = localRecipients.length > 1;
  const Icon = isEmail ? Mail : isSms ? MessageSquare : MessageCircle;

  // Fix #2: dep narrowed to first recipient's name — full array ref not needed
  const firstRecipientName = localRecipients[0]?.name ?? '';
  const title = useMemo(() => {
    if (step === 'pick') return t('messaging.selectRecipients');
    if (isBulk) {
      return isEmail
        ? t('messaging.bulkEmailTitle')
        : isSms
          ? t('messaging.bulkSmsTitle')
          : t('messaging.bulkWhatsappTitle');
    }
    return isEmail
      ? `${t('messaging.sendEmail')} – ${firstRecipientName}`
      : isSms
        ? `${t('messaging.sms')} – ${firstRecipientName}`
        : t('messaging.whatsappSingleTitle', { name: firstRecipientName });
  }, [step, isBulk, isEmail, isSms, firstRecipientName, t]);

  const subtitle = useMemo(() => {
    if (step === 'pick') return t('messaging.selectRecipientsDesc');
    if (!isBulk) return undefined;
    const eligible = dispatch.eligibleRecipients.length;
    const total = localRecipients.length;
    return isEmail
      ? `${eligible} ${t('messaging.of')} ${total} ${t('messaging.selectRecipientsDesc')}`
      : isSms
        ? `${eligible} ${t('messaging.of')} ${total} ${t('messaging.contactsHavePhone')}`
        : `${eligible} ${t('messaging.of')} ${total} ${t('messaging.contactsHaveWhatsapp')}`;
  }, [step, isBulk, isEmail, isSms, dispatch.eligibleRecipients.length, localRecipients.length, t]);

  const note = useMemo(
    () =>
      isEmail
        ? t('messaging.bulkEmailDesc')
        : isSms
          ? t('messaging.smsManualSendNote')
          : t('messaging.whatsappBulkManualNote'),
    [isEmail, isSms, t],
  );

  const saveLabel = useMemo(() => {
    if (step === 'pick') return t('common.next');
    if (dispatch.pendingAudit) return t('messaging.retrySaveHistory');
    if (dispatch.opening) return isEmail ? t('messaging.openingMail') : t('messaging.openingTabs');
    const count = String(dispatch.eligibleRecipients.length);
    return isEmail
      ? isBulk
        ? t('messaging.openAllMail', { count })
        : t('messaging.openMailDraft')
      : isSms
        ? t('messaging.openSmsApp')
        : isBulk
          ? `${t('messaging.openAllWhatsapp')} (${count})`
          : t('messaging.openWhatsapp');
  }, [step, dispatch.pendingAudit, dispatch.opening, dispatch.eligibleRecipients.length, isEmail, isSms, isBulk, t]);

  // Fix #4: stable reference — prevents MessageComposerFormBody re-render on every keystroke
  const changeTemplate = useCallback((nextTemplateId: string): void => {
    setTemplateId(nextTemplateId);
    const selected = channelTemplates.find((tpl) => tpl.id === nextTemplateId);
    if (selected && selected.id !== 'custom') setMessage(selected.body);
  }, [channelTemplates]);

  const handleSave = useCallback(() => {
    if (step === 'pick') {
      setStep('compose');
      return;
    }
    void dispatch.sendAll();
  }, [step, dispatch]);

  // Fix #6: stable ref — setRecipientTab is stable so deps are empty
  const showSkipped = useCallback(() => setRecipientTab('skipped'), []);

  // Fix #7: single source for the busy guard used in two places below
  const isBusy = dispatch.opening || dispatch.saving;

  const saveDisabled = step === 'pick'
    ? localRecipients.length === 0
    : dispatch.pendingAudit
      ? dispatch.saving
      : isBusy ||
        !dispatch.eligibleRecipients.length ||
        !message.trim() ||
        (isEmail && !subject.trim());

  return (
    <FormModal
      open
      priority
      size={step === 'pick' ? '2xl' : 'xl'}
      onClose={step === 'compose' && recipients.length === 0 ? () => setStep('pick') : dispatch.requestClose}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      cancelLabel={step === 'compose' && recipients.length === 0 ? t('common.previous') : t('common.cancel')}
      saveLabel={saveLabel}
      saving={step === 'compose' && (dispatch.opening || dispatch.saving)}
      onSave={handleSave}
      saveDisabled={saveDisabled}
    >
      <div className="space-y-4">
        {step === 'compose' && (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
            {dispatch.pendingAudit ? (
              <WarningCallout density="compact" description={t('messaging.pendingAuditHint')} />
            ) : null}
            <MessageComposerDispatchControls
              skippedCount={dispatch.skippedRecipients.length}
              isEmail={isEmail}
              isBulk={isBulk}
              opening={dispatch.opening}
              dispatchSpeed={dispatch.dispatchSpeed}
              dispatchProgress={dispatch.dispatchProgress}
              isPaused={dispatch.isPaused}
              onShowSkipped={showSkipped}
              onDispatchSpeedChange={dispatch.setDispatchSpeed}
              onPausedChange={dispatch.setIsPaused}
              onCancel={dispatch.cancelDispatch}
            />
            <MessageComposerFormBody
              channel={channel}
              channelTemplates={channelTemplates}
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
          </>
        )}
        <MessageComposerRecipients
          isEmail={isEmail}
          isSms={isSms}
          recipientTab={recipientTab}
          search={recipientSearch}
          displayedRecipients={displayedRecipients}
          validatedRecipients={dispatch.validatedRecipients}
          eligibleRecipients={dispatch.eligibleRecipients}
          skippedRecipients={dispatch.skippedRecipients}
          previewIndex={previewIndex}
          message={message}
          disabled={isBusy}
          onRecipientTabChange={setRecipientTab}
          onSearchChange={setRecipientSearch}
          onPreviewIndexChange={setPreviewIndex}
          onSendOne={dispatch.executeSend}
          onAdd={addRecipient}
          onRemove={removeRecipient}
          isPickStep={step === 'pick'}
        />
      </div>
    </FormModal>
  );
}
