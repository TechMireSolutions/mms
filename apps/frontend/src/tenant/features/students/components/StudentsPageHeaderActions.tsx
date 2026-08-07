import { UserPlus, Download } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface StudentsPageHeaderActionsProps {
  canExport: boolean;
  canWrite: boolean;
  viewingDeleted: boolean;
  onExport: () => void;
  onAddStudent: () => void;
}

export function StudentsPageHeaderActions({
  canExport,
  canWrite,
  viewingDeleted,
  onExport,
  onAddStudent,
}: StudentsPageHeaderActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {canExport && !viewingDeleted ? (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWrite && !viewingDeleted ? (
        <ActionButton variant="primary" icon={UserPlus} onClick={onAddStudent}>
          {t("action.addStudent")}
        </ActionButton>
      ) : null}
    </>
  );
}
