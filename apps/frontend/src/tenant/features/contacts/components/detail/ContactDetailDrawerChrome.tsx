import { useState } from "react";
import { Edit2, Clock, RotateCcw, Archive, Loader2 } from "lucide-react";
import type { Contact } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { WarningCallout } from "@/components/ui/WarningCallout";

function formatContactStamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

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
  const [restoring, setRestoring] = useState(false);
  const isArchived = Boolean(contact.deletedAt);

  if (isArchived && canDelete && onRestore) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled={restoring}
        onClick={() => {
          void (async () => {
            setRestoring(true);
            try {
              await onRestore(contact.id);
            } finally {
              setRestoring(false);
            }
          })();
        }}
        aria-label={t("contacts.restoreContact")}
        aria-busy={restoring}
        className="rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none"
        title={t("contacts.restoreContact")}
      >
        {restoring ? (
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
      </Button>
    );
  }

  if (!canWrite || isArchived) return null;

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

export function ContactDetailDrawerArchivedBanner({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const deletedAt = formatContactStamp(contact.deletedAt);
  if (!deletedAt) return null;

  return (
    <WarningCallout
      icon={Archive}
      density="compact"
      role="status"
      description={t("contacts.detail.archivedBanner", {
        date: formatDate(deletedAt),
      })}
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
  const stamp = formatContactStamp(contact.updatedAt) || formatContactStamp(contact.createdAt);
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
