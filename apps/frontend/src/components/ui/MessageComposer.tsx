import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MessageCircle, MessageSquare, User, Info, Sparkles, Mail, CheckCheck, AlertCircle, Clock, ChevronLeft, ChevronRight, Play, Pause, XCircle, Zap, ShieldCheck
} from 'lucide-react';
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
  validateRecipientAddress,
  MESSAGING_VARIABLE_TOKENS,
  type PersonalizeRecipient, 
  type MessageTemplate,
  type Message
} from '@mms/shared';
import { useMessagingMutations } from '@/tenant/features/messaging/hooks/useMessaging';

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
  initialMessage?: string;
  initialSubject?: string;
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
}

export { personalizeMessage };

export type DispatchSpeed = 'safe' | 'normal' | 'express';

const SPEED_DELAYS: Record<DispatchSpeed, number> = {
  safe: 1200,
  normal: 600,
  express: 300,
};

/**
 * Enhanced Modern Central Message Composer for SMS, WhatsApp, and Email.
 */
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

  // Evaluate recipients eligibility and validation
  const validatedRecipients = useMemo(() => {
    return recipients.map((rec) => {
      const val = validateRecipientAddress(rec, channel);
      return {
        ...rec,
        isValid: val.isValid,
        address: val.address,
        reason: val.reason,
      };
    });
  }, [recipients, channel]);

  const eligibleRecipients = useMemo(() => {
    return validatedRecipients.filter((r) => r.isValid);
  }, [validatedRecipients]);

  const skippedRecipients = useMemo(() => {
    return validatedRecipients.filter((r) => !r.isValid);
  }, [validatedRecipients]);

  const skippedCount = skippedRecipients.length;

  // Recipient list filter tab inside modal
  const [recipientTab, setRecipientTab] = useState<'all' | 'eligible' | 'skipped'>('all');

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
    const existingIds = new Set(base.map((t) => t.id));
    const uniqueUserTemplates = userSavedTemplates.filter((t) => !existingIds.has(t.id));
    return [...base, ...uniqueUserTemplates];
  }, [templates, contextTemplates, userSavedTemplates]);

  const channelFilteredTemplates = useMemo(() => {
    return activeTemplates.filter((tpl) => !tpl.channel || tpl.channel === 'all' || tpl.channel === channel);
  }, [activeTemplates, channel]);

  const [template, setTemplate] = useState<string>(() => channelFilteredTemplates[0]?.id || activeTemplates[0]?.id || 'custom');
  const [subject, setSubject] = useState<string>(initialSubject || '');
  const [message, setMessage] = useState<string>(() => initialMessage || channelFilteredTemplates[0]?.body || activeTemplates[0]?.body || '');
  
  // Dispatch engine state
  const [opening, setOpening] = useState<boolean>(false);
  const [dispatchSpeed, setDispatchSpeed] = useState<DispatchSpeed>('normal');
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const dispatchCancelRef = useRef<boolean>(false);
  const dispatchPausedRef = useRef<boolean>(false);
  dispatchPausedRef.current = isPaused;

  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const handleTemplateChange = (templateId: string): void => {
    setTemplate(templateId);
    const selectedTemplate = activeTemplates.find((t) => t.id === templateId);
    if (selectedTemplate && selectedTemplate.id !== 'custom') {
      setMessage(selectedTemplate.body);
    }
  };

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

  const { recordDispatches } = useMessagingMutations();

  const saveSentMessageHistory = (sentRecords: { recipientId: string | number; body: string }[]): void => {
    if (sentRecords.length > 0 && user) {
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

      // Mutate to server REST API + fallback local storage
      recordDispatches.mutate(newMsgs);
      window.dispatchEvent(new CustomEvent('local-database-update'));
    }
  };

  const handleSendAll = async (): Promise<void> => {
    if (eligibleRecipients.length === 0 || !message.trim()) return;

    const sentRecords: { recipientId: string | number; body: string }[] = [];

    if (channel === 'sms') {
      eligibleRecipients.forEach((recipient) => {
        const success = executeSend(recipient, message);
        if (success) {
          sentRecords.push({ recipientId: recipient.id, body: personalizeMessage(message, recipient) });
        }
      });
      saveSentMessageHistory(sentRecords);
      onSent?.(sentRecords);
      onClose();
      return;
    }

    if (eligibleRecipients.length === 1) {
      executeSend(eligibleRecipients[0], message);
      sentRecords.push({ recipientId: eligibleRecipients[0].id, body: personalizeMessage(message, eligibleRecipients[0]) });
      saveSentMessageHistory(sentRecords);
      onSent?.(sentRecords);
      onClose();
      return;
    }

    // Bulk execution engine with pause/cancel/speed controls
    setOpening(true);
    setIsPaused(false);
    dispatchCancelRef.current = false;
    const delay = SPEED_DELAYS[dispatchSpeed];

    for (let index = 0; index < eligibleRecipients.length; index++) {
      if (dispatchCancelRef.current) break;

      // Wait if paused
      while (dispatchPausedRef.current && !dispatchCancelRef.current) {
        await new Promise((res) => setTimeout(res, 200));
      }

      if (dispatchCancelRef.current) break;

      const recipient = eligibleRecipients[index];
      executeSend(recipient, message);
      sentRecords.push({ recipientId: recipient.id, body: personalizeMessage(message, recipient) });
      setDispatchProgress({ current: index + 1, total: eligibleRecipients.length });

      if (index < eligibleRecipients.length - 1) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    setOpening(false);
    setDispatchProgress(null);
    saveSentMessageHistory(sentRecords);
    onSent?.(sentRecords);
    onClose();
  };

  const handleCancelDispatch = (): void => {
    dispatchCancelRef.current = true;
    setOpening(false);
    setDispatchProgress(null);
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

  const previewText = useMemo(() => {
    if (!message.trim() || !currentPreviewRecipient) return '';
    return personalizeMessage(message, currentPreviewRecipient);
  }, [message, currentPreviewRecipient]);

  const insertVariableTag = (tag: string): void => {
    setMessage((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const displayedRecipients = recipientTab === 'eligible' 
    ? eligibleRecipients 
    : recipientTab === 'skipped' 
    ? skippedRecipients 
    : validatedRecipients;

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
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {skippedCount} contact{skippedCount > 1 ? 's' : ''} skipped (missing or invalid {isEmail ? 'email address' : 'phone number'}).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRecipientTab('skipped')}
              className="text-[11px] font-semibold underline hover:opacity-80 flex-shrink-0"
            >
              View Skipped
            </button>
          </div>
        )}

        {/* Bulk Dispatch Progress Indicator & Controls */}
        {dispatchProgress && (
          <div className="p-3 border border-primary/30 bg-primary/5 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                {t('messaging.dispatchProgress', { current: String(dispatchProgress.current), total: String(dispatchProgress.total) })}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{Math.round((dispatchProgress.current / dispatchProgress.total) * 100)}%</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 text-xs"
                  onClick={() => setIsPaused((p) => !p)}
                  title={isPaused ? t('messaging.resume') : t('messaging.pause')}
                >
                  {isPaused ? <Play className="w-3 h-3 text-success" /> : <Pause className="w-3 h-3 text-warning" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={handleCancelDispatch}
                  title={t('messaging.cancelDispatch')}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Speed settings toggle for bulk campaigns */}
        {isBulk && !opening && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-primary" />
              {t('messaging.dispatchSpeed')}:
            </span>
            <div className="flex items-center gap-1">
              {(['safe', 'normal', 'express'] as DispatchSpeed[]).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setDispatchSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    dispatchSpeed === spd
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t(`messaging.speed.${spd}`)}
                </button>
              ))}
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

          {/* Dynamic tokens toolbar */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold me-1">{t('messaging.insertVariable')}:</span>
            {MESSAGING_VARIABLE_TOKENS.map(({ token, labelKey, fallbackExample }) => (
              <button
                key={token}
                type="button"
                onClick={() => insertVariableTag(token)}
                title={`Example: ${fallbackExample}`}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors"
              >
                {token}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/80 mb-2 italic flex items-center gap-1">
            <Info className="w-3 h-3 text-primary/70 inline flex-shrink-0" />
            {t('messaging.fallbackHint')}
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
              <ShieldCheck className="w-3 h-3 text-success" />
              {t('messaging.createPresetDesc')}
            </span>
            <div className="flex items-center gap-2 font-mono">
              {isSms && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  smsStats.isUnicode ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-muted text-foreground'
                }`}>
                  {smsStats.isUnicode ? 'Unicode' : 'GSM 7-bit'} • {smsStats.totalSegments} seg ({smsStats.remainingInSegment} left)
                </span>
              )}
              <span>{message.length} {t('contacts.whatsapp.chars')}</span>
            </div>
          </div>

          {isSms && smsStats.isUnicode && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
              ⚠️ {t('messaging.unicodeWarning')}
            </p>
          )}
        </div>

        {/* Live Personalization Interactive Mobile Chat Bubble Mockup */}
        {previewText && currentPreviewRecipient && (
          <div className="border border-border/80 rounded-xl p-3.5 bg-muted/20">
            <h5 className="text-[11px] font-bold text-muted-foreground mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-foreground">
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
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{channel}</span>
              </div>
            </h5>

            {isEmail ? (
              <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-2 shadow-xs">
                <div className="border-b border-border/50 pb-2 text-[11px]">
                  <div className="text-muted-foreground">
                    <span className="font-semibold text-foreground me-1">To:</span> {currentPreviewRecipient.name} &lt;{currentPreviewRecipient.email}&gt;
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground me-1">Subject:</span> {personalizeMessage(subject || 'Announcement', currentPreviewRecipient)}
                  </div>
                </div>
                <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {previewText}
                </div>
              </div>
            ) : isSms ? (
              <div className="max-w-[88%] p-3 rounded-2xl text-xs bg-info/10 text-foreground border border-info/20 rounded-tl-none space-y-1 shadow-xs">
                <div className="whitespace-pre-wrap leading-relaxed">{previewText}</div>
                <div className="flex items-center justify-between text-[9px] opacity-70 font-mono pt-1 border-t border-info/10">
                  <span>{currentPreviewRecipient.phone}</span>
                  <span>SMS • {smsStats.totalSegments} seg</span>
                </div>
              </div>
            ) : (
              <div className="max-w-[88%] p-3 rounded-2xl text-xs bg-emerald-500/10 dark:bg-emerald-950/40 text-foreground border border-emerald-500/20 rounded-tl-none space-y-1.5 shadow-xs">
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/15 pb-1 flex items-center justify-between">
                  <span>WhatsApp Broadcast</span>
                  <span>{currentPreviewRecipient.phone}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{previewText}</div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recipients listing & filter tabs */}
        {isBulk && recipients.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('messaging.confirmRecipients')} ({displayedRecipients.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRecipientTab('all')}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                    recipientTab === 'all' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t('messaging.filter.all')} ({validatedRecipients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientTab('eligible')}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                    recipientTab === 'eligible' ? 'bg-emerald-600 text-white font-bold' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t('messaging.filter.eligible')} ({eligibleRecipients.length})
                </button>
                {skippedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecipientTab('skipped')}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                      recipientTab === 'skipped' ? 'bg-amber-600 text-white font-bold' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('messaging.filter.skipped')} ({skippedCount})
                  </button>
                )}
              </div>
            </div>

            <ul className="space-y-1 max-h-36 overflow-y-auto border border-border/50 rounded-lg p-2 bg-muted/10">
              {displayedRecipients.map((recipient) => {
                const isItemEligible = recipient.isValid;
                const displayContactVal = recipient.address || (isEmail ? recipient.email : recipient.phone) || 'Missing';

                return (
                  <li 
                    key={recipient.id} 
                    className={`flex items-center gap-2 text-xs p-1.5 rounded transition-colors ${
                      !isItemEligible 
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' 
                        : previewIndex === eligibleRecipients.findIndex((e) => e.id === recipient.id)
                        ? 'bg-primary/10 text-foreground font-semibold' 
                        : 'text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
                    <span 
                      className="truncate cursor-pointer flex-1" 
                      onClick={() => {
                        const idx = eligibleRecipients.findIndex((e) => e.id === recipient.id);
                        if (idx >= 0) setPreviewIndex(idx);
                      }}
                    >
                      {recipient.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">({displayContactVal})</span>
                    {isItemEligible ? (
                      <Button
                        type="button"
                        variant="link"
                        className="ml-auto text-primary font-semibold hover:underline flex-shrink-0 h-auto p-0 text-[11px]"
                        onClick={() => executeSend(recipient, message)}
                      >
                        {isEmail ? t('messaging.sendEmail') : isSms ? t('contacts.openSmsApp') : t('contacts.whatsapp.open')}
                      </Button>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 ms-auto">
                        Skipped
                      </span>
                    )}
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
