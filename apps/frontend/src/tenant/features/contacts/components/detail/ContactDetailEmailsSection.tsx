import { Mail } from "lucide-react";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection, type CollectionRowAction } from "./ContactDetailShared";
import {
  DetailCollectionEmpty,
  withPrimaryEmail,
} from "./contactDetailChannelHelpers";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { cn } from "@/lib/utils";

export function ContactDetailEmailsSection({
  contact,
  emailLabels,
  onEmail,
}: {
  contact: Contact;
  emailLabels: string[];
  onEmail?: (contacts: Contact[]) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const emails = contact.emails ?? [];

  return (
    <DetailSection title={t("contacts.form.emailsLabel")}>
      {emails.length === 0 ? (
        <DetailCollectionEmpty title={t("contacts.detail.emptyEmails")} />
      ) : (
        emails.map((email, emailIndex) => {
          const rawEmail = String(email.address || "").trim();
          const actions: CollectionRowAction[] = [];
          if (onEmail && rawEmail) {
            actions.push({
              key: "email",
              icon: Mail,
              title: t("contacts.detail.emailContact", { email: rawEmail }),
              onClick: () => onEmail([withPrimaryEmail(contact, { ...email, address: rawEmail })]),
              className: cn(MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES.email),
            });
          }

          return (
            <CollectionRowItem
              key={`email-${email.address}-${emailIndex}`}
              label={resolveEmailLabel(email.label, emailLabels, t)}
              value={rawEmail}
              actions={actions}
            />
          );
        })
      )}
    </DetailSection>
  );
}
