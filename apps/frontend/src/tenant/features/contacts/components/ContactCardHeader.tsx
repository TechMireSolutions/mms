import type { Contact } from "@mms/shared";
import { ContactIdentityMeta } from "@/tenant/features/contacts/components/ContactIdentityMeta";
import { useTranslation } from "@/hooks/useTranslation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function ContactCardHeader({
  contact,
  isSelected,
  displayName,
  onSelect,
  onView,
}: {
  contact: Contact;
  isSelected: boolean;
  displayName: string;
  onSelect: (id: string | number) => void;
  onView?: (contact: Contact) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 items-start ms-1">
      <div className="flex items-center justify-center flex-shrink-0 pt-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(contact.id)}
          aria-label={t("contacts.table.selectContact", { name: displayName })}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-start cursor-pointer hover:text-foreground shadow-none justify-start"
        onClick={() => onView?.(contact)}
        aria-label={`${t("contacts.table.viewProfile")} - ${displayName}`}
      >
        <UserAvatar
          id={contact.id}
          name={displayName}
          avatar={contact.avatar}
          className="w-11 h-11 rounded-2xl text-sm shadow-inner group-hover:scale-105 transition-transform duration-200"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
            {displayName}
          </h4>
          <ContactIdentityMeta
            gender={contact.gender}
            isSyed={contact.isSyed}
            className="mt-0.5 font-semibold truncate"
          />
        </div>
      </Button>
    </div>
  );
}
