import type { Contact } from "@mms/shared";
import { getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { DETAIL_STYLES } from "./contactDetailStyles";
import { DetailSection } from "./ContactDetailShared";

export function ContactDetailEmergencySection({
  contact,
  allContacts,
  onNavigateToContact,
}: {
  contact: Contact;
  allContacts: Contact[];
  onNavigateToContact: (targetId: string | number) => void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const rows = contact.emergencyContacts;
  if (!rows || rows.length === 0) return null;

  return (
    <DetailSection title={t("contacts.detail.emergency")}>
      {rows.map((emergencyContact, emergencyContactIndex) => {
        const target = allContacts.find((c) => String(c.id) === String(emergencyContact.contactId));
        return (
          <div key={emergencyContactIndex} className="p-3 border-b border-border/50 last:border-b-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${DETAIL_STYLES.emergencyBadge}`}>
                {t("contacts.detail.emergencyContact")}
              </span>
            </div>
            <div className="text-xs space-y-1">
              {emergencyContact.relationship ? (
                <>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                    {t("contacts.fields.relationship")}
                  </span>
                  <span className="font-semibold text-foreground block">
                    {formatContactOptionLabel(emergencyContact.relationship, t)}
                  </span>
                </>
              ) : null}
              <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                {t("contacts.detail.relationships")}
              </span>
              {target ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => onNavigateToContact(target.id)}
                  className="font-semibold text-primary hover:underline text-start h-auto p-0 shadow-none justify-start text-xs"
                >
                  {getDisplayName(target)}
                </Button>
              ) : (
                <span className="font-semibold text-foreground">
                  {String(emergencyContact.contactId || emergencyContact.name || "")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </DetailSection>
  );
}
