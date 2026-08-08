import type { ModuleColumnRegistryEntry, Teacher, TeacherCustomField } from "@mms/shared";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { getTeacherVisibleWorkColumns } from "@/tenant/features/teachers/components/teacherListVisibleColumns";
import { renderTeacherWorkColumnValue } from "@/tenant/features/teachers/components/teacherWorkColumnCell";

export interface TeacherCardMetadataProps {
  teacher: Teacher;
  isColumnVisible: (key: string) => boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  customFieldsById: Map<string, TeacherCustomField>;
  statusConfig: Record<string, StatusBadgeConfigItem>;
}

/** Teachers domain metadata tiles — Contacts card metadata chrome. */
export function TeacherCardMetadata({
  teacher,
  isColumnVisible,
  columnRegistry,
  customFieldsById,
  statusConfig,
}: TeacherCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const metaColumns = getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });

  if (metaColumns.length === 0) return null;

  return (
    <DirectoryCardMetaGrid>
      {metaColumns.map((col) => (
        <DirectoryCardMetaTile key={col.key} label={col.label}>
          {renderTeacherWorkColumnValue(teacher, col.key, {
            t,
            statusConfig,
            customFieldsById,
            statusBadgeSize: "sm",
          })}
        </DirectoryCardMetaTile>
      ))}
    </DirectoryCardMetaGrid>
  );
}
