import { Edit2, Clock } from "lucide-react";
import type { Contact } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { SubTabBar } from "@/components/ui/SubTabBar";

export function ContactDetailDrawerHeaderActions({
  canWrite,
  contact,
  onEdit,
}: {
  canWrite: boolean;
  contact: Contact;
  onEdit: (contact: Contact) => void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!canWrite || contact.deletedAt) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => onEdit(contact)}
      aria-label={t("contacts.detail.editProfile")}
      className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none"
      title={t("contacts.detail.editProfile")}
    >
      <Edit2 className="w-4 h-4" />
    </Button>
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
    <div className="flex border-b border-border py-1 overflow-x-auto w-full">
      <SubTabBar
        tabs={detailTabs}
        value={activeTab}
        onChange={onTabChange}
        panelIdPrefix="contact-detail-drawer"
        className="w-full"
        resetScrollOnChange={false}
      />
    </div>
  );
}

export function ContactDetailDrawerFooter({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
        <Clock className="w-3 h-3" />
        {(contact.updatedAt || contact.createdAt) && (
          <span>
            {t("contacts.detail.updatedLabel")}{" "}
            {formatDate((contact.updatedAt || contact.createdAt) as string)}
          </span>
        )}
      </div>
    </>
  );
}
