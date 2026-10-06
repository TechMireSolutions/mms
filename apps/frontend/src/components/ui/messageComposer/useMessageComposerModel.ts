import { useState } from 'react';
import { Mail, MessageCircle, MessageSquare } from 'lucide-react';
import {
  mergeMessageTemplates,
  type MessageTemplate,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { useMessageTemplates } from '@/hooks/useMessaging';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import type { RecipientTab } from './MessageComposerRecipients';
import { useMessageComposerDispatch } from './useMessageComposerDispatch';
import { findUnknownTokens } from './messageComposerDispatchService';
import {
  filterDisplayedRecipients,
  withAddedRecipient,
} from './messageComposerRecipientsUtils';
import {
  formatUnknownTokensLabel,
  hasUnknownComposeTokens,
  liveUnknownTokenLabels,
  unknownTokenFieldErrors,
} from './messageComposerTokenErrors';
import {
  getComposerNote,
  getComposerSaveLabel,
  getComposerSubtitle,
  getComposerTitle,
} from './messageComposerText';

export interface UseMessageComposerModelProps {
  channel: 'sms' | 'whatsapp' | 'email';
  recipients: MessagingRecipient[];
  onClose: () => void;
  templates?: MessageTemplate[];
  initialMessage?: string;
  initialSubject?: string;
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
  madrasaName?: string;
  user?: unknown;
}

export function useMessageComposerModel({
  channel,
  recipients,
  onClose,
  templates,
  initialMessage,
  initialSubject,
  onSent,
  madrasaName,
  user,
}: UseMessageComposerModelProps) {
  const { t } = useTranslation();
  const { templates: fetchedTemplates } = useMessageTemplates();

  const activeTemplates = templates ?? mergeMessageTemplates(fetchedTemplates);
  const channelTemplates = activeTemplates.filter(
    (tpl) => !tpl.channel || tpl.channel === 'all' || tpl.channel === channel,
  );

  const [templateId, setTemplateId] = useState(
    () => channelTemplates[0]?.id || activeTemplates[0]?.id || 'custom',
  );
  const [subject, setSubjectState] = useState(initialSubject ?? '');
  const [message, setMessageState] = useState(
    () => initialMessage || channelTemplates[0]?.body || activeTemplates[0]?.body || '',
  );
  const [bodyError, setBodyError] = useState<string | undefined>();
  const [subjectError, setSubjectError] = useState<string | undefined>();
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [localRecipients, setLocalRecipients] = useState<MessagingRecipient[]>(recipients);
  const [step, setStep] = useState<'pick' | 'compose'>(recipients.length > 0 ? 'compose' : 'pick');

  const setMessage = (value: string): void => {
    setMessageState(value);
    const tokens = liveUnknownTokenLabels(value);
    setBodyError(tokens ? t('messaging.unknownTokens', { tokens }) : undefined);
  };

  const setSubject = (value: string): void => {
    setSubjectState(value);
    const tokens = liveUnknownTokenLabels(value);
    setSubjectError(tokens ? t('messaging.unknownTokens', { tokens }) : undefined);
  };

  const addRecipient = (candidate: MessagingRecipient): void => {
    const { next, duplicate } = withAddedRecipient(localRecipients, candidate);
    if (duplicate) {
      notify.warning(t('messaging.recipientAlreadyAdded'));
      return;
    }
    setLocalRecipients(next);
    notify.success(t('messaging.recipientAdded'));
  };

  const removeRecipient = (id: string | number): void => {
    setLocalRecipients((prev) => prev.filter((r) => String(r.id) !== String(id)));
    notify.success(t('messaging.recipientRemoved'));
  };

  const dispatch = useMessageComposerDispatch({
    channel,
    recipients: localRecipients,
    activeTemplates,
    templateId,
    subject,
    message,
    onClose,
    onSent,
    madrasaName,
    user,
  });

  const displayedRecipients = filterDisplayedRecipients({
    recipientTab,
    recipientSearch,
    eligible: dispatch.eligibleRecipients,
    skipped: dispatch.skippedRecipients,
    validated: dispatch.validatedRecipients,
  });

  const isEmail = channel === 'email';
  const isSms = channel === 'sms';
  const isBulk = localRecipients.length > 1;
  const Icon = isEmail ? Mail : isSms ? MessageSquare : MessageCircle;
  const eligibleCount = dispatch.eligibleRecipients.length;
  const title = getComposerTitle({ t, step, channel, localRecipients });
  const subtitle = getComposerSubtitle({ t, step, channel, localRecipients, eligibleCount });
  const note = getComposerNote(t, channel);
  const saveLabel = getComposerSaveLabel({
    t,
    step,
    channel,
    localRecipients,
    eligibleCount,
    pendingAudit: !!dispatch.pendingAudit,
    opening: dispatch.opening,
  });

  const changeTemplate = (nextTemplateId: string): void => {
    setTemplateId(nextTemplateId);
    const selected = channelTemplates.find((tpl) => tpl.id === nextTemplateId);
    if (selected && selected.id !== 'custom') setMessage(selected.body);
  };

  const handleSave = (): void => {
    if (step === 'pick') {
      setStep('compose');
      return;
    }
    const unknownTokens = findUnknownTokens(channel, subject, message);
    if (unknownTokens.length > 0) {
      const errorMsg = t('messaging.unknownTokens', {
        tokens: formatUnknownTokensLabel(unknownTokens),
      });
      const fieldErrors = unknownTokenFieldErrors({ channel, subject, message, errorMsg });
      setBodyError(fieldErrors.bodyError);
      setSubjectError(fieldErrors.subjectError);
      notify.error(errorMsg);
      return;
    }
    void dispatch.sendAll();
  };

  const showSkipped = (): void => setRecipientTab('skipped');
  const isBusy = dispatch.opening || dispatch.saving;
  const saveDisabled =
    step === 'pick'
      ? localRecipients.length === 0
      : dispatch.pendingAudit
        ? dispatch.saving
        : isBusy ||
          !dispatch.eligibleRecipients.length ||
          !message.trim() ||
          (isEmail && !subject.trim()) ||
          hasUnknownComposeTokens(channel, subject, message);

  return {
    step, setStep, templateId, subject, setSubject, message, setMessage,
    bodyError, subjectError, recipientTab, setRecipientTab, recipientSearch,
    setRecipientSearch, previewIndex, setPreviewIndex, localRecipients,
    addRecipient, removeRecipient, channelTemplates, changeTemplate, dispatch,
    displayedRecipients, isEmail, isSms, isBulk, Icon, title, subtitle, note,
    saveLabel, handleSave, showSkipped, isBusy, saveDisabled,
  };
}
