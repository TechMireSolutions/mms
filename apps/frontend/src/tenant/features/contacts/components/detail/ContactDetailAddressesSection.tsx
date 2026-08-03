import { MapPin } from "lucide-react";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveAddressLabel } from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";
import { EmptyCollectionHint } from "./contactDetailChannelHelpers";

export function ContactDetailAddressesSection({
  contact,
  addressLabels,
}: {
  contact: Contact;
  addressLabels: string[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  const addresses = contact.addresses ?? [];

  return (
    <DetailSection title={t("contacts.detail.addresses")}>
      {addresses.length === 0 ? (
        <EmptyCollectionHint message={t("contacts.detail.emptyAddresses")} />
      ) : (
        addresses.map((address, addressIndex) => {
          const fullAddr = [address.line1, address.city, address.state, address.country]
            .filter(Boolean)
            .join(", ");
          return (
            <CollectionRowItem
              key={`address-${addressIndex}`}
              label={resolveAddressLabel(address.label, addressLabels, t)}
              value={fullAddr || emptyDash}
              copyable={Boolean(fullAddr)}
              actionHref={fullAddr ? `https://maps.google.com/?q=${encodeURIComponent(fullAddr)}` : undefined}
              actionIcon={MapPin}
              actionTitle={t("contacts.detail.openInMaps")}
              actionColorClass="text-primary hover:bg-primary/10"
              external
            />
          );
        })
      )}
    </DetailSection>
  );
}
