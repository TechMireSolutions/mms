import {
  Download,
  Upload,
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FACULTY_IO_ENTITY_IDS,
  type FacultyIoEntity,
} from "@/tenant/features/faculty/facultyPageWorkSubTabs";

export type { FacultyIoEntity };

export interface FacultyPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  onExportEntity: (entity: FacultyIoEntity) => void;
  onImportEntity: (entity: FacultyIoEntity) => void;
}

/**
 * Module-dashboard IO: Import/Export choosers for all three entities.
 * Per-entity Add lives on {@link FacultyTabIoToolbar} (avoids duplicate Adds).
 */
export function FacultyPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  onExportEntity,
  onImportEntity,
}: FacultyPageHeaderActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (viewingDeleted) return null;

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
            {FACULTY_IO_ENTITY_IDS.map((entity) => (
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
            {FACULTY_IO_ENTITY_IDS.map((entity) => (
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
    </>
  );
}
