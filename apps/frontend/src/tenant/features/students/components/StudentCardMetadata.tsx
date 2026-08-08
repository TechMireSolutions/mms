import type { ReactNode } from "react";
import {
  calcAge,
  formatDate,
  primaryResponsibleAdultDisplayName,
  STUDENT_CARD_FACE_COLUMN_IDS,
  type Student,
} from "@mms/shared";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatStudentListCustomValue,
  studentCustomFieldKeyFromColumn,
} from "@/tenant/features/students/components/studentListCustomColumns";
import { getStudentVisibleWorkColumns } from "@/tenant/features/students/components/studentListVisibleColumns";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentCardMetadataProps = Pick<
  StudentListCardsProps,
  "statusBadgeConfig" | "isColumnVisible" | "columnRegistry" | "sessions"
> & {
  student: Student;
};

/** Students domain metadata tiles — face columns excluded (Contacts face-set pattern). */
export function StudentCardMetadata({
  student,
  statusBadgeConfig,
  isColumnVisible,
  columnRegistry,
  sessions,
}: StudentCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const emptyDash = t("students.table.emptyDash");
  const age = calcAge(student.dob);
  const parentName = primaryResponsibleAdultDisplayName(student);
  const sessionNames = sessions
    .filter((session) => student.enrolledSessions?.includes(session.id))
    .map((session) => session.name);

  const metaColumns = getStudentVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });

  const tiles: ReactNode[] = [];

  for (const col of metaColumns) {
    if (col.key.startsWith("custom:")) {
      const fieldKey = studentCustomFieldKeyFromColumn(col.key);
      const raw = fieldKey ? (student as Record<string, unknown>)[fieldKey] : undefined;
      const display = formatStudentListCustomValue(raw, t) ?? emptyDash;
      tiles.push(
        <DirectoryCardMetaTile key={col.key} label={col.label}>
          {display}
        </DirectoryCardMetaTile>,
      );
      continue;
    }

    switch (col.key) {
      case "dob":
        tiles.push(
          <DirectoryCardMetaTile key="dob" label={col.label}>
            {age ? t("students.list.ageYears", { age }) : emptyDash}
          </DirectoryCardMetaTile>,
        );
        break;
      case "parents":
        if (parentName) {
          tiles.push(
            <DirectoryCardMetaTile key="parents" label={col.label}>
              {parentName}
            </DirectoryCardMetaTile>,
          );
        }
        break;
      case "sessions":
        tiles.push(
          <DirectoryCardMetaTile key="sessions" label={col.label}>
            {sessionNames.length > 0 ? sessionNames.join(", ") : t("students.list.notEnrolled")}
          </DirectoryCardMetaTile>,
        );
        break;
      case "status":
        tiles.push(
          <DirectoryCardMetaTile key="status" label={col.label}>
            <StatusBadge status={student.status || "active"} config={statusBadgeConfig} />
          </DirectoryCardMetaTile>,
        );
        break;
      case "registeredDate":
        tiles.push(
          <DirectoryCardMetaTile key="registeredDate" label={col.label}>
            {student.registeredDate ? formatDate(student.registeredDate, true) : emptyDash}
          </DirectoryCardMetaTile>,
        );
        break;
      case "notes":
        tiles.push(
          <DirectoryCardMetaTile key="notes" label={col.label}>
            {student.notes?.trim() || emptyDash}
          </DirectoryCardMetaTile>,
        );
        break;
      default:
        if (!STUDENT_CARD_FACE_COLUMN_IDS.has(col.key)) {
          tiles.push(
            <DirectoryCardMetaTile key={col.key} label={col.label}>
              {emptyDash}
            </DirectoryCardMetaTile>,
          );
        }
        break;
    }
  }

  if (tiles.length === 0) return null;

  return <DirectoryCardMetaGrid>{tiles}</DirectoryCardMetaGrid>;
}
