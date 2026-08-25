import { ContactsPageView } from "@/tenant/features/contacts/components/ContactsPageView";
import { useContactsPageController } from "@/tenant/features/contacts/hooks/useContactsPageController";

function ContactsInner() {
  const view = useContactsPageController();
  return <ContactsPageView {...view} />;
}

export default ContactsInner;
