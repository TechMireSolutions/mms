import { ContactsPageView } from "@/tenant/features/contacts/components/ContactsPageView";
import { useContactsPageView } from "@/tenant/features/contacts/hooks/useContactsPageController";

function ContactsInner() {
  const view = useContactsPageView();
  return <ContactsPageView {...view} />;
}

export default ContactsInner;
