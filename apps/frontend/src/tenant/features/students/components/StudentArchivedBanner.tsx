import type { Student } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailDrawerArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";
import { formatEntityStamp } from "@/lib/formatEntityStamp";

/** Soft-delete archive banner for student drawer (Contacts-shaped deletionReason). */
export function StudentArchivedBanner({
  student,
}: {
  student: Student;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const stamp = formatEntityStamp(student.deletedAt);
  if (!stamp) return null;

  const formatted = formatDate(stamp);
  return (
    <DetailDrawerArchivedBanner
      deletedAt={student.deletedAt}
      title={t("students.detail.archivedBanner", { date: formatted })}
      description={
        student.deletionReason
          ? `${t("students.deletionReasonLabel")}: ${student.deletionReason}`
          : undefined
      }
    />
  );
}
