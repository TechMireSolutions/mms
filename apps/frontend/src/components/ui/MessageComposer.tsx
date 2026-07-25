import React, { useState, useMemo } from 'react';
import { MessageCircle, MessageSquare, User, Info, Sparkles, Mail, CheckCheck, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { openDeviceSmsComposer } from '@/lib/deviceSms';
import { FormModal } from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getCollection, saveCollection } from '@/lib/db';
import { 
  personalizeMessage, 
  calculateSmsSegments, 
  type PersonalizeRecipient, 
  type MessageTemplate,
  type Message
} from '@mms/shared';

export interface MessagingRecipient extends PersonalizeRecipient {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
}

export type { MessageTemplate };

export interface MessageComposerProps {
  channel: 'sms' | 'whatsapp' | 'email';
  recipients: MessagingRecipient[];
  onClose: () => void;
  templates?: MessageTemplate[];
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
}

export { personalizeMessage };

const VARIABLE_TOKENS = [
  { token: '{name}', label: 'Full Name' },
  { token: '{first_name}', label: 'First Name' },
  { token: '{phone}', label: 'Phone' },
  { token: '{email}', label: 'Email' },
  { token: '{date}', label: 'Date' },
  { token: '{due_date}', label: 'Due Date' },
  { token: '{amount}', label: 'Amount' },
  { token: '{madrasa_name}', label: 'Madrasa Name' },
];

/**
 * Reusable and decoupled Central Message Composer for SMS, WhatsApp, and Email.
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

  // Deduplicate and filter recipients with valid addresses/numbers
  const eligibleRecipients = useMemo(() => {
    if (channel === 'email') {
      return recipients.filter((r) => Boolean(r.email?.trim()));
    }
    return recipients.filter((r) => Boolean(r.phone?.trim()));
  }, [recipients, channel]);

  const skippedCount = recipients.length - eligibleRecipients.length;

  // Load custom templates saved in user settings/messaging setup
  const userSavedTemplates = useMemo(() => {
    if (!user) return [];
    const dbKey = `messages_templates_u:${user.id}`;
    return getCollection<MessageTemplate>(dbKey) || [];
  }, [user]);

  const activeTemplates = useMemo(() => {
    if (templates) return templates;
    const base: MessageTemplate[] = contextTemplates.map((t) => ({
      id: t.id,
      label: t.label,
      body: t.body,
      category: 'general',
      channel: 'whatsapp',
    }));
    // Merge base with user saved templates, avoiding duplicates by id
    const existingIds = new Set(base.map((t) => t.id));
    const uniqueUserTemplates = userSavedTemplates.filter((t) => !existingIds.has(t.id));
    return [...base, ...uniqueUserTemplates];
  }, [templates, contextTemplates, userSavedTemplates]);

  // Filter templates matching current channel or 'all'
  const channelFilteredTemplates = useMemo(() => {
    return activeTemplates.filter((tpl) => !tpl.channel || tpl.channel === 'all' || tpl.channel === channel);
  }, [activeTemplates, channel]);

  const [template, setTemplate] = useState<string>(() => channelFilteredTemplates[0]?.id || activeTemplates[0]?.id || 'custom');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>(() => channelFilteredTemplates[0]?.body || activeTemplates[0]?.body || '');
  const [opening, setOpening] = useState<boolean>(false);
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const handleTemplateChange = (templateId: string): void => {
    setTemplate(templateId);
    const selectedTemplate = activeTemplates.find((t) => t.id === templateId);
    if (selectedTemplate && selectedTemplate.id !== 'custom') {
      setMessage(selectedTemplate.body);
    }
  };

  // Compute SMS segment statistics
  const smsStats = useMemo(() => {
    return calculateSmsSegments(message);
  }, [message]);

  const executeSend = (recipient: MessagingRecipient, text: string): boolean => {
    const personalizedBody = personalizeMessage(text, recipient);

    if (channel === 'email') {
      const email = recipient.email;
      if (!email) return false;
      const personalizedSubject = personalizeMessage(subject || 'Announcement', recipient);
      window.open(`mailto:${email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`, '_blank');
      return true;
    } else {
      const phone = recipient.phone;
      if (!phone) return false;

      if (channel === 'sms') {
        return openDeviceSmsComposer(phone, personalizedBody);
      } else {
        const cleanNum = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(personalizedBody)}`, '_blank');
        return true;
      }
    }
  };

  const saveSentMessageHistory = (sentRecords: { recipientId: string | number; body: string }[]): void => {
    if (sentRecords.length > 0 && user) {
      const dbKey = `messages_u:${user.id}`;
      const activeTplObj = activeTemplates.find((t) => t.id === template);
      const newMsgs: Message[] = sentRecords.map((rec) => ({
        id: crypto.randomUUID(),
        userId: user.id,
        contactId: rec.recipientId,
        channel,
        body: rec.body,
        sentAt: new Date().toISOString(),
        status: 'sent',
        subject: channel === 'email' ? subject || undefined : undefined,
        category: activeTplObj?.category || 'general',
      }));
      const currentMsgs = getCollection<Message>(dbKey) || [];
      saveCollection(dbKey, [...newMsgs, ...currentMsgs]);
      window.dispatchEvent(new CustomEvent('local-database-update'));
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
      } else {
        setOpening(true);
        setDispatchProgress({ current: 1, total: eligibleRecipients.length });

        eligibleRecipients.forEach((recipient, index) => {
          window.setTimeout(() => {
            executeSend(recipient, message);
            sentRecords.push({ recipientId: recipient.id, body: personalizeMessage(message, recipient) });
            setDispatchProgress({ current: index + 1, total: eligibleRecipients.length });

            if (index === eligibleRecipients.length - 1) {
              setOpening(false);
              setDispatchProgress(null);
              onSent?.(sentRecords);
              saveSentMessageHistory(sentRecords);
              onClose();
            }
          }, index * 600); // 600ms delay to prevent browser blockages
        });
        return;
      }
    }

    saveSentMessageHistory(sentRecords);
    onClose();
  };

  const isEmail = channel === 'email';
  const isSms = channel === 'sms';
  const Icon = isEmail ? Mail : isSms ? MessageSquare : MessageCircle;

  const isBulk = recipients.length > 1;
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
      ? `${eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('messaging.selectRecipientsDesc')}`
      : isSms
      ? `${eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('contacts.contactsHavePhone')}`
      : `${eligibleRecipients.length} ${t('contacts.of')} ${recipients.length} ${t('contacts.whatsapp.contactsHaveWhatsapp')}`
    : undefined;

  const note = isEmail
    ? t('messaging.bulkEmailDesc')
    : isSms
    ? t('contacts.smsManualSendNote')
    : t('contacts.whatsapp.bulkManualNote');

  const saveLabel = opening
    ? (isEmail ? t('messaging.openingMail') : t('contacts.whatsapp.openingTabs'))
    : isEmail
    ? (isBulk ? t('messaging.openAllMail', { count: String(eligibleRecipients.length) }) : t('messaging.openMailDraft'))
    : isSms
    ? t('contacts.openSmsApp')
    : isBulk
    ? `${t('contacts.whatsapp.openAll')} (${eligibleRecipients.length})`
    : t('contacts.whatsapp.open');

  const currentPreviewRecipient = eligibleRecipients[previewIndex] || eligibleRecipients[0];

  // Preview message personalization using selected recipient
  const previewText = useMemo(() => {
    if (!message.trim() || !currentPreviewRecipient) return '';
    return personalizeMessage(message, currentPreviewRecipient);
  }, [message, currentPreviewRecipient]);

  const insertVariableTag = (tag: string): void => {
    setMessage((prev) => (prev ? `${prev} ${tag}` : tag));
  };

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
      saveDisabled={opening || eligibleRecipients.length === 0 || !message.trim() || (isEmail && !subject.trim())}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {note}
        </p>

        {/* Skipped contact warning alert */}
        {skippedCount > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {skippedCount} contact{skippedCount > 1 ? 's' : ''} skipped (missing {isEmail ? 'email address' : 'phone number'}).
            </span>
          </div>
        )}

        {/* Active Dispatch Progress Indicator */}
        {dispatchProgress && (
          <div className="p-3 border border-primary/20 bg-primary/5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                {t('messaging.dispatchProgress', { current: String(dispatchProgress.current), total: String(dispatchProgress.total) })}
              </span>
              <span>{Math.round((dispatchProgress.current / dispatchProgress.total) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isEmail && (
          <div>
            <label className={FORM_LABEL} htmlFor="emailSubject">
              {t('messaging.subject')}
            </label>
            <Input
              id="emailSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important Announcement"
              required
            />
          </div>
        )}

        {activeTemplates.length > 0 && (
          <div>
            <label className={FORM_LABEL} htmlFor="messageTemplate">
              {t('contacts.messageTemplate')}
            </label>
            <FormSelect
              id="messageTemplate"
              value={template}
              onChange={handleTemplateChange}
              options={activeTemplates.map((tpl) => ({ 
                value: tpl.id, 
                label: tpl.category ? `${tpl.label} [${tpl.category}]` : tpl.label 
              }))}
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={FORM_LABEL} htmlFor="messageBody">
              {t('contacts.messageBody')}
            </label>
          </div>

          {/* Tokens chips bar */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold me-1">{t('messaging.insertVariable')}:</span>
            {VARIABLE_TOKENS.map(({ token }) => (
              <button
                key={token}
                type="button"
                onClick={() => insertVariableTag(token)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors"
              >
                {token}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/80 mb-2 italic">
            💡 {t('messaging.fallbackHint')}
          </p>

          <Textarea
            id="messageBody"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isSms ? t('contacts.smsMessagePlaceholder') : t('contacts.whatsapp.typeMessagePlaceholder')}
          />

          <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-primary/70" />
              {t('messaging.createPresetDesc')}
            </span>
            <div className="flex items-center gap-2 font-mono">
              {isSms && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  smsStats.isUnicode ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-muted text-foreground'
                }`}>
                  {smsStats.isUnicode ? 'Unicode' : 'GSM 7-bit'} • {smsStats.totalSegments} seg ({smsStats.remainingInSegment} left)
                </span>
              )}
              <span>{message.length} {t('contacts.whatsapp.chars')}</span>
            </div>
          </div>
        </div>

        {/* Live Personalization Preview */}
        {previewText && currentPreviewRecipient && (
          <div className="border border-border/80 rounded-xl p-3 bg-muted/30">
            <h5 className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t('messaging.livePreview', { name: currentPreviewRecipient.name })}
              </span>

              <div className="flex items-center gap-2">
                {isBulk && eligibleRecipients.length > 1 && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={previewIndex <= 0}
                      onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span className="font-mono text-muted-foreground">{previewIndex + 1}/{eligibleRecipients.length}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={previewIndex >= eligibleRecipients.length - 1}
                      onClick={() => setPreviewIndex((i) => Math.min(eligibleRecipients.length - 1, i + 1))}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{channel} channel</span>
              </div>
            </h5>

            {isEmail ? (
              <div className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1.5 shadow-sm">
                <div className="border-b border-border/40 pb-1.5 text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground me-1">Subject:</span> {personalizeMessage(subject || 'Announcement', currentPreviewRecipient)}
                </div>
                <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {previewText}
                </div>
              </div>
            ) : isSms ? (
              <div className="p-2.5 rounded-2xl text-xs max-w-[85%] break-words bg-info/10 text-info-foreground border border-info/20 rounded-tl-none space-y-1">
                <div className="whitespace-pre-wrap">{previewText}</div>
                <div className="text-[9px] opacity-70 text-right font-mono">SMS Message</div>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl text-xs max-w-[85%] break-words bg-success/15 text-foreground border border-success/20 rounded-tl-none space-y-1">
                <div className="whitespace-pre-wrap">{previewText}</div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-success-foreground/80 font-mono">
                  <span>WhatsApp</span>
                  <CheckCheck className="w-3 h-3 text-success" />
                </div>
              </div>
            )}
          </div>
        )}

        {isBulk && eligibleRecipients.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('messaging.confirmRecipients')} ({eligibleRecipients.length})
            </span>
            <ul className="space-y-1 max-h-32 overflow-y-auto border border-border/50 rounded-lg p-2 bg-muted/10">
              {eligibleRecipients.map((recipient, idx) => {
                const displayContactVal = isEmail ? recipient.email : recipient.phone;
                return (
                  <li key={recipient.id} className={`flex items-center gap-2 text-xs p-1 rounded transition-colors ${previewIndex === idx ? 'bg-primary/10 text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    <User className="w-3 h-3 flex-shrink-0 text-muted-foreground/60" />
                    <span className="truncate cursor-pointer" onClick={() => setPreviewIndex(idx)}>{recipient.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">({displayContactVal})</span>
                    <Button
                      type="button"
                      variant="link"
                      className="ml-auto text-primary font-semibold hover:underline flex-shrink-0 h-auto p-0 text-[11px]"
                      onClick={() => executeSend(recipient, message)}
                    >
                      {isEmail ? t('messaging.sendEmail') : isSms ? t('contacts.openSmsApp') : t('contacts.whatsapp.open')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {isBulk && eligibleRecipients.length === 0 && (
          <p className="text-xs text-destructive font-medium">
            {isEmail ? t('messaging.selectRecipientsDesc') : isSms ? t('contacts.smsNoEligibleContacts') : t('contacts.whatsapp.skippedNote')}
          </p>
        )}
      </div>
    </FormModal>
  );
}


