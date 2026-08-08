import { type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FormFooterBadge,
  FormFooterEntityChip,
  FormFooterErrorChip,
} from "@/components/ui/FormFooterChip";

import type { QuestionFormDraft } from "./questionFormTypes";

interface QuestionFormFooterSummaryProps {
  questionDraft: QuestionFormDraft;
}

export function QuestionFormFooterSummary({ questionDraft }: QuestionFormFooterSummaryProps): React.JSX.Element {
  const { t } = useTranslation();

  if (!questionDraft.text) {
    return (
      <FormFooterErrorChip>
        {t("questionBank.validation.textRequired")}
      </FormFooterErrorChip>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <FormFooterEntityChip className="truncate max-w-[12.5rem]">
        {questionDraft.text}
      </FormFooterEntityChip>
      <div className="flex items-center gap-1.5">
        <FormFooterBadge className="capitalize">
          {t(`questionBank.type.${questionDraft.type}` as AppTranslationKey)}
        </FormFooterBadge>
        <FormFooterBadge tone="info" className="capitalize">
          {t(`questionBank.difficulty.${questionDraft.difficulty}` as AppTranslationKey)}
        </FormFooterBadge>
      </div>
    </div>
  );
}
