import type { TeacherCustomField } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from "@/lib/data/teachersData";
import { getTeacherCustomFieldValue } from "@/tenant/features/teachers/components/teacherListContentShared";

export interface TeacherCardMetadataProps {
  teacher: Teacher;
  isColumnVisible: (key: string) => boolean;
  visibleCustomFields: TeacherCustomField[];
  statusConfig: Record<string, StatusBadgeConfigItem>;
}

/** Teachers domain metadata tiles — Contacts card metadata chrome. */
export function TeacherCardMetadata({
  teacher,
  isColumnVisible,
  visibleCustomFields,
  statusConfig,
}: TeacherCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const tiles: React.ReactNode[] = [];

  if (isColumnVisible("specialization")) {
    tiles.push(
      <DirectoryCardMetaTile key="specialization" label={t("teachers.field.specialization")}>
        {teacher.specialization ?? t("common.notSpecified")}
      </DirectoryCardMetaTile>,
    );
  }
  if (isColumnVisible("qualification")) {
    tiles.push(
      <DirectoryCardMetaTile key="qualification" label={t("teachers.field.qualification")}>
        {teacher.qualification ?? t("common.notSpecified")}
      </DirectoryCardMetaTile>,
    );
  }
  if (isColumnVisible("joinDate")) {
    tiles.push(
      <DirectoryCardMetaTile key="joinDate" label={t("teachers.field.joinDate")}>
        {teacher.joinDate ? formatDate(teacher.joinDate) : t("common.notSpecified")}
      </DirectoryCardMetaTile>,
    );
  }
  if (isColumnVisible("status")) {
    tiles.push(
      <DirectoryCardMetaTile key="status" label={t("teachers.field.status")}>
        <StatusBadge status={teacher.status} config={statusConfig} size="sm" />
      </DirectoryCardMetaTile>,
    );
  }
  for (const field of visibleCustomFields) {
    tiles.push(
      <DirectoryCardMetaTile key={field.id} label={field.label ?? field.id}>
        {getTeacherCustomFieldValue(teacher, field, t)}
      </DirectoryCardMetaTile>,
    );
  }

  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1">
      {tiles}
    </div>
  );
}
