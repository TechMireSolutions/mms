import type { Contact, EmailAddress, PhoneNumber } from "@mms/shared";

export function EmptyCollectionHint({ message }: { message: string }): React.JSX.Element {
  return <p className="p-3 text-sm text-muted-foreground">{message}</p>;
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
