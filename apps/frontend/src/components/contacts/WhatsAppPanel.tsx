import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Send, User, Check, Loader2 } from "lucide-react";

import { hasWhatsApp, getPrimaryPhone, Contact } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import { FormSelect } from "./form/FormPrimitives";

interface WhatsAppPanelProps {
  contacts: Contact[];
  onClose: () => void;
}


/**
 * WhatsAppPanel component for sending WhatsApp messages to single/multiple contacts.
 * @param props Component properties.
 * @returns React element.
 */
export default function WhatsAppPanel({ contacts, onClose }: WhatsAppPanelProps): React.JSX.Element {
  const { whatsappTemplates, uiStrings } = useContactConfig();
  useBodyScrollLock();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative bg-card/85 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl w-full max-w-md z-10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0 text-left" style={{ backgroundColor: uiStrings.whatsappColor || "#075E54", color: "white" }}>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h2 className="text-sm font-bold">
                {isBulk ? (uiStrings.bulkWhatsappMessage || "Bulk WhatsApp Message") : `WhatsApp – ${contacts[0]?.name}`}
              </h2>
              <p className="text-[11px] text-white/70">
                {isBulk
                  ? `${waContacts.length} ${uiStrings.of || "of"} ${contacts.length} ${uiStrings.contactsHaveWhatsapp || "contacts have WhatsApp"}`
                  : getPrimaryPhone(contacts[0]) || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label={uiStrings.closePanel || "Close panel"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto overscroll-contain flex-1 text-left">
          {/* Recipients */}
          {isBulk && (
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">{uiStrings.recipients || "Recipients"}</span>
              <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/50 max-h-32 overflow-y-auto">
                {contacts.map((c) => {
                  const hasWa = hasWhatsApp(c);
                  return (
                    <div key={c.id} className="flex items-center gap-2.5 px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-[13px] text-foreground flex-1 truncate">{c.name}</span>
                      {hasWa ? (
                        <span className="text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                          WA
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">{uiStrings.noWhatsapp || "No WA"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Template picker */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block" htmlFor="waTemplate">{uiStrings.template || "Template"}</label>
            <FormSelect
              id="waTemplate"
              value={template}
              onChange={handleTemplateChange}
              options={whatsappTemplates.map((t) => ({ value: t.id, label: t.label }))}
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block" htmlFor="waMessage">{uiStrings.message || "Message"}</label>
            <textarea
              id="waMessage"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setTemplate("custom");
              }}
              rows={6}
              placeholder={uiStrings.typeMessagePlaceholder || "Type your message here..."}
              className="w-full px-3.5 py-3 rounded-xl border border-border text-sm bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ "--tw-ring-color": uiStrings.whatsappColor } as React.CSSProperties}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">{message.length} {uiStrings.chars || "chars"}</p>
          </div>

          {/* Warning if some have no WA */}
          {isBulk && waContacts.length < contacts.length && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-2.5">
              <p className="text-xs text-warning">
                {contacts.length - waContacts.length} {uiStrings.withoutWhatsappWillBeSkipped || "contact(s) without WhatsApp will be skipped."}
              </p>
            </div>
          )}

          {/* Success */}
          <AnimatePresence>
            {sent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl px-4 py-3 text-success"
              >
                <Check className="w-4 h-4 text-success" />
                <p className="text-sm font-medium text-success">
                  {uiStrings.messagesQueuedFor || "Messages queued for"} {waContacts.length} {uiStrings.contactsLabel || "contacts"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0 bg-card">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {uiStrings.cancel || "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || sending || sent || waContacts.length === 0}
            className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: sending || sent ? (uiStrings.whatsappColorHover || "#128C7E") : (uiStrings.whatsappColor || "#075E54") }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>
              {sending ? (uiStrings.sending || "Sending…") : sent ? (uiStrings.sent || "Sent!") : isBulk ? `${uiStrings.sendTo || "Send to"} ${waContacts.length}` : (uiStrings.openWhatsapp || "Open WhatsApp")}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
