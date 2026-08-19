import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";
import {
  DetailCollectionEmpty,
  withPrimaryEmail,
} from "./contactDetailChannelHelpers";
import { buildDetailEmailMessagingActions } from "./contactDetailMessagingActions";

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
  const emails =
    contact.emails && contact.emails.length > 0
      ? contact.emails
      : contact.email
        ? [{ address: contact.email, label: "Personal" }]
        : [];

  return (
    <DetailSection title={t("contacts.form.emailsLabel")}>
      {emails.length === 0 ? (
        <DetailCollectionEmpty title={t("contacts.detail.emptyEmails")} />
      ) : (
        emails.map((email, emailIndex) => {
          const rawEmail = String(email.address || "").trim();
          const actions =
            onEmail && rawEmail
              ? buildDetailEmailMessagingActions({
                  emailTitle: t("contacts.detail.emailContact", { email: rawEmail }),
                  onEmail: () =>
                    onEmail([withPrimaryEmail(contact, { ...email, address: rawEmail })]),
                })
              : [];

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
