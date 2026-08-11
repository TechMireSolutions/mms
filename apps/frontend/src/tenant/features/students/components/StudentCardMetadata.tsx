import type { Student } from "@mms/shared";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import { useTranslation } from "@/hooks/useTranslation";
import { getStudentVisibleWorkColumns } from "@/tenant/features/students/components/studentListVisibleColumns";
import { renderStudentWorkColumnValue } from "@/tenant/features/students/components/studentWorkColumnCell";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentCardMetadataProps = Pick<
  StudentListCardsProps,
  "statusBadgeConfig" | "isColumnVisible" | "columnRegistry" | "sessions"
> & {
  student: Student;
};

/** Students domain metadata tiles — face columns excluded (Contacts/Teachers parity). */
export function StudentCardMetadata({
  student,
  statusBadgeConfig,
  isColumnVisible,
  columnRegistry,
  sessions,
}: StudentCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const sessionNames = sessions
    .filter((session) => student.enrolledSessions?.includes(session.id))
    .map((session) => session.name);

  const metaColumns = getStudentVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });

  return (
    <DirectoryCardMetadata
      columns={metaColumns}
      keyFor={(col) => col.key}
      labelFor={(col) => col.label}
      renderValue={(col) =>
        renderStudentWorkColumnValue(student, col.key, {
          t,
          statusBadgeConfig,
          sessionNames,
          emptyFallback: null,
        })
      }
    />
  );
}
