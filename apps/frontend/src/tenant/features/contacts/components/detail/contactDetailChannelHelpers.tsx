import type { Contact, EmailAddress, PhoneNumber } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";

/** Dense empty hint inside detail collection sections (EmptyState SSOT). */
export function DetailCollectionEmpty({ title }: { title: string }): React.JSX.Element {
  return (
    <EmptyState
      title={title}
      compact
      icon={null}
      className="items-start px-3 py-3 text-start"
    />
  );
}

export function withPrimaryPhone(contact: Contact, phone: PhoneNumber): Contact {
  const others = (contact.phones ?? []).filter(
    (entry) => !(entry.number === phone.number && entry.countryCode === phone.countryCode),
  );
  return {
    ...contact,
    phones: [{ ...phone, isPrimary: true }, ...others.map((entry) => ({ ...entry, isPrimary: false }))],
  };
}

export function withPrimaryEmail(contact: Contact, email: EmailAddress): Contact {
  const address = String(email.address || "").trim();
  const others = (contact.emails ?? []).filter(
    (entry) => String(entry.address || "").trim().toLowerCase() !== address.toLowerCase(),
  );
  return {
    ...contact,
    email: address,
    emails: [
      { ...email, address, isPrimary: true },
      ...others.map((entry) => ({ ...entry, isPrimary: false })),
    ],
  };
}
