import { Award, Building2, Download, Upload, UserPlus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultyIoEntity } from "@/tenant/features/faculty/facultyPageWorkSubTabs";

export type { FacultyIoEntity };

export interface FacultyTabIoToolbarProps {
  entity: FacultyIoEntity;
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  onExportEntity: (entity: FacultyIoEntity) => void;
  onImportEntity: (entity: FacultyIoEntity) => void;
  onAdd: () => void;
}

/** Scoped Add / Import / Export for one Faculty entity tab. */
export function FacultyTabIoToolbar({
  entity,
  canExport,
  canWrite,
  viewingDeleted,
  onExportEntity,
  onImportEntity,
  onAdd,
}: FacultyTabIoToolbarProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (viewingDeleted) return null;

  const addLabel =
    entity === "faculties"
      ? t("action.addFaculty")
      : entity === "departments"
        ? t("faculty.setup.addDepartment")
        : t("faculty.designations.addDesignation");

  const AddIcon =
    entity === "faculties" ? UserPlus : entity === "departments" ? Building2 : Award;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canExport ? (
        <ActionButton variant="ghost" icon={Download} onClick={() => onExportEntity(entity)}>
          {t("faculty.io.export")}
        </ActionButton>
      ) : null}
      {canWrite ? (
        <ActionButton variant="ghost" icon={Upload} onClick={() => onImportEntity(entity)}>
          {t("faculty.io.import")}
        </ActionButton>
      ) : null}
      {canWrite ? (
        <ActionButton variant="primary" icon={AddIcon} onClick={onAdd}>
          {addLabel}
        </ActionButton>
      ) : null}
    </div>
  );
}
