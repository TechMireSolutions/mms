import { useRef, useState } from 'react';
import {
  findUnknownPersonalizationTokens,
  MESSAGE_LOG_RECORD_BATCH_MAX,
  personalizeMessage,
  PuppeteerWhatsAppProvider,
  validateRecipientAddress,
  type MessageLogCreateDto,
  type MessageTemplate,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { openDeviceSmsComposer } from '@/lib/deviceSms';
import { notify } from '@/lib/notify';
import { useBranding } from '@/tenant/hooks/useBranding';
import { useMessagingMutations } from '@/hooks/useMessaging';

export type DispatchSpeed = 'safe' | 'normal' | 'express';
export type ValidatedMessagingRecipient = MessagingRecipient & {
  isValid: boolean;
  address?: string;
  reason?: string;
};

type SentDispatchRecord = { recipientId: string | number; body: string; status: 'sent' | 'failed' };

const SPEED_DELAYS: Record<DispatchSpeed, number> = {
  safe: 1200,
  normal: 600,
  express: 300,
};

interface UseMessageComposerDispatchParams {
  channel: 'sms' | 'whatsapp' | 'email';
  recipients: MessagingRecipient[];
  activeTemplates: MessageTemplate[];
  templateId: string;
  subject: string;
  message: string;
  onClose: () => void;
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
}

export function useMessageComposerDispatch({
  channel,
  recipients,
  activeTemplates,
  templateId,
  subject,
  message,
  onClose,
  onSent,
}: UseMessageComposerDispatchParams) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const branding = useBranding();
  const { recordDispatches } = useMessagingMutations();
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dispatchSpeed, setDispatchSpeed] = useState<DispatchSpeed>('normal');
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingAudit, setPendingAudit] = useState<SentDispatchRecord[] | null>(null);
  const cancelRef = useRef(false);
  const pausedRef = useRef(false);
  const auditSavedCountRef = useRef(0);
  const auditIdempotencyKeyRef = useRef<string | null>(null);
  pausedRef.current = isPaused;
  const personalizeOptions = (() => ({ madrasaName: branding.madrasaName || undefined }))();
  const validatedRecipients = (() => recipients.map((recipient) => {
    const validation = validateRecipientAddress(recipient, channel);
    return { ...recipient, isValid: validation.isValid, address: validation.address, reason: validation.reason };
  }))() as ValidatedMessagingRecipient[];
  const eligibleRecipients = (() => validatedRecipients.filter((recipient) => recipient.isValid))();
  const skippedRecipients = (() => validatedRecipients.filter((recipient) => !recipient.isValid))();

  const executeSend = (recipient: MessagingRecipient, text: string): boolean => {
    const personalizedBody = personalizeMessage(text, recipient, personalizeOptions);
    if (channel === 'email') {
      if (!recipient.email) return false;
      const personalizedSubject = personalizeMessage(subject || t('messaging.defaultSubject'), recipient, personalizeOptions);
      return window.open(`mailto:${recipient.email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`, '_blank') !== null;
    }
    if (!recipient.phone) return false;
    if (channel === 'sms') return openDeviceSmsComposer(recipient.phone, personalizedBody);
    const numberId = PuppeteerWhatsAppProvider.getNumberId(recipient.phone);
    return Boolean(numberId && window.open(`https://wa.me/${numberId}?text=${encodeURIComponent(personalizedBody)}`, '_blank'));
  };

  const saveHistory = async (sentRecords: SentDispatchRecord[]): Promise<boolean> => {
    if (!sentRecords.length || !user) return true;
    const activeTemplate = activeTemplates.find((template) => template.id === templateId);
    const pending = sentRecords.slice(auditSavedCountRef.current);
    if (!pending.length) return true;

    if (!auditIdempotencyKeyRef.current) {
      auditIdempotencyKeyRef.current = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    const idempotencyKey = auditIdempotencyKeyRef.current;

    for (let index = 0; index < pending.length; index += MESSAGE_LOG_RECORD_BATCH_MAX) {
      const chunk = pending.slice(index, index + MESSAGE_LOG_RECORD_BATCH_MAX);
      const messages: MessageLogCreateDto[] = chunk.map((record) => ({
        contactId: record.recipientId,
        channel,
        body: record.body,
        status: record.status,
        subject: channel === 'email' ? subject || undefined : undefined,
        category: activeTemplate?.category || 'general',
      }));
      try {
        await recordDispatches.mutateAsync({
          body: {
            logs: messages,
            idempotencyKey: `${idempotencyKey}:${auditSavedCountRef.current + index}`,
          },
        });
        auditSavedCountRef.current += chunk.length;
      } catch {
        return false;
      }
    }
    return true;
  };

  const sendAll = async (): Promise<void> => {
    if (opening || saving) return;

    // Retry only the remaining audit after a partial save failure — do not re-open device windows.
    if (pendingAudit) {
      setSaving(true);
      try {
        if (!(await saveHistory(pendingAudit))) return;
        const completed = pendingAudit;
        setPendingAudit(null);
        auditSavedCountRef.current = 0;
        onSent?.(completed);
        onClose();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!eligibleRecipients.length || !message.trim()) return;
    const unknownBodyTokens = findUnknownPersonalizationTokens(message);
    const unknownSubjectTokens = channel === 'email'
      ? findUnknownPersonalizationTokens(subject)
      : [];
    const unknownTokens = [...new Set([...unknownBodyTokens, ...unknownSubjectTokens])];
    if (unknownTokens.length > 0) {
      notify.error(t('messaging.unknownTokens', {
        tokens: unknownTokens.map((token) => `{${token}}`).join(', '),
      }));
      return;
    }
    const sentRecords: SentDispatchRecord[] = [];
    const record = (recipient: MessagingRecipient, success: boolean): void => {
      sentRecords.push({
        recipientId: recipient.id,
        body: personalizeMessage(message, recipient, personalizeOptions),
        status: success ? 'sent' : 'failed',
      });
    };

    setSaving(true);
    auditSavedCountRef.current = 0;
    auditIdempotencyKeyRef.current = null;
    try {
      if (eligibleRecipients.length === 1) {
        record(eligibleRecipients[0], executeSend(eligibleRecipients[0], message));
      } else {
        setOpening(true);
        setIsPaused(false);
        cancelRef.current = false;
        for (let index = 0; index < eligibleRecipients.length; index += 1) {
          if (cancelRef.current) break;
          while (pausedRef.current && !cancelRef.current) await new Promise((resolve) => setTimeout(resolve, 200));
          if (cancelRef.current) break;
          const recipient = eligibleRecipients[index];
          record(recipient, executeSend(recipient, message));
          setDispatchProgress({ current: index + 1, total: eligibleRecipients.length });
          if (index < eligibleRecipients.length - 1) await new Promise((resolve) => setTimeout(resolve, SPEED_DELAYS[dispatchSpeed]));
        }
        setOpening(false);
        setDispatchProgress(null);
      }

      if (sentRecords.length === 0) return;
      if (!(await saveHistory(sentRecords))) {
        setPendingAudit(sentRecords);
        return;
      }
      onSent?.(sentRecords);
      onClose();
    } finally {
      setOpening(false);
      setDispatchProgress(null);
      setSaving(false);
    }
  };

  const cancelDispatch = (): void => {
    cancelRef.current = true;
  };

  const requestClose = (): void => {
    if (opening) {
      cancelRef.current = true;
      return;
    }
    if (saving || pendingAudit) return;
    onClose();
  };

  return {
    personalizeOptions,
    validatedRecipients,
    eligibleRecipients,
    skippedRecipients,
    opening,
    saving,
    pendingAudit: Boolean(pendingAudit),
    dispatchSpeed,
    setDispatchSpeed,
    dispatchProgress,
    isPaused,
    setIsPaused,
    executeSend,
    sendAll,
    cancelDispatch,
    requestClose,
  };
}
