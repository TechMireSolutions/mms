import { BrainCircuit } from "lucide-react";
import { Contact, getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactIdentityMeta } from "../ContactIdentityMeta";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function ContactDetailOverviewHero({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element {
  const { t } = useTranslation();
  const aiSummary = typeof contact.aiSummary === "string" ? contact.aiSummary.trim() : "";

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-xs">
        <UserAvatar
          id={contact.id}
          name={getDisplayName(contact)}
          avatar={contact.avatar}
          className="w-16 h-16 rounded-2xl text-2xl shadow-xs"
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground truncate leading-tight">
            {getDisplayName(contact)}
          </p>
          <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} size="md" className="mt-1.5" />
        </div>
      </div>

      {aiSummary ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-primary">
            <BrainCircuit className="w-3.5 h-3.5" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-widest">
              {t("contacts.detail.aiIntelligence")}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-foreground leading-relaxed italic relative">
            {aiSummary}
          </div>
        </div>
      ) : null}
    </>
  );
}
