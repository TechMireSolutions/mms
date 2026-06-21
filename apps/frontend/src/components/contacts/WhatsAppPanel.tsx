import React, { useState } from "react";
import { MessageCircle } from "lucide-react";

import { hasWhatsApp, getPrimaryPhone, Contact } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from '@/hooks/useTranslation';
import FormModal from "@/components/ui/FormModal";
import { FormSelect } from "./form/FormPrimitives";
import { FORM_LABEL, FORM_TEXTAREA } from "@/components/ui/formStyles";

interface WhatsAppPanelProps {
  contacts: Contact[];
  onClose: () => void;
}

/**
 * WhatsAppPanel component for sending WhatsApp messages to single/multiple contacts.
 */
export default function WhatsAppPanel({ contacts, onClose }: WhatsAppPanelProps): React.JSX.Element {
  const { whatsappTemplates } = useContactConfig();
  const { t } = useTranslation();
  const isBulk = contacts.length > 1;
  const [template, setTemplate] = useState<string>(() => whatsappTemplates[0]?.id || "custom");
  const [message, setMessage] = useState<string>(() => whatsappTemplates[0]?.body || "");
  const [opening, setOpening] = useState<boolean>(false);

  const waContacts = contacts.filter((contact) => hasWhatsApp(contact));

  const handleTemplateChange = (id: string): void => {
    setTemplate(id);
    const tpl = whatsappTemplates.find((x) => x.id === id);
    if (tpl && tpl.id !== "custom") setMessage(tpl.body);
  };

  const buildWaUrl = (contact: Contact): string => {
    const phone = getPrimaryPhone(contact);
    if (!phone) return "";
    const cleanNum = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  };

  const handleSend = (): void => {
    if (waContacts.length === 0 || !message.trim()) return;

    if (waContacts.length === 1) {
      window.open(buildWaUrl(waContacts[0]), "_blank");
      onClose();
      return;
    }

    setOpening(true);
    waContacts.forEach((contact, index) => {
      window.setTimeout(() => {
        window.open(buildWaUrl(contact), "_blank");
        if (index === waContacts.length - 1) {
          setOpening(false);
          onClose();
        }
      }, index * 500);
    });
  };

  const title = isBulk
    ? t('contacts.whatsapp.bulkTitle')
    : t('contacts.whatsapp.singleTitle', { name: contacts[0]?.name ?? '' });

  const subtitle = isBulk
    ? `${waContacts.length} ${t('contacts.of')} ${contacts.length} ${t('contacts.whatsapp.contactsHaveWhatsapp')}`
    : undefined;

  const saveLabel = opening
    ? t('contacts.whatsapp.openingTabs')
    : isBulk
      ? `${t('contacts.whatsapp.openAll')} (${waContacts.length})`
      : t('contacts.whatsapp.open');

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={MessageCircle}
      cancelLabel={t('common.cancel')}
      saveLabel={saveLabel}
      onSave={handleSend}
      saveDisabled={opening || waContacts.length === 0 || !message.trim()}
    >
      <div className="space-y-4">
        {isBulk && (
          <>
            <p className="text-xs text-muted-foreground">{t('contacts.whatsapp.bulkManualNote')}</p>
            <div>
              <span className={FORM_LABEL}>{t('contacts.whatsapp.recipients')}</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {waContacts.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold border border-success/20"
                  >
                    <MessageCircle className="w-2.5 h-2.5" /> {c.name || c.firstName}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        <div>
          <label className={FORM_LABEL} htmlFor="waTemplate">{t('contacts.whatsapp.template')}</label>
          <FormSelect
            id="waTemplate"
            value={template}
            onChange={handleTemplateChange}
            options={whatsappTemplates.map((tpl) => ({ value: tpl.id, label: tpl.label }))}
          />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="waMessage">{t('contacts.whatsapp.message')}</label>
          <textarea
            id="waMessage"
            className={FORM_TEXTAREA}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('contacts.whatsapp.typeMessagePlaceholder')}
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {message.length} {t('contacts.whatsapp.chars')}
          </p>
        </div>
        {isBulk && contacts.length > waContacts.length && (
          <p className="text-[10px] text-warning font-medium">
            {contacts.length - waContacts.length} {t('contacts.whatsapp.skippedNote')}
          </p>
        )}
      </div>
    </FormModal>
  );
}

