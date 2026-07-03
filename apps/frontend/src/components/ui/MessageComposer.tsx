import React, { useState, useMemo } from 'react';
import { MessageCircle, MessageSquare, User, Info, Sparkles } from 'lucide-react';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { openDeviceSmsComposer } from '@/lib/deviceSms';
import { notify } from '@/lib/notify';
import { FormModal } from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormPrimitives';
import { FORM_LABEL, FORM_TEXTAREA } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getCollection, saveCollection } from '@/lib/db';

export interface MessagingRecipient {
  id: string | number;
  name: string;
  phone: string;
}

export interface MessageTemplate {
  id: string;
  label: string;
  body: string;
}

export interface MessageComposerProps {
  channel: 'sms' | 'whatsapp';
  recipients: MessagingRecipient[];
  onClose: () => void;
  templates?: MessageTemplate[];
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
}

/**
 * Replaces placeholders like {name} with recipient-specific data.
 */
export function personalizeMessage(body: string, recipient: MessagingRecipient): string {
  return body.replace(/{name}/gi, recipient.name || '');
}

/**
 * Reusable and decoupled Message Composer for SMS and WhatsApp.
 */
export default function MessageComposer({
  channel,
  recipients,
  onClose,
  templates,
  onSent,
}: MessageComposerProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Safely resolve whatsappTemplates from context if mounted
  const contextTemplates = (() => {
    try {
      const config = useContactConfig();
      return config?.whatsappTemplates || [];
    } catch {
      return [];
    }
  })();

  // Deduplicate and filter recipients with valid phone numbers
  const eligibleRecipients = useMemo(() => {
    return recipients.filter((r) => Boolean(r.phone?.trim()));
  }, [recipients]);

  const activeTemplates = useMemo(() => {
    if (templates) return templates;
    return contextTemplates.map((t) => ({
      id: t.id,
      label: t.label,
      body: t.body,
    }));
  }, [templates, contextTemplates]);

  const [template, setTemplate] = useState<string>(() => activeTemplates[0]?.id || 'custom');
  const [message, setMessage] = useState<string>(() => activeTemplates[0]?.body || '');
  const [opening, setOpening] = useState<boolean>(false);

  const handleTemplateChange = (templateId: string): void => {
    setTemplate(templateId);
    const selectedTemplate = activeTemplates.find((t) => t.id === templateId);
    if (selectedTemplate && selectedTemplate.id !== 'custom') {
      setMessage(selectedTemplate.body);
    }
  };

  const executeSend = (recipient: MessagingRecipient, text: string): boolean => {
    const phone = recipient.phone;
    if (!phone) return false;

    const personalized = personalizeMessage(text, recipient);

    if (channel === 'sms') {
      return openDeviceSmsComposer(phone, personalized);
    } else {
      const cleanNum = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(personalized)}`, '_blank');
      return true;
    }
  };

  const handleSendAll = (): void => {
    if (eligibleRecipients.length === 0 || !message.trim()) return;

    const sentRecords: { recipientId: string | number; body: string }[] = [];

    if (channel === 'sms') {
      eligibleRecipients.forEach((recipient) => {
        const success = executeSend(recipient, message);
        if (success) {
          sentRecords.push({ recipientId: recipient.id, body: personalizeMessage(message, recipient) });
        }
      });
    } else {
      if (eligibleRecipients.length === 1) {
        executeSend(eligibleRecipients[0], message);
        sentRecords.push({ recipientId: eligibleRecipients[0].id, body: personalizeMessage(message, eligibleRecipients[0]) });
        onSent?.(sentRecords);
        onClose();
        return;
      }

      setOpening(true);
      eligibleRecipients.forEach((recipient, index) => {
        window.setTimeout(() => {
          executeSend(recipient, message);
          sentRecords.push({ recipientId: recipient.id, body: personalizeMessage(message, recipient) });

          if (index === eligibleRecipients.length - 1) {
            setOpening(false);
            onSent?.(sentRecords);
            onClose();
          }
        }, index * 600); // 600ms delay to prevent browser blockages
      });
      return;
    }

    // Save to local message history log if user is logged in
    if (sentRecords.length > 0 && user) {
      const dbKey = `messages_u:${user.id}`;
      const newMsgs = sentRecords.map((rec) => ({
        id: crypto.randomUUID(),
        userId: user.id,
        contactId: rec.recipientId,
        channel,
        body: rec.body,
        sentAt: new Date().toISOString(),
      }));
      const currentMsgs = getCollection<unknown>(dbKey);
      saveCollection(dbKey, [...newMsgs, ...currentMsgs]);
      onSent?.(sentRecords);
    }

    onClose();
  };

  const isSms = channel === 'sms';
  const Icon = isSms ? MessageSquare : MessageCircle;

  const isBulk = recipients.length > 1;
  const title = isBulk
    ? isSms
      ? t('contacts.bulkSmsMessage')
      : t('contacts.whatsapp.bulkTitle')
    : isSms
    ? `${t('contacts.sms')} – ${recipients[0]?.name}`
    : t('contacts.whatsapp.singleTitle', { name: recipients[0]?.name ?? '' });

  const subtitle = isBulk
    ? isSms
      ? `${eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('contacts.contactsHavePhone')}`
      : `${eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('contacts.whatsapp.contactsHaveWhatsapp')}`
    : undefined;

  const note = isSms ? t('contacts.smsManualSendNote') : t('contacts.whatsapp.bulkManualNote');

  const saveLabel = opening
    ? t('contacts.whatsapp.openingTabs')
    : isSms
    ? t('contacts.openSmsApp')
    : isBulk
    ? `${t('contacts.whatsapp.openAll')} (${eligibleRecipients.length})`
    : t('contacts.whatsapp.open');

  // Preview message personalization using the first recipient
  const previewText = useMemo(() => {
    if (!message.trim() || eligibleRecipients.length === 0) return '';
    return personalizeMessage(message, eligibleRecipients[0]);
  }, [message, eligibleRecipients]);

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      cancelLabel={t('common.cancel')}
      saveLabel={saveLabel}
      onSave={handleSendAll}
      saveDisabled={opening || eligibleRecipients.length === 0 || !message.trim()}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {note}
        </p>

        {activeTemplates.length > 0 && (
          <div>
            <label className={FORM_LABEL} htmlFor="messageTemplate">
              {t('contacts.messageTemplate')}
            </label>
            <FormSelect
              id="messageTemplate"
              value={template}
              onChange={handleTemplateChange}
              options={activeTemplates.map((tpl) => ({ value: tpl.id, label: tpl.label }))}
            />
          </div>
        )}

        <div>
          <label className={FORM_LABEL} htmlFor="messageBody">
            {isSms ? t('contacts.messageBody') : t('contacts.whatsapp.message')}
          </label>
          <textarea
            id="messageBody"
            className={FORM_TEXTAREA}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isSms ? t('contacts.smsMessagePlaceholder') : t('contacts.whatsapp.typeMessagePlaceholder')}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3 text-primary/70" />
              Use <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">{`{name}`}</code> to personalize.
            </span>
            <span className="text-[10px] text-muted-foreground">
              {message.length} {t('contacts.whatsapp.chars')}
            </span>
          </div>
        </div>

        {/* Live Personalization Chat Bubble Preview */}
        {previewText && (
          <div className="border border-border/80 rounded-xl p-3 bg-muted/30">
            <h5 className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Live Preview for {eligibleRecipients[0].name}
            </h5>
            <div className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words ${
              isSms 
                ? 'bg-info/10 text-info-foreground border border-info/20 rounded-tl-none' 
                : 'bg-success/15 text-foreground border border-success/20 rounded-tl-none'
            }`}>
              {previewText}
            </div>
          </div>
        )}

        {isBulk && eligibleRecipients.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recipients ({eligibleRecipients.length})
            </span>
            <ul className="space-y-1 max-h-32 overflow-y-auto border border-border/50 rounded-lg p-2 bg-muted/10">
              {eligibleRecipients.map((recipient) => (
                <li key={recipient.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="w-3 h-3 flex-shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{recipient.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">({recipient.phone})</span>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-auto text-primary font-semibold hover:underline flex-shrink-0 h-auto p-0 text-[11px]"
                    onClick={() => executeSend(recipient, message)}
                  >
                    {isSms ? t('contacts.openSmsApp') : t('contacts.whatsapp.open')}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isBulk && eligibleRecipients.length === 0 && (
          <p className="text-xs text-destructive font-medium">
            {isSms ? t('contacts.smsNoEligibleContacts') : t('contacts.whatsapp.skippedNote')}
          </p>
        )}
      </div>
    </FormModal>
  );
}
