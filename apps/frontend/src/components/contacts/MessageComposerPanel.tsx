import React, { useState } from 'react';
import { MessageCircle, MessageSquare, User } from 'lucide-react';
import { Contact, getPrimaryPhone, Message } from '@mms/shared';
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

interface MessageComposerPanelProps {
  channel: 'sms' | 'whatsapp';
  contacts: Contact[];
  onClose: () => void;
}

/**
 * Unified Message Composer for SMS and WhatsApp.
 */
export default function MessageComposerPanel({
  channel,
  contacts,
  onClose,
}: MessageComposerPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { whatsappTemplates } = useContactConfig();

  const isBulk = contacts.length > 1;
  const eligibleContacts = contacts.filter((contact) => Boolean(getPrimaryPhone(contact)));
  
  const [template, setTemplate] = useState<string>(() => whatsappTemplates[0]?.id || 'custom');
  const [message, setMessage] = useState<string>(() => whatsappTemplates[0]?.body || '');
  const [opening, setOpening] = useState<boolean>(false);

  const handleTemplateChange = (id: string): void => {
    setTemplate(id);
    const selectedTemplate = whatsappTemplates.find((templateOption) => templateOption.id === id);
    if (selectedTemplate && selectedTemplate.id !== 'custom') setMessage(selectedTemplate.body);
  };

  const openForContact = (contact: Contact, messageBody: string): void => {
    const phone = getPrimaryPhone(contact);
    if (!phone) {
      notify.error(t('contacts.smsNoPhone'));
      return;
    }
    if (!messageBody.trim()) {
      notify.error(t('contacts.smsMessageRequired'));
      return;
    }

    let success = false;
    if (channel === 'sms') {
      const opened = openDeviceSmsComposer(phone, messageBody);
      if (!opened) {
        notify.error(t('contacts.smsOpenFailed'));
      } else {
        success = true;
      }
    } else {
      const cleanNum = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(messageBody)}`, '_blank');
      success = true;
    }

    if (success && user) {
      const dbKey = `messages_u:${user.id}`;
      const newMsg: Message = {
        id: crypto.randomUUID(),
        userId: user.id,
        contactId: contact.id,
        channel,
        body: messageBody,
        sentAt: new Date().toISOString(),
      };
      const currentMsgs = getCollection<Message>(dbKey);
      saveCollection(dbKey, [newMsg, ...currentMsgs]);
    }
  };

  const handleSendAll = (): void => {
    if (eligibleContacts.length === 0 || !message.trim()) return;

    if (channel === 'sms') {
      eligibleContacts.forEach((c) => openForContact(c, message));
    } else {
      if (eligibleContacts.length === 1) {
        openForContact(eligibleContacts[0], message);
        onClose();
        return;
      }
      setOpening(true);
      eligibleContacts.forEach((contact, index) => {
        window.setTimeout(() => {
          openForContact(contact, message);
          if (index === eligibleContacts.length - 1) {
            setOpening(false);
            onClose();
          }
        }, index * 500);
      });
      return;
    }
    onClose();
  };

  // Channel-specific properties
  const isSms = channel === 'sms';
  const Icon = isSms ? MessageSquare : MessageCircle;

  const title = isBulk
    ? isSms ? t('contacts.bulkSmsMessage') : t('contacts.whatsapp.bulkTitle')
    : isSms
      ? `${t('contacts.sms')} – ${contacts[0]?.name}`
      : t('contacts.whatsapp.singleTitle', { name: contacts[0]?.name ?? '' });

  const subtitle = isBulk
    ? isSms
      ? `${eligibleContacts.length} ${t('contacts.of')} ${contacts.length} ${t('contacts.contactsHavePhone')}`
      : `${eligibleContacts.length} ${t('contacts.of')} ${contacts.length} ${t('contacts.whatsapp.contactsHaveWhatsapp')}`
    : undefined;

  const note = isSms ? t('contacts.smsManualSendNote') : t('contacts.whatsapp.bulkManualNote');
  
  const saveLabel = opening
    ? t('contacts.whatsapp.openingTabs')
    : isSms
      ? t('contacts.openSmsApp')
      : isBulk
        ? `${t('contacts.whatsapp.openAll')} (${eligibleContacts.length})`
        : t('contacts.whatsapp.open');

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
      saveDisabled={opening || eligibleContacts.length === 0 || !message.trim()}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {note}
        </p>
        {whatsappTemplates.length > 0 && (
          <div>
            <label className={FORM_LABEL} htmlFor="messageTemplate">
              {t('contacts.messageTemplate')}
            </label>
            <FormSelect
              id="messageTemplate"
              value={template}
              onChange={handleTemplateChange}
              options={whatsappTemplates.map((tpl) => ({ value: tpl.id, label: tpl.label }))}
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
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {message.length} {t('contacts.whatsapp.chars')}
          </p>
        </div>
        {isBulk && eligibleContacts.length > 0 && (
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {eligibleContacts.map((contact) => (
              <li key={contact.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{contact.name || contact.firstName}</span>
                <Button
                  type="button"
                  variant="link"
                  className="ml-auto text-primary font-semibold hover:underline flex-shrink-0 h-auto p-0"
                  onClick={() => openForContact(contact, message)}
                >
                  {isSms ? t('contacts.openSmsApp') : t('contacts.whatsapp.open')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {isBulk && eligibleContacts.length === 0 && (
          <p className="text-xs text-destructive font-medium">
            {isSms ? t('contacts.smsNoEligibleContacts') : t('contacts.whatsapp.skippedNote')}
          </p>
        )}
      </div>
    </FormModal>
  );
}
