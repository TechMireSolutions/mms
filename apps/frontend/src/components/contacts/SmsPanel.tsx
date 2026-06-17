import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, Send, User } from 'lucide-react';
import { Contact, getPrimaryPhone } from '@mms/shared';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { openDeviceSmsComposer } from '@/lib/deviceSms';
import { notify } from '@/lib/notify';
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
  useBodyScrollLock();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/85 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4 text-left">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <h2 className="text-sm font-bold">
                {isBulk
                  ? c('bulkSmsMessage')
                  : `${c('sms')} – ${contacts[0]?.name}`}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {isBulk
                  ? `${smsContacts.length} ${c('of')} ${contacts.length} ${c('contactsHavePhone')}`
                  : getPrimaryPhone(contacts[0]) || ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={c('cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {c('smsManualSendNote')}
          </p>

          {whatsappTemplates.length > 0 && (
            <div>
              <label
                className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor="smsTemplate"
              >
                {c('messageTemplate')}
              </label>
              <FormSelect
                id="smsTemplate"
                value={template}
                onChange={handleTemplateChange}
                options={whatsappTemplates.map((tpl) => ({ value: tpl.id, label: tpl.label }))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className={FORM_LABEL}>{c('messageBody')}</label>
            <textarea
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
          ) : (
            <button
              type="button"
              disabled={!getPrimaryPhone(contacts[0]) || !message.trim()}
              onClick={() => openForContact(contacts[0])}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              {c('openSmsApp')}
            </button>
          )}
        </div>

        {isBulk && smsContacts.length === 0 && (
          <p className="px-6 pb-5 text-center text-xs text-muted-foreground">
            <User className="mx-auto mb-1 h-4 w-4 opacity-50" aria-hidden />
            {c('smsNoEligibleContacts')}
          </p>
        )}
      </motion.div>
    </div>
  );
}
