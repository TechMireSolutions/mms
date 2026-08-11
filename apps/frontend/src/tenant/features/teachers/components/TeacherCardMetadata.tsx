import type { ModuleColumnRegistryEntry, Teacher, TeacherCustomField } from "@mms/shared";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
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

/** Teachers domain metadata tiles — Contacts/Students card metadata chrome. */
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

  return (
    <DirectoryCardMetadata
      columns={metaColumns}
      keyFor={(col) => col.key}
      labelFor={(col) => col.label}
      renderValue={(col) =>
        renderTeacherWorkColumnValue(teacher, col.key, {
          t,
          statusConfig,
          customFieldsById,
          statusBadgeSize: "sm",
          emptyFallback: null,
        })
      }
    />
  );
}
