import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DrawerUpdatedStamp } from "@/components/ui/DrawerUpdatedStamp";
import { ContactArchivedBanner } from "@/tenant/features/contacts/components/ContactArchivedBanner";

export function ContactDetailDrawerHeaderActions({
  canWrite,
  canDelete,
  contact,
  onEdit,
  onRestore,
}: {
  canWrite: boolean;
  canDelete: boolean;
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onRestore?: (contactId: string | number) => void | Promise<void>;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const isArchived = Boolean(contact.deletedAt);

  return (
    <DetailDrawerRestoreOrEditAction
      isArchived={isArchived}
      canRestore={canDelete}
      canEdit={canWrite}
      restoreLabel={t("contacts.restoreContact")}
      editLabel={t("contacts.detail.editProfile")}
      onRestore={onRestore ? () => onRestore(contact.id) : undefined}
      onEdit={() => onEdit(contact)}
    />
  );
}

export function ContactDetailDrawerArchivedBanner({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element | null {
  return <ContactArchivedBanner contact={contact} />;
}

export function ContactDetailDrawerTabBar({
  detailTabs,
  activeTab,
  onTabChange,
}: {
  detailTabs: Array<{ key: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}): React.JSX.Element {
  return (
    <SubTabBar
      tabs={detailTabs}
      value={activeTab}
      onChange={onTabChange}
      variant="underline"
      panelIdPrefix="contact-detail-drawer"
      resetScrollOnChange={false}
      className="w-full pt-1"
    />
  );
}

export function ContactDetailDrawerFooter({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <DrawerUpdatedStamp
      updatedAt={contact.updatedAt}
      createdAt={contact.createdAt}
      label={t("contacts.detail.updatedLabel")}
    />
  );
}
