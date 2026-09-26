import type { Faculty, ModuleColumnRegistryEntry, Teacher, TeacherCustomField } from "@mms/shared";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { useTranslation } from "@/hooks/useTranslation";
import { getTeacherVisibleWorkColumns } from "@/tenant/features/faculty/components/facultyListVisibleColumns";
import { renderTeacherWorkColumnValue } from "@/tenant/features/faculty/components/facultyWorkColumnCell";

export interface TeacherCardMetadataProps {
  teacher: Teacher;
  isColumnVisible: (key: string) => boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  customFieldsById: Map<string, TeacherCustomField>;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  /** Optional entity descriptor — descriptor-driven fields supplement legacy column tiles. */
  descriptor?: EntityDescriptor<Faculty>;
}

/** Teachers domain metadata tiles — Contacts/Students card metadata chrome. */
export function TeacherCardMetadata({
  teacher,
  isColumnVisible,
  columnRegistry,
  customFieldsById,
  statusConfig,
  descriptor,
}: TeacherCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const metaColumns = getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });

  if (metaColumns.length === 0 && !descriptor) {
    return null;
  }

  const extraColumns =
    metaColumns.length > 0
      ? {
          columns: metaColumns,
          keyFor: (col: ModuleColumnRegistryEntry) => col.key,
          labelFor: (col: ModuleColumnRegistryEntry) => col.label,
          renderValue: (col: ModuleColumnRegistryEntry) =>
            renderTeacherWorkColumnValue(teacher, col.key, {
              t,
              statusConfig,
              customFieldsById,
              emptyFallback: null,
            }),
        }
      : undefined;

  return (
    <DirectoryCardMetadata
      descriptor={descriptor}
      entity={teacher as Faculty}
      isColumnVisible={isColumnVisible}
      extraColumns={extraColumns}
      columns={extraColumns?.columns}
      keyFor={extraColumns?.keyFor}
      labelFor={extraColumns?.labelFor}
      renderValue={extraColumns?.renderValue}
    />
  );
}

export type FacultyCardMetadataProps = TeacherCardMetadataProps;
export const FacultyCardMetadata = TeacherCardMetadata;

