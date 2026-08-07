import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { EntityArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";

/** Soft-delete archive banner shared by contact drawer chrome and directory cards. */
export function ContactArchivedBanner({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <EntityArchivedBanner
      deletedAt={contact.deletedAt}
      deletionReason={contact.deletionReason}
      titleWithDate={(date) => t("contacts.detail.archivedBanner", { date })}
      reasonLabel={t("contacts.deletionReasonLabel")}
    />
  );
}
