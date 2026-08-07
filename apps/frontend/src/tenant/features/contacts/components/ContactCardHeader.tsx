import type { Contact } from "@mms/shared";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { useTranslation } from "@/hooks/useTranslation";

export function ContactCardHeader({
  contact,
  isSelected,
  displayName,
  onSelect,
  onView,
  reducedMotion = false,
}: {
  contact: Contact;
  isSelected: boolean;
  displayName: string;
  onSelect: (id: string | number) => void;
  onView?: (contact: Contact) => void;
  reducedMotion?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardHeader
      id={contact.id}
      displayName={displayName}
      avatar={contact.avatar}
      isSelected={isSelected}
      onSelect={() => onSelect(contact.id)}
      selectAriaLabel={t("contacts.table.selectContact", { name: displayName })}
      onView={() => onView?.(contact)}
      viewAriaLabel={`${t("contacts.table.viewProfile")} - ${displayName}`}
      reducedMotion={reducedMotion}
      subtitle={
        <ContactIdentityMeta
          gender={contact.gender}
          isSyed={contact.isSyed}
          className="mt-0.5 font-semibold truncate"
        />
      }
    />
  );
}
