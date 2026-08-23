import { BrainCircuit } from "lucide-react";
import { type Contact, getDisplayName, getContactTags } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactIdentityMeta } from "../ContactIdentityMeta";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { Badge } from "@/components/ui/badge";
import { getGenderCardAccent } from "@/lib/genderUi";

export function ContactDetailOverviewHero({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element {
  const { t } = useTranslation();
  const aiSummary = typeof contact.aiSummary === "string" ? contact.aiSummary.trim() : "";
  const contactTags = getContactTags(contact);

  return (
    <>
      <PersonDetailHeroCard
        id={contact.id}
        displayName={getDisplayName(contact)}
        avatar={contact.avatar}
        accentColor={getGenderCardAccent(contact.gender)}
      >
        <ContactIdentityMeta gender={contact.gender} isSyed={contact.isSyed} size="md" />
        {contactTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {contactTags.map((tag) => (
              <Badge
                key={tag}
                pill
                variant="outline"
                className="px-2 py-0.5 text-xs font-medium border-primary/30 text-primary bg-primary/5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
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
