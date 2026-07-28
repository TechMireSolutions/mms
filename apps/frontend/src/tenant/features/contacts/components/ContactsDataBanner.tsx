import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContacts } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import {
  ContactsConflictBanner,
  ContactsFetchErrorBanner,
  ContactsOfflineBanner,
  ContactsPendingBanner,
} from "@/tenant/features/contacts/components/ContactsDataBannerRows";

interface ContactsDataBannerProps {
  onReviewConflicts?: () => void;
  /** When false, skip full-list fetch error surfacing (Work tab uses paginated API). */
  listFetchEnabled?: boolean;
}

/** Surfaces offline / sync failures for the Contacts module (globle1 §1.4). */
export default function ContactsDataBanner({
  onReviewConflicts,
  listFetchEnabled = true,
}: ContactsDataBannerProps): JSX.Element | null {
  const { t } = useTranslation();
  const { isError, isFetching } = useContacts({ enabled: listFetchEnabled });
  const { pendingCount, conflictCount, flushing, flush, clearConflicts } = useContactsSyncOutbox();
  const [offline, setOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [dismissAllOpen, setDismissAllOpen] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const banners: JSX.Element[] = [];

  if (offline) {
    banners.push(<ContactsOfflineBanner key="offline" t={t} />);
  }

  if (pendingCount > 0 || flushing) {
    banners.push(
      <ContactsPendingBanner
        key="pending"
        pendingCount={pendingCount}
        flushing={flushing}
        onFlush={() => void flush()}
        t={t}
      />,
    );
  }

  if (conflictCount > 0) {
    banners.push(
      <ContactsConflictBanner
        key="conflicts"
        conflictCount={conflictCount}
        onReview={onReviewConflicts}
        onDismissAll={() => setDismissAllOpen(true)}
        t={t}
      />,
    );
  }

  if (isError && !isFetching) {
    banners.push(<ContactsFetchErrorBanner key="fetch-error" t={t} />);
  }

  if (banners.length === 0) return null;

  return (
    <>
      <div className="space-y-2">{banners}</div>
      <ConfirmAlertDialog
        open={dismissAllOpen}
        onOpenChange={setDismissAllOpen}
        title={t("contacts.sync.dismissConflictsConfirmTitle")}
        description={t("contacts.sync.dismissConflictsConfirmDesc", { count: conflictCount })}
        confirmLabel={t("contacts.sync.dismissConflicts")}
        onConfirm={() => {
          clearConflicts();
          setDismissAllOpen(false);
        }}
        destructive
      />
    </>
  );
}
