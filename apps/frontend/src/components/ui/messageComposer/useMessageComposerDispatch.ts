import { useMemo, useRef, useState } from 'react';
import {
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
import { useBranding } from '@/tenant/hooks/useBranding';
import { useMessagingMutations } from '@/hooks/useMessaging';

export type DispatchSpeed = 'safe' | 'normal' | 'express';
export type ValidatedMessagingRecipient = MessagingRecipient & {
  isValid: boolean;
  address?: string;
  reason?: string;
};

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
  const cancelRef = useRef(false);
  const pausedRef = useRef(false);
  pausedRef.current = isPaused;
  const personalizeOptions = useMemo(
    () => ({ madrasaName: branding.madrasaName || undefined }),
    [branding.madrasaName],
  );
  const validatedRecipients = useMemo<ValidatedMessagingRecipient[]>(() => recipients.map((recipient) => {
    const validation = validateRecipientAddress(recipient, channel);
    return { ...recipient, isValid: validation.isValid, address: validation.address, reason: validation.reason };
  }), [channel, recipients]);
  const eligibleRecipients = useMemo(() => validatedRecipients.filter((recipient) => recipient.isValid), [validatedRecipients]);
  const skippedRecipients = useMemo(() => validatedRecipients.filter((recipient) => !recipient.isValid), [validatedRecipients]);

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

  const saveHistory = async (
    sentRecords: { recipientId: string | number; body: string; status: 'sent' | 'failed' }[],
  ): Promise<boolean> => {
    if (!sentRecords.length || !user) return true;
    const activeTemplate = activeTemplates.find((template) => template.id === templateId);
    const messages: MessageLogCreateDto[] = sentRecords.map((record) => ({
      contactId: record.recipientId,
      channel,
      body: record.body,
      status: record.status,
      subject: channel === 'email' ? subject || undefined : undefined,
      category: activeTemplate?.category || 'general',
    }));
    try {
      await recordDispatches.mutateAsync(messages);
      return true;
    } catch {
      return false;
    }
  };

  const sendAll = async (): Promise<void> => {
    if (!eligibleRecipients.length || !message.trim() || opening || saving) return;
    const sentRecords: { recipientId: string | number; body: string; status: 'sent' | 'failed' }[] = [];
    const record = (recipient: MessagingRecipient, success: boolean): void => {
      sentRecords.push({
        recipientId: recipient.id,
        body: personalizeMessage(message, recipient, personalizeOptions),
        status: success ? 'sent' : 'failed',
      });
    };

    setSaving(true);
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
      if (!(await saveHistory(sentRecords))) return;
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
    setOpening(false);
    setDispatchProgress(null);
  };

  return {
    personalizeOptions,
    validatedRecipients,
    eligibleRecipients,
    skippedRecipients,
    opening,
    saving,
    dispatchSpeed,
    setDispatchSpeed,
    dispatchProgress,
    isPaused,
    setIsPaused,
    executeSend,
    sendAll,
    cancelDispatch,
  };
}
