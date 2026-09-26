import { UserPlus, Download } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  onExport: () => void;
  onAddFaculty?: () => void;
  onAddTeacher?: () => void;
}
export type TeachersPageHeaderActionsProps = FacultyPageHeaderActionsProps;

export function FacultyPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  onExport,
  onAddFaculty,
  onAddTeacher,
}: FacultyPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const handleAdd = onAddFaculty ?? onAddTeacher;

  return (
    <>
      {canExport && !viewingDeleted ? (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWrite && !viewingDeleted && handleAdd ? (
        <ActionButton variant="primary" icon={UserPlus} onClick={handleAdd}>
          {t("action.addFaculty") || t("action.addTeacher")}
        </ActionButton>
      ) : null}
    </>
  );
}

export const TeachersPageHeaderActions = FacultyPageHeaderActions;



