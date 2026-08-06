import type { ReactNode } from "react";
import { formatDate, type TeacherCustomField } from "@mms/shared";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher } from "@/lib/data/teachersData";
import { getTeacherCustomFieldValue } from "@/tenant/features/teachers/components/teacherListContentShared";

function MetaTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 bg-muted/40 dark:bg-muted/15 px-2.5 py-1.5 rounded-xl border border-border/30 dark:border-border/10 text-start min-w-0">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
        {label}
      </span>
      <div className="text-xs font-semibold text-foreground truncate mt-0.5">{children}</div>
    </div>
  );
}

export interface TeacherCardMetadataProps {
  teacher: Teacher;
  showSpecialization: boolean;
  showQualification: boolean;
  showJoinDate: boolean;
  showStatus: boolean;
  visibleCustomFields: TeacherCustomField[];
  statusConfig: Record<string, StatusBadgeConfigItem>;
}

/** Teachers domain metadata tiles — Contacts card metadata chrome. */
export function TeacherCardMetadata({
  teacher,
  showSpecialization,
  showQualification,
  showJoinDate,
  showStatus,
  visibleCustomFields,
  statusConfig,
}: TeacherCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const tiles: ReactNode[] = [];

  if (showSpecialization) {
    tiles.push(
      <MetaTile key="specialization" label={t("teachers.field.specialization")}>
        {teacher.specialization ?? t("common.notSpecified")}
      </MetaTile>,
    );
  }
  if (showQualification) {
    tiles.push(
      <MetaTile key="qualification" label={t("teachers.field.qualification")}>
        {teacher.qualification ?? t("common.notSpecified")}
      </MetaTile>,
    );
  }
  if (showJoinDate) {
    tiles.push(
      <MetaTile key="joinDate" label={t("teachers.field.joinDate")}>
        {teacher.joinDate ? formatDate(teacher.joinDate) : t("common.notSpecified")}
      </MetaTile>,
    );
  }
  if (showStatus) {
    tiles.push(
      <MetaTile key="status" label={t("teachers.field.status")}>
        <StatusBadge status={teacher.status} config={statusConfig} size="sm" />
      </MetaTile>,
    );
  }
  for (const field of visibleCustomFields) {
    tiles.push(
      <MetaTile key={field.id} label={field.label ?? field.id}>
        {getTeacherCustomFieldValue(teacher, field, t)}
      </MetaTile>,
    );
  }

  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1">
      {tiles}
    </div>
  );
}
