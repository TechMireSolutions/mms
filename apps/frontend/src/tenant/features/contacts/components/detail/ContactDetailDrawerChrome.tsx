import { useState } from "react";
import { Edit2, Clock, RotateCcw, Archive, Loader2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Contact } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div
      role="status"
      className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs font-medium text-foreground"
    >
      <Archive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
      <span>
        {t("contacts.detail.archivedBanner", {
          date: formatDate(deletedAt),
        })}
      </span>
    </div>
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
  const { t, isRtl } = useTranslation();

  const focusTabAt = (index: number) => {
    const next = detailTabs[index];
    if (!next) return;
    onTabChange(next.key);
    const node = document.getElementById(`contact-detail-drawer-tab-${next.key}`);
    node?.focus();
  };

  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (detailTabs.length === 0) return;
    const currentIndex = detailTabs.findIndex((tab) => tab.key === activeTab);
    if (currentIndex < 0) return;

    const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

    if (event.key === nextKey || event.key === prevKey) {
      event.preventDefault();
      const delta = event.key === nextKey ? 1 : -1;
      const nextIndex = (currentIndex + delta + detailTabs.length) % detailTabs.length;
      focusTabAt(nextIndex);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusTabAt(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusTabAt(detailTabs.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={t("contacts.detail.tabsLabel")}
      onKeyDown={onTabListKeyDown}
      className="flex w-full gap-1 overflow-x-auto overscroll-x-contain rounded-xl bg-muted p-1"
    >
      {detailTabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`contact-detail-drawer-tab-${tab.key}`}
            aria-selected={active}
            aria-controls={`contact-detail-drawer-${tab.key}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 sm:text-sm",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon && <tab.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
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
