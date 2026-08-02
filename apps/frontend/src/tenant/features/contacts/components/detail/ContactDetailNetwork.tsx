import { Search, Users as UsersIcon } from "lucide-react";
import { Contact, getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DETAIL_STYLES } from "./contactDetailStyles";

export interface ContactDetailNetworkProps {
  contact: Contact;
  allContacts: Contact[];
  onNavigateToContact: (targetId: string | number) => void;
}

type NetworkLink = {
  contactId: string;
  relationship?: string;
  inferred?: boolean;
};

/** Merge emergency + legacy relationship links; prefer non-inferred when both exist. */
function collectNetworkLinks(contact: Contact): NetworkLink[] {
  const byId = new Map<string, NetworkLink>();

  const add = (entry: { contactId?: string | number | null; relationship?: string; inferred?: boolean }) => {
    const contactId = entry.contactId == null ? "" : String(entry.contactId);
    if (!contactId.trim()) return;
    const existing = byId.get(contactId);
    if (existing && existing.inferred !== true && entry.inferred === true) return;
    byId.set(contactId, {
      contactId,
      relationship: entry.relationship || existing?.relationship,
      inferred: entry.inferred === true,
    });
  };

  for (const entry of contact.emergencyContacts ?? []) add(entry);
  for (const entry of contact.relationships ?? []) add(entry);

  return [...byId.values()];
}

export function ContactDetailNetwork({
  contact,
  allContacts,
  onNavigateToContact,
}: ContactDetailNetworkProps): JSX.Element {
  const { t } = useTranslation();
  const links = collectNetworkLinks(contact);

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${DETAIL_STYLES.networkHeader}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${DETAIL_STYLES.networkIcon}`}>
          <UsersIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-sm font-bold leading-none ${DETAIL_STYLES.networkTitle}`}>
            {links.length} {t("contacts.detail.relationships")}
          </h4>
          <p className={`text-xs font-medium mt-1 uppercase tracking-tight ${DETAIL_STYLES.networkSubtitle}`}>
            {t("contacts.detail.activeSocialGraph")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="text-center py-20">
            <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/20" />
            <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
              {t("contacts.detail.noConnectionsMapped")}
            </p>
          </div>
        ) : (
          links.map((relationship, relationshipIndex) => {
            const target = allContacts.find((c) => String(c.id) === String(relationship.contactId));
            const displayName = target
              ? getDisplayName(target)
              : t("contacts.detail.unknownContact");
            const relationshipLabel =
              formatContactOptionLabel(relationship.relationship, t) ||
              t("contacts.detail.emergencyContact");

            return (
              <Card
                key={`${relationship.contactId}-${relationshipIndex}`}
                className={`flex items-center justify-between gap-3 p-4 ${DETAIL_STYLES.networkItemCard}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    id={target?.id ?? relationship.contactId}
                    name={displayName}
                    avatar={target?.avatar}
                    className="w-10 h-10 rounded-xl text-xs flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-black uppercase tracking-widest mb-0.5 block ${DETAIL_STYLES.networkRelType}`}
                    >
                      {relationshipLabel}
                    </span>
                    <h5 className="text-sm font-bold text-foreground truncate">{displayName}</h5>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("contacts.detail.viewContact", { name: displayName })}
                  onClick={() => onNavigateToContact(target?.id ?? relationship.contactId)}
                  className={`rounded-lg transition-all shadow-none ${DETAIL_STYLES.networkItemAction}`}
                  type="button"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
