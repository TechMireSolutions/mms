import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";

import { hasWhatsApp, getPrimaryPhone, Contact } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
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
  const { whatsappTemplates, uiStrings } = useContactConfig();
  const isBulk = contacts.length > 1;
  const [template, setTemplate] = useState<string>(() => whatsappTemplates[0]?.id || "custom");
  const [message, setMessage] = useState<string>(() => whatsappTemplates[0]?.body || "");
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const waContacts = contacts.filter((c) => hasWhatsApp(c));

  const handleTemplateChange = (id: string): void => {
    setTemplate(id);
    const t = whatsappTemplates.find((x) => x.id === id);
    if (t && t.id !== "custom") setMessage(t.body);
  };

  const buildWaUrl = (contact: Contact): string => {
    const phone = getPrimaryPhone(contact);
    if (!phone) return "";
    const cleanNum = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  };

  const handleSend = async (): Promise<void> => {
    if (waContacts.length === 1) {
      window.open(buildWaUrl(waContacts[0]), "_blank");
      onClose();
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  const title = isBulk
    ? (uiStrings.bulkWhatsappMessage || "Bulk WhatsApp Message")
    : `WhatsApp – ${contacts[0]?.name}`;

  const subtitle = isBulk
    ? `${waContacts.length} ${uiStrings.of || "of"} ${contacts.length} ${uiStrings.contactsHaveWhatsapp || "contacts have WhatsApp"}`
    : getPrimaryPhone(contacts[0]) || "";

  const saveLabel = sending
    ? (uiStrings.sending || "Sending…")
    : sent
      ? (uiStrings.sent || "Sent!")
      : isBulk
        ? `${uiStrings.sendTo || "Send to"} ${waContacts.length}`
        : (uiStrings.openWhatsapp || "Open WhatsApp");

  return (
    <FormModal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={MessageCircle}
      size="md"
      cancelLabel={uiStrings.cancel || "Cancel"}
      saveLabel={saveLabel}
      onSave={() => void handleSend()}
      saving={sending}
      saveDisabled={!message.trim() || sending || sent || waContacts.length === 0}
    >
      <div className="space-y-4">
        {isBulk ? (
          <div>
            <span className={FORM_LABEL}>{uiStrings.recipients || "Recipients"}</span>
            <div className="mt-1.5 max-h-32 divide-y divide-border/50 overflow-y-auto rounded-xl border border-border bg-muted/20">
              {contacts.map((contact) => {
                const hasWa = hasWhatsApp(contact);
                return (
                  <div key={contact.id} className="flex items-center gap-2.5 px-3 py-2">
                    <div className={`h-2 w-2 rounded-full ${hasWa ? "bg-success" : "bg-muted-foreground/30"}`} />
                    <span className={`text-sm ${hasWa ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {contact.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <label className={FORM_LABEL} htmlFor="waTemplate">{uiStrings.template || "Template"}</label>
          <FormSelect
            id="waTemplate"
            value={template}
            onChange={handleTemplateChange}
            options={whatsappTemplates.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="waMessage">{uiStrings.message || "Message"}</label>
          <textarea
            id="waMessage"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setTemplate("custom");
            }}
            rows={6}
            placeholder={uiStrings.typeMessagePlaceholder || "Type your message here..."}
            className={FORM_TEXTAREA}
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {message.length} {uiStrings.chars || "chars"}
          </p>
        </div>

        {isBulk && waContacts.length < contacts.length ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5">
            <p className="text-xs text-warning">
              {contacts.length - waContacts.length} {uiStrings.withoutWhatsappWillBeSkipped || "contact(s) without WhatsApp will be skipped."}
            </p>
          </div>
        ) : null}

        <AnimatePresence>
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-success"
            >
              <Check className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-success">
                {uiStrings.messagesQueuedFor || "Messages queued for"} {waContacts.length} {uiStrings.contactsLabel || "contacts"}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </FormModal>
  );
}
