import { Download, PenTool, Plus, Upload } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface ExaminationsPageActionsProps {
  canWrite: boolean;
  canExport?: boolean;
  showDeleted: boolean;
  isExporting?: boolean;
  onEnterMarks: () => void;
  onCreateExam: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

export function ExaminationsPageActions({
  canWrite,
  canExport = true,
  showDeleted,
  isExporting = false,
  onEnterMarks,
  onCreateExam,
  onImport,
  onExport,
}: ExaminationsPageActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!canWrite || showDeleted) return <div className="flex items-center gap-2" />;

  return (
    <div className="flex items-center gap-2">
      {canExport && onExport ? (
        <ActionButton
          variant="ghost"
          icon={Download}
          onClick={onExport}
          loading={isExporting}
          disabled={isExporting}
        >
          {t("common.export")}
        </ActionButton>
      ) : null}
      {onImport ? (
        <ActionButton variant="secondary" icon={Upload} onClick={onImport}>
          {t("common.import")}
        </ActionButton>
      ) : null}
      <ActionButton variant="ghost" icon={PenTool} onClick={onEnterMarks}>
        {t("examinations.marks")}
      </ActionButton>
      <ActionButton variant="primary" icon={Plus} onClick={onCreateExam}>
        {t("examinations.newExam")}
      </ActionButton>
    </div>
  );
}
