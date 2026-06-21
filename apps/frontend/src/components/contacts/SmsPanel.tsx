import React, { useState } from 'react';
import { MessageSquare, User } from 'lucide-react';
import { Contact, getPrimaryPhone } from '@mms/shared';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { openDeviceSmsComposer } from '@/lib/deviceSms';
import { notify } from '@/lib/notify';
import FormModal from '@/components/ui/FormModal';
import { FormSelect } from './form/FormPrimitives';
import { FORM_LABEL, FORM_TEXTAREA } from '@/components/ui/formStyles';
import useTranslation from '@/hooks/useTranslation';

interface SmsPanelProps {
  contacts: Contact[];
  onClose: () => void;
}

/**
 * Opens the device SMS app with a chosen message — user sends manually.
 */
export default function SmsPanel({ contacts, onClose }: SmsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { whatsappTemplates } = useContactConfig();

  const isBulk = contacts.length > 1;
  const smsContacts = contacts.filter((contact) => Boolean(getPrimaryPhone(contact)));
  const [template, setTemplate] = useState<string>(() => whatsappTemplates[0]?.id || 'custom');
  const [message, setMessage] = useState<string>(() => whatsappTemplates[0]?.body || '');

  const handleTemplateChange = (id: string): void => {
    setTemplate(id);
    const picked = whatsappTemplates.find((x) => x.id === id);
    if (picked && picked.id !== 'custom') setMessage(picked.body);
  };

  const openForContact = (contact: Contact): void => {
    const phone = getPrimaryPhone(contact);
    if (!phone) {
      notify.error(t('contacts.smsNoPhone'));
      return;
    }
    if (!message.trim()) {
      notify.error(t('contacts.smsMessageRequired'));
      return;
    }
    const opened = openDeviceSmsComposer(phone, message);
    if (!opened) {
      notify.error(t('contacts.smsOpenFailed'));
      return;
    }
    if (!isBulk) onClose();
  };

  const title = isBulk
    ? t('contacts.bulkSmsMessage')
    : `${t('contacts.sms')} – ${contacts[0]?.name}`;

  const subtitle = isBulk
    ? `${smsContacts.length} ${t('contacts.of')} ${contacts.length} ${t('contacts.contactsHavePhone')}`
    : undefined;

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={MessageSquare}
      cancelLabel={t('common.cancel')}
      saveLabel={t('contacts.openSmsApp')}
      onSave={() => {
        if (isBulk) smsContacts.forEach(openForContact);
        else if (contacts[0]) openForContact(contacts[0]);
      }}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('contacts.smsManualSendNote')}
        </p>
        {whatsappTemplates.length > 0 && (
          <div>
            <label className={FORM_LABEL} htmlFor="smsTemplate">
              {t('contacts.messageTemplate')}
            </label>
            <FormSelect
              id="smsTemplate"
              value={template}
              onChange={handleTemplateChange}
              options={whatsappTemplates.map((tpl) => ({ value: tpl.id, label: tpl.label }))}
            />
          </div>
        )}
        <div>
          <label className={FORM_LABEL} htmlFor="smsMessage">{t('contacts.messageBody')}</label>
          <textarea
            id="smsMessage"
            className={FORM_TEXTAREA}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('contacts.smsMessagePlaceholder')}
          />
        </div>
        {isBulk && smsContacts.length > 0 && (
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {smsContacts.map((contact) => (
              <li key={contact.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{contact.name || contact.firstName}</span>
                <button
                  type="button"
                  className="ml-auto text-primary font-semibold hover:underline flex-shrink-0"
                  onClick={() => openForContact(contact)}
                >
                  {t('contacts.openSmsApp')}
                </button>
              </li>
            ))}
          </ul>
        )}
        {isBulk && smsContacts.length === 0 && (
          <p className="text-xs text-destructive font-medium">
            {t('contacts.smsNoEligibleContacts')}
          </p>
        )}
      </div>
    </FormModal>
  );
}
