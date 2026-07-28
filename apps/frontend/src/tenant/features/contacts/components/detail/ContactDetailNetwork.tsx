import { Search, Users as UsersIcon } from "lucide-react";
import { Contact, getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DETAIL_STYLES } from "./contactDetailStyles";

export interface ContactDetailNetworkProps {
  contact: Contact;
  allContacts: Contact[];
  onNavigateToContact: (targetId: string | number) => void;
}

export function ContactDetailNetwork({
  contact,
  allContacts,
  onNavigateToContact,
}: ContactDetailNetworkProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${DETAIL_STYLES.networkHeader}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${DETAIL_STYLES.networkIcon}`}>
          <UsersIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-sm font-bold leading-none ${DETAIL_STYLES.networkTitle}`}>{contact.relationships?.length || 0} {t('contacts.detail.relationships')}</h4>
          <p className={`text-[10px] font-medium mt-1 uppercase tracking-tight ${DETAIL_STYLES.networkSubtitle}`}>{t('contacts.detail.activeSocialGraph')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {(!contact.relationships || contact.relationships.length === 0) ? (
          <div className="text-center py-20">
            <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/20" />
            <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">{t('contacts.detail.noConnectionsMapped')}</p>
          </div>
        ) : (
          contact.relationships.map((relationship, relationshipIndex) => {
            const target = allContacts.find((c) => String(c.id) === String(relationship.contactId));
            return (
              <Card key={relationshipIndex} className={`flex items-center justify-between gap-3 p-4 ${DETAIL_STYLES.networkItemCard}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    id={target?.id ?? relationship.contactId}
                    name={target ? getDisplayName(target) : "?"}
                    avatar={target?.avatar}
                    className="w-10 h-10 rounded-xl text-xs flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 block ${DETAIL_STYLES.networkRelType}`}>{relationship.relationship}</span>
                    <h5 className="text-sm font-bold text-foreground truncate">{target ? getDisplayName(target) : `${t('contacts.table.contactIdPrefix')}${relationship.contactId}`}</h5>
                  </div>
                </div>
                {target && (
                  <Button
                    variant="ghost"
                    aria-label={t('contacts.detail.viewContact', { name: getDisplayName(target) })}
                    onClick={() => onNavigateToContact(relationship.contactId)}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all shadow-none ${DETAIL_STYLES.networkItemAction}`}
                    type="button"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
