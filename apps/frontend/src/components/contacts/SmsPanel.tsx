import React, { useState } from 'react';
import { MessageSquare, User } from 'lucide-react';
import { Contact, getPrimaryPhone } from '@mms/shared';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { openDeviceSmsComposer } from '@/lib/deviceSms';
import { notify } from '@/lib/notify';
import FormModal from '@/components/ui/FormModal';
import { FormSelect } from './form/FormPrimitives';
import { FORM_LABEL, FORM_TEXTAREA } from '@/components/ui/formStyles';
import { useContactCopy } from '@/hooks/useContactCopy';

interface SmsPanelProps {
  contacts: Contact[];
  onClose: () => void;
}

/**
 * Opens the device SMS app with a chosen message — user sends manually.
 */
export default function SmsPanel({ contacts, onClose }: SmsPanelProps): React.JSX.Element {
  const c = useContactCopy();
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
      notify.error(c('smsNoPhone'));
      return;
    }
    if (!message.trim()) {
      notify.error(c('smsMessageRequired'));
      return;
    }
    const opened = openDeviceSmsComposer(phone, message);
    if (!opened) {
      notify.error(c('smsOpenFailed'));
      return;
    }
    if (!isBulk) onClose();
  };

  const title = isBulk
    ? c('bulkSmsMessage')
    : `${c('sms')} – ${contacts[0]?.name}`;

  const subtitle = isBulk
    ? `${smsContacts.length} ${c('of')} ${contacts.length} ${c('contactsHavePhone')}`
    : getPrimaryPhone(contacts[0]) || '';

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={MessageSquare}
      size="md"
      cancelLabel={c('cancel')}
      saveLabel={c('openSmsApp')}
      onSave={() => {
        if (!isBulk) openForContact(contacts[0]);
      }}
      saveDisabled={isBulk || !getPrimaryPhone(contacts[0]) || !message.trim()}
    >
      <div className="space-y-4">
        <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {c('smsManualSendNote')}
        </p>

        {whatsappTemplates.length > 0 ? (
          <div>
            <label className={FORM_LABEL} htmlFor="smsTemplate">
              {c('messageTemplate')}
            </label>
            <FormSelect
              id="smsTemplate"
              value={template}
              onChange={handleTemplateChange}
              options={whatsappTemplates.map((tpl) => ({ value: tpl.id, label: tpl.label }))}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className={FORM_LABEL} htmlFor="smsMessage">{c('messageBody')}</label>
          <textarea
            id="smsMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className={FORM_TEXTAREA}
            placeholder={c('smsMessagePlaceholder')}
          />
        </div>

        {isBulk ? (
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {smsContacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{getPrimaryPhone(contact)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openForContact(contact)}
                  className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {c('openSmsApp')}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {isBulk && smsContacts.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            <User className="mx-auto mb-1 h-4 w-4 opacity-50" aria-hidden />
            {c('smsNoEligibleContacts')}
          </p>
        ) : null}
      </div>
    </FormModal>
  );
}
