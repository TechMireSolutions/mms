import { UserPlus, Download } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  onExport: () => void;
  onAddFaculty?: () => void;
}

export function FacultyPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  onExport,
  onAddFaculty,
}: FacultyPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {canExport && !viewingDeleted ? (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWrite && !viewingDeleted && onAddFaculty ? (
        <ActionButton variant="primary" icon={UserPlus} onClick={onAddFaculty}>
          {t("action.addFaculty")}
        </ActionButton>
      ) : null}
    </>
  );
}



