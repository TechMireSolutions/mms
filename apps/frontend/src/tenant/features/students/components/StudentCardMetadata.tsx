import type { ModuleColumnRegistryEntry, Student } from "@mms/shared";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { getStudentVisibleWorkColumns } from "@/tenant/features/students/components/studentsListVisibleColumns";
import { renderStudentWorkColumnValue } from "@/tenant/features/students/components/studentWorkColumnCell";

export interface StudentCardMetadataProps {
  student: Student;
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  isColumnVisible: (key: string) => boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
}

const getColumnKey = (col: { key: string }) => col.key;
const getColumnLabel = (col: { label: string }) => col.label;

/** Students domain metadata tiles — face columns excluded (Contacts/Teachers parity). */
export function StudentCardMetadata({
  student,
  statusBadgeConfig,
  isColumnVisible,
  columnRegistry,
}: StudentCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const metaColumns = getStudentVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });

  if (metaColumns.length === 0) {
    return null;
  }

  return (
    <DirectoryCardMetadata
      columns={metaColumns}
      keyFor={getColumnKey}
      labelFor={getColumnLabel}
      renderValue={(col) =>
        renderStudentWorkColumnValue(student, col.key, {
          t,
          statusBadgeConfig,
          emptyFallback: null,
        })
      }
    />
  );
}
