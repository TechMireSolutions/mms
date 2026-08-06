import type { Contact } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailDrawerArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";
import { formatEntityStamp } from "@/lib/formatEntityStamp";

/** Soft-delete archive banner shared by contact drawer chrome and directory cards. */
export function ContactArchivedBanner({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const stamp = formatEntityStamp(contact.deletedAt);
  if (!stamp) return null;

  const formatted = formatDate(stamp);
  return (
    <DetailDrawerArchivedBanner
      deletedAt={contact.deletedAt}
      title={t("contacts.detail.archivedBanner", { date: formatted })}
      description={
        contact.deletionReason
          ? `${t("contacts.deletionReasonLabel")}: ${contact.deletionReason}`
          : undefined
      }
    />
  );
}
