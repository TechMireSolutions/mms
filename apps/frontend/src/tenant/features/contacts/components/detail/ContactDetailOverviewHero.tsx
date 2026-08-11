import { BrainCircuit } from "lucide-react";
import { Contact, getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactIdentityMeta } from "../ContactIdentityMeta";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";

export function ContactDetailOverviewHero({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element {
  const { t } = useTranslation();
  const aiSummary = typeof contact.aiSummary === "string" ? contact.aiSummary.trim() : "";

  return (
    <>
      <PersonDetailHeroCard
        id={contact.id}
        displayName={getDisplayName(contact)}
        avatar={contact.avatar}
      >
        <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} size="md" />
      </PersonDetailHeroCard>

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
