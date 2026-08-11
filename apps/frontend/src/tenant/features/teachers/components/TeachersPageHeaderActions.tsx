import { UserPlus, Download } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface TeachersPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  onExport: () => void;
  onAddTeacher: () => void;
}

export function TeachersPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  onExport,
  onAddTeacher,
}: TeachersPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {canExport && !viewingDeleted ? (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWrite && !viewingDeleted ? (
        <ActionButton variant="primary" icon={UserPlus} onClick={onAddTeacher}>
          {t("action.addTeacher")}
        </ActionButton>
      ) : null}
    </>
  );
}
