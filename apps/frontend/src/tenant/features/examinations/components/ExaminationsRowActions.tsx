import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { Exam } from "@/lib/data/examinationData";
import { Edit2, RotateCcw, Trash2 } from "lucide-react";

interface ExaminationsRowActionsProps {
  exam: Exam;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  onEdit: (exam: Exam) => void;
  onTrashAction: (id: string) => void;
}

export function ExaminationsRowActions({
  exam,
  canWrite,
  canDelete,
  showDeleted,
  onEdit,
  onTrashAction,
}: ExaminationsRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {canWrite && !showDeleted && (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => onEdit(exam)}
          aria-label={t("examinations.editExamAria", { name: exam.name })}
          className="rounded-lg hover:bg-muted text-muted-foreground transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => onTrashAction(exam.id)}
          aria-label={showDeleted ? t("examinations.trash.restore") : t("common.delete")}
          className="rounded-lg hover:bg-muted text-muted-foreground transition-all"
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
        </Button>
      )}
    </div>
  );
}
