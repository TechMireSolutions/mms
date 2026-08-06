import type { ReactNode } from "react";
import { calcAge, primaryResponsibleAdultDisplayName, type Student } from "@mms/shared";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatStudentListCustomValue,
  studentCustomFieldKeyFromColumn,
} from "@/tenant/features/students/components/studentListCustomColumns";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentCardMetadataProps = Pick<
  StudentListCardsProps,
  "statusBadgeConfig" | "isColumnVisible" | "isFieldEnabled" | "columnRegistry"
> & {
  student: Student;
};

/** Students domain metadata tiles — Contacts card metadata chrome. */
export function StudentCardMetadata({
  student,
  statusBadgeConfig,
  isColumnVisible,
  isFieldEnabled,
  columnRegistry,
}: StudentCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const emptyDash = t("students.table.emptyDash");
  const age = calcAge(student.dob);
  const parentName = primaryResponsibleAdultDisplayName(student);
  const customColumns = columnRegistry.filter(
    (col) => col.key.startsWith("custom:") && isColumnVisible(col.key),
  );

  const tiles: ReactNode[] = [];

  if (isFieldEnabled("gender")) {
    tiles.push(
      <DirectoryCardMetaTile key="gender" label={t("students.gender")}>
        {student.gender ? formatContactGenderLabel(student.gender, t) : emptyDash}
      </DirectoryCardMetaTile>,
    );
  }
  if (isColumnVisible("dob")) {
    tiles.push(
      <DirectoryCardMetaTile key="dob" label={t("students.columns.dob")}>
        {age ? t("students.list.ageYears", { age }) : emptyDash}
      </DirectoryCardMetaTile>,
    );
  }
  if (isColumnVisible("parents") && parentName) {
    tiles.push(
      <DirectoryCardMetaTile key="parents" label={t("students.columns.parents")}>
        {parentName}
      </DirectoryCardMetaTile>,
    );
  }
  if (isColumnVisible("status")) {
    tiles.push(
      <DirectoryCardMetaTile key="status" label={t("students.columns.status")}>
        <StatusBadge status={student.status || "active"} config={statusBadgeConfig} />
      </DirectoryCardMetaTile>,
    );
  }
  for (const col of customColumns) {
    const fieldKey = studentCustomFieldKeyFromColumn(col.key);
    const raw = fieldKey ? (student as Record<string, unknown>)[fieldKey] : undefined;
    tiles.push(
      <DirectoryCardMetaTile key={col.key} label={col.label}>
        {formatStudentListCustomValue(raw, t)}
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
