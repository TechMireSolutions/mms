import { Clock } from "lucide-react";
import type { Contact } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { SubTabBar } from "@/components/ui/SubTabBar";
import {
  DetailDrawerArchivedBanner,
  DetailDrawerRestoreOrEditAction,
} from "@/components/ui/DetailDrawerArchiveChrome";
import { formatEntityStamp } from "@/lib/formatEntityStamp";

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
  const { t } = useTranslation();

  return (
    <DetailDrawerArchivedBanner
      deletedAt={contact.deletedAt}
      describe={(date) => t("contacts.detail.archivedBanner", { date })}
    />
  );
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
      panelIdPrefix="contact-detail-drawer"
      resetScrollOnChange={false}
      className="w-full"
    />
  );
}

export function ContactDetailDrawerFooter({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const stamp = formatEntityStamp(contact.updatedAt) || formatEntityStamp(contact.createdAt);
  if (!stamp) return null;

  return (
    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
      <Clock className="w-3 h-3" aria-hidden />
      <span>
        {t("contacts.detail.updatedLabel")} {formatDate(stamp)}
      </span>
    </div>
  );
}
