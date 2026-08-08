import type { Teacher } from "@mms/shared";
import { EntityArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";
import { useTranslation } from "@/hooks/useTranslation";

/** Soft-delete archive banner for teacher drawer and directory cards. */
export function TeacherArchivedBanner({
  teacher,
}: {
  teacher: Teacher;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <EntityArchivedBanner
      deletedAt={teacher.deletedAt}
      deletionReason={teacher.deletionReason}
      titleWithDate={(date) => t("teachers.detail.archivedBanner", { date })}
      reasonLabel={t("teachers.deletionReasonLabel")}
    />
  );
}
