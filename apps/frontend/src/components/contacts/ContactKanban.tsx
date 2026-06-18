import React from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Edit2, Trash2, MessageCircle, MessageSquare, Star } from "lucide-react";
import { getPrimaryPhone, getPrimaryEmail, hasWhatsApp, getDisplayName, Contact, FieldConfig } from "@mms/shared";
import { useContactConfig, calculateProfileHealth } from '@/lib/contexts/ContactConfigContext';
import { EditableSelect } from "./form/FormPrimitives";

import ContactAvatar from "./ContactAvatar";

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  onStageChange: (id: string | number, newStage: string) => void;
}

/**
 * Individual ContactCard component.
 */
function ContactCard({ contact, onEdit, onDelete, onWhatsApp, onSms, onStageChange }: ContactCardProps): React.JSX.Element {
  const { lifecycleStages, updateLifecycleStages, uiStrings } = useContactConfig();
  const phone = getPrimaryPhone(contact);
  const email = getPrimaryEmail(contact);
  const hasWA = hasWhatsApp(contact);
  const health = calculateProfileHealth(contact);
  const rating = contact.rating || 0;

  const handleDelete = (): void => {
    onDelete(contact.id);
  };

  const handleWhatsApp = (): void => {
    onWhatsApp([contact]);
  };

  const handleEdit = (): void => {
    onEdit(contact);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-3 space-y-3 hover:shadow-md hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ContactAvatar contact={contact} />
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">{getDisplayName(contact)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border`}>
                {uiStrings.profileHealth}: {health}%
              </span>
              {rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className={`w-2.5 h-2.5 ${uiStrings?.starActiveClass?.replace(/[wh]-\d+(\.\d+)?/g, "") || "text-warning fill-warning"}`} />
                  <span className={`text-[9px] font-bold ${uiStrings?.starActiveClass?.includes("text-") ? uiStrings.starActiveClass.match(/text-[a-z0-9-]+/)?.[0] : "text-warning"}`}>{rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            type="button"
            aria-label={uiStrings.editContactAria}
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${uiStrings?.deleteActionClass || "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
            type="button"
            aria-label={uiStrings.deleteContactAria}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        {phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground font-mono truncate">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{email}</span>
          </div>
        )}
      </div>

      {/* Stage Mover Selector */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase">{uiStrings.moveToLabel}</span>
        <EditableSelect
          options={lifecycleStages || []}
          value={contact.lifecycleStage || uiStrings.defaultLifecycleStage}
          onChange={(val) => onStageChange(contact.id, val)}
          onUpdateOptions={updateLifecycleStages}
          placeholder={uiStrings.moveToPlaceholder}
          className="w-28"
        />
      </div>

      {phone && (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            disabled={!hasWA}
            onClick={handleWhatsApp}
            className={`flex min-h-[44px] items-center justify-center gap-1 rounded-lg text-[11px] font-semibold text-white transition-all ${
              hasWA
                ? "cursor-pointer opacity-100"
                : "cursor-not-allowed bg-muted/60 text-muted-foreground opacity-40"
            }`}
            style={{ backgroundColor: hasWA ? (uiStrings.whatsappColor || "#075E54") : "hsl(var(--muted))" }}
            type="button"
          >
            <MessageCircle className="w-3 h-3" /> {uiStrings.whatsapp}
          </button>
          <button
            onClick={() => onSms([contact])}
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary transition-all hover:bg-primary/15 dark:border-primary/30 dark:bg-primary/20 dark:text-primary"
            type="button"
          >
            <MessageSquare className="w-3 h-3" /> {uiStrings.sms}
          </button>
        </div>
      )}
    </motion.div>
  );
}

interface ContactKanbanProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  onStageChange: (id: string | number, newStage: string) => void;
  fieldConfig?: FieldConfig;
}

/**
 * ContactKanban component to display contacts grouped by CRM lifecycle stage in Kanban layout.
 *
 * @returns React.JSX.Element
 */
export default function ContactKanban({
  contacts,
  onEdit,
  onDelete,
  onWhatsApp,
  onSms,
  onStageChange,
  fieldConfig,
}: ContactKanbanProps): React.JSX.Element {
  const { lifecycleStages, lifecycleColors, uiStrings } = useContactConfig();
  const grouped = (lifecycleStages || []).reduce<Record<string, Contact[]>>((acc, stage) => {
    acc[stage] = contacts.filter((c) => (c.lifecycleStage || uiStrings.defaultLifecycleStage || "Lead") === stage);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
      {(lifecycleStages || []).map((stage) => {
        const colors = lifecycleColors[stage] || { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground", border: "border-border" };
        const list = grouped[stage] || [];
        return (
          <div key={stage} className="flex-shrink-0 w-72 flex flex-col bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-3 min-h-[500px] shadow-sm">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${colors.bg} mb-3 shadow-sm`}>
              <span className="text-[12px] font-bold tracking-wide">{stage}</span>
              <span className="text-[11px] font-bold text-muted-foreground bg-background border border-border/80 w-5 h-5 flex items-center justify-center rounded-full">
                {list.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-0.5 max-h-[calc(100vh-320px)]">
              {list.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground text-[11px]">
                  {uiStrings.noContactsInStage}
                </div>
              ) : (
                list.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onWhatsApp={onWhatsApp}
                    onSms={onSms}
                    onStageChange={onStageChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
