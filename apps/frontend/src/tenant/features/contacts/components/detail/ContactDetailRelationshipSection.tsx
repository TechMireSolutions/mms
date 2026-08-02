import { Search } from "lucide-react";
import type { Contact } from "@mms/shared";
import { getDisplayName } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { DetailSection } from "./ContactDetailShared";

function resolveLinkedDisplayName(
  entry: NonNullable<Contact["relationshipContacts"]>[number],
  target: Contact | undefined,
  unknownLabel: string,
): string {
  if (target) return getDisplayName(target);
  const legacyName = (entry.name || "").trim();
  if (legacyName) return legacyName;
  if (entry.contactId != null && String(entry.contactId).length > 0) {
    return unknownLabel;
  }
  return "";
}

export function ContactDetailRelationshipSection({
  contact,
  allContacts,
  onNavigateToContact,
}: {
  contact: Contact;
  allContacts: Contact[];
  onNavigateToContact: (targetId: string | number) => void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const rows = (contact.relationshipContacts || []).filter(
    (entry) =>
      (entry.contactId != null && String(entry.contactId).length > 0) ||
      (entry.name || "").trim().length > 0,
  );
  if (rows.length === 0) return null;

  return (
    <DetailSection title={t("contacts.detail.relationships")}>
      {rows.map((entry, entryIndex) => {
        const target = allContacts.find((c) => String(c.id) === String(entry.contactId));
        const relationshipLabel = entry.relationship
          ? formatContactOptionLabel(entry.relationship, t)
          : t("contacts.detail.linkedContact");
        const displayName = resolveLinkedDisplayName(
          entry,
          target,
          t("contacts.detail.unknownContact"),
        );
        const linkedId = target?.id ?? entry.contactId;
        const canNavigate = linkedId != null && String(linkedId).length > 0;

        return (
          <div
            key={`${String(entry.contactId ?? "")}-${entryIndex}`}
            className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {relationshipLabel}
                </span>
              </div>
              {displayName ? (
                <span className="font-semibold text-xs text-foreground block leading-relaxed truncate">
                  {displayName}
                </span>
              ) : null}
            </div>

            {canNavigate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onNavigateToContact(linkedId)}
                aria-label={
                  displayName
                    ? t("contacts.detail.viewContact", { name: displayName })
                    : t("contacts.fields.linkedContact")
                }
                className="rounded-lg shadow-none text-primary hover:bg-primary/10 flex-shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
              </Button>
            ) : null}
          </div>
        );
      })}
    </DetailSection>
  );
}
