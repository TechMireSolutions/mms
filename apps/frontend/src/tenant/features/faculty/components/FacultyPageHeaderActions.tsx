import { UserPlus, Download } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  /** Industry terminology singular staff label (e.g. Teacher / Employee). */
  staffSingular?: string;
  onExport: () => void;
  onAddFaculty?: () => void;
}

export function FacultyPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  staffSingular,
  onExport,
  onAddFaculty,
}: FacultyPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const addLabel = staffSingular
    ? t("action.addNamed", { name: staffSingular })
    : t("action.addFaculty");

  return (
    <>
      {canExport && !viewingDeleted ? (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWrite && !viewingDeleted && onAddFaculty ? (
        <ActionButton variant="primary" icon={UserPlus} onClick={onAddFaculty}>
          {addLabel}
        </ActionButton>
      ) : null}
    </>
  );
}



