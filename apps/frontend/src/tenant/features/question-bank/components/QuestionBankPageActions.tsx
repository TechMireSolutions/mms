import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface QuestionBankPageActionsProps {
  canWrite: boolean;
  showDeleted: boolean;
  onCreatePaper: () => void;
  onAddQuestion: () => void;
}

export function QuestionBankPageActions({
  canWrite,
  showDeleted,
  onCreatePaper,
  onAddQuestion,
}: QuestionBankPageActionsProps) {
  const { t } = useTranslation();

  if (!canWrite || showDeleted) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={onCreatePaper}>
        <FileText className="h-3.5 w-3.5" />
        {t("questionBank.generator")}
      </Button>
      <Button type="button" size="sm" onClick={onAddQuestion}>
        <Plus className="h-3.5 w-3.5" />
        {t("questionBank.addQuestion")}
      </Button>
    </div>
  );
}
