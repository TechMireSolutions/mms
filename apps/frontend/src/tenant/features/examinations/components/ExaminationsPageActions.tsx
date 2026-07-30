import { PenTool, Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

interface ExaminationsPageActionsProps {
  canWrite: boolean;
  showDeleted: boolean;
  onEnterMarks: () => void;
  onCreateExam: () => void;
}

export function ExaminationsPageActions({
  canWrite,
  showDeleted,
  onEnterMarks,
  onCreateExam,
}: ExaminationsPageActionsProps) {
  const { t } = useTranslation();

  if (!canWrite || showDeleted) return <div className="flex items-center gap-2" />;

  return (
    <div className="flex items-center gap-2">
      <ActionButton variant="ghost" icon={PenTool} onClick={onEnterMarks}>
        {t("examinations.marks")}
      </ActionButton>
      <ActionButton variant="primary" icon={Plus} onClick={onCreateExam}>
        {t("examinations.newExam")}
      </ActionButton>
    </div>
  );
}
