import { FACULTY_MODULE_MANIFEST, type FacultyMember, type Teacher } from "@mms/shared";
import { EntityArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";
import { useTranslation } from "@/hooks/useTranslation";

export type FacultyArchivedBannerProps = {
  faculty?: FacultyMember;
  teacher?: Teacher;
};

export type TeacherArchivedBannerProps = FacultyArchivedBannerProps;

/** Soft-delete archive banner for faculty drawer and directory cards. */
export function FacultyArchivedBanner(props: FacultyArchivedBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const teacher = props.faculty ?? props.teacher;
  if (!teacher) return null;
  return (
    <EntityArchivedBanner
      deletedAt={teacher.deletedAt}
      deletionReason={teacher.deletionReason}
      titleWithDate={(date) => t("teachers.detail.archivedBanner", { date })}
      reasonLabel={t("teachers.deletionReasonLabel")}
      retentionDays={(teacher as { retentionDays?: number | null }).retentionDays ?? FACULTY_MODULE_MANIFEST.softDelete?.retentionDays ?? null}
      purgeAfter={(teacher as { purgeAfter?: unknown }).purgeAfter}
    />
  );
}

export const TeacherArchivedBanner = FacultyArchivedBanner;


