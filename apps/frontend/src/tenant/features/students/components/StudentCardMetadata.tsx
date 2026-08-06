import type { ReactNode } from "react";
import { calcAge, primaryResponsibleAdultDisplayName, type Student } from "@mms/shared";
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
      <MetaTile key="gender" label={t("students.gender")}>
        {student.gender ? formatContactGenderLabel(student.gender, t) : emptyDash}
      </MetaTile>,
    );
  }
  if (isColumnVisible("dob")) {
    tiles.push(
      <MetaTile key="dob" label={t("students.columns.dob")}>
        {age ? t("students.list.ageYears", { age }) : emptyDash}
      </MetaTile>,
    );
  }
  if (isColumnVisible("parents") && parentName) {
    tiles.push(
      <MetaTile key="parents" label={t("students.columns.parents")}>
        {parentName}
      </MetaTile>,
    );
  }
  if (isColumnVisible("status")) {
    tiles.push(
      <MetaTile key="status" label={t("students.columns.status")}>
        <StatusBadge status={student.status || "active"} config={statusBadgeConfig} />
      </MetaTile>,
    );
  }
  for (const col of customColumns) {
    const fieldKey = studentCustomFieldKeyFromColumn(col.key);
    const raw = fieldKey ? (student as Record<string, unknown>)[fieldKey] : undefined;
    tiles.push(
      <MetaTile key={col.key} label={col.label}>
        {formatStudentListCustomValue(raw, t)}
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
