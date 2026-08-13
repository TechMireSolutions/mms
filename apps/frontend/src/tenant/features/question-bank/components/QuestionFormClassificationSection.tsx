import { Tag } from "lucide-react";
import { APP_LANGUAGES, formatLanguageSelectLabel, type AppLanguageCode, type AppTranslationKey, type QuestionCategory, type QuestionDifficulty } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_SELECT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { CategorySelector } from "@/tenant/features/question-bank/components/CategorySelector";

import type { QuestionFormDraft, QuestionFormErrors, UpdateQuestionDraft } from "./questionFormTypes";

interface QuestionFormClassificationSectionProps {
  questionDraft: QuestionFormDraft;
  errors: QuestionFormErrors;
  updateDraft: UpdateQuestionDraft;
  categories: QuestionCategory[];
  onCreateCategory: (category: QuestionCategory) => Promise<QuestionCategory[] | void> | QuestionCategory[] | void;
}

export function QuestionFormClassificationSection({
  questionDraft,
  errors,
  updateDraft,
  categories,
  onCreateCategory,
}: QuestionFormClassificationSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
          <Tag className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("questionBank.form.classification")}</h3>
        </div>

        <Field label={t("questionBank.form.questionLanguage")}>
          <FormSelect
            id="qb-question-language"
            className={FORM_SELECT}
            value={questionDraft.questionLanguage}
            onChange={(val) => updateDraft({ questionLanguage: val as AppLanguageCode })}
            options={APP_LANGUAGES.map((appLanguage) => ({ value: appLanguage.code, label: formatLanguageSelectLabel(appLanguage) }))}
          />
        </Field>

        <Field label={t("questionBank.form.difficulty")}>
          <FormSelect
            id="qb-difficulty"
            className={FORM_SELECT}
            value={questionDraft.difficulty}
            onChange={(val) => updateDraft({ difficulty: val as QuestionDifficulty })}
            options={[
              { value: "easy", label: t("questionBank.difficulty.easy") },
              { value: "medium", label: t("questionBank.difficulty.medium") },
              { value: "hard", label: t("questionBank.difficulty.hard") },
            ]}
          />
        </Field>

        <CategorySelector
          multiple
          categories={categories}
          value={questionDraft.categoryIds}
          onChange={(ids) => {
            const list = Array.isArray(ids) ? ids : [ids].filter(Boolean);
            updateDraft({ categoryIds: list });
          }}
          onCreateCategory={onCreateCategory}
          required
          translate={(key) => t(key as AppTranslationKey)}
        />
        <FieldErrorMessage message={errors.categoryIds} />
      </Card>
    </div>
  );
}
