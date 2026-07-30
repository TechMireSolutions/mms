import { type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

import type { QuestionFormDraft } from "./questionFormTypes";

interface QuestionFormFooterSummaryProps {
  questionDraft: QuestionFormDraft;
}

export function QuestionFormFooterSummary({ questionDraft }: QuestionFormFooterSummaryProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!questionDraft.text) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
        {t("questionBank.validation.textRequired")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60 truncate max-w-[12.5rem]">
        {questionDraft.text}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs capitalize">
          {t(`questionBank.type.${questionDraft.type}` as AppTranslationKey)}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-info/10 text-info font-semibold border border-info/20 text-xs capitalize">
          {t(`questionBank.difficulty.${questionDraft.difficulty}` as AppTranslationKey)}
        </span>
      </div>
    </div>
  );
}
