import {
  UserPlus, Download, Upload, Building2, Award,
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultyWorkSubTabId } from "@/tenant/features/faculty/facultyPageWorkSubTabs";

export type FacultyIoEntity = FacultyWorkSubTabId;

export interface FacultyPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  /** Industry terminology singular staff label (e.g. Teacher / Employee). */
  staffSingular?: string;
  onExportEntity: (entity: FacultyIoEntity) => void;
  onImportEntity: (entity: FacultyIoEntity) => void;
  onAddFaculty?: () => void;
  onAddDepartment?: () => void;
  onAddDesignation?: () => void;
}

const IO_ENTITIES: FacultyIoEntity[] = ["faculties", "departments", "designations"];

export function FacultyPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  staffSingular,
  onExportEntity,
  onImportEntity,
  onAddFaculty,
  onAddDepartment,
  onAddDesignation,
}: FacultyPageHeaderActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (viewingDeleted) return null;

  const addLabel = staffSingular
    ? t("action.addNamed", { name: staffSingular })
    : t("action.addFaculty");

  const entityLabel = (entity: FacultyIoEntity) => {
    if (entity === "faculties") return t("faculty.tabs.faculties");
    if (entity === "departments") return t("faculty.tabs.departments");
    return t("faculty.tabs.designations");
  };

  return (
    <>
      {canExport ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ActionButton variant="ghost" icon={Download}>
              {t("faculty.io.export")}
            </ActionButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {IO_ENTITIES.map((entity) => (
              <DropdownMenuItem
                key={`export-${entity}`}
                className="cursor-pointer"
                onClick={() => onExportEntity(entity)}
              >
                {entityLabel(entity)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {canWrite ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ActionButton variant="ghost" icon={Upload}>
              {t("faculty.io.import")}
            </ActionButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {IO_ENTITIES.map((entity) => (
              <DropdownMenuItem
                key={`import-${entity}`}
                className="cursor-pointer"
                onClick={() => onImportEntity(entity)}
              >
                {entityLabel(entity)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {canWrite && onAddDepartment ? (
        <ActionButton variant="ghost" icon={Building2} onClick={onAddDepartment}>
          {t("faculty.setup.addDepartment")}
        </ActionButton>
      ) : null}

      {canWrite && onAddDesignation ? (
        <ActionButton variant="ghost" icon={Award} onClick={onAddDesignation}>
          {t("faculty.designations.addDesignation")}
        </ActionButton>
      ) : null}

      {canWrite && onAddFaculty ? (
        <ActionButton variant="primary" icon={UserPlus} onClick={onAddFaculty}>
          {addLabel}
        </ActionButton>
      ) : null}
    </>
  );
}
