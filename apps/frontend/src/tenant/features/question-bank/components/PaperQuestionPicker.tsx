import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect, type FormSelectOption } from "@/components/ui/FormSelect";
import {
  getQuestionCategoryIds,
  QUESTION_DIFFICULTY_BADGE_CLASSES,
  type QuestionBankQuestion as Question,
} from "@mms/shared";
import type { DifficultyFilter, PaperSection } from "@/tenant/features/question-bank/components/paperBuilderUtils";

interface QuestionCategoryBadge {
  color: string;
  name: string;
}

interface PaperQuestionPickerProps {
  activeSection?: PaperSection;
  categoryById: Map<string, QuestionCategoryBadge>;
  categoryFilter: string;
  categoryOptions: readonly FormSelectOption[];
  difficultyFilter: DifficultyFilter;
  difficultyLabel: (difficulty: Question["difficulty"]) => string;
  difficultyOptions: readonly FormSelectOption[];
  questions: Question[];
  search: string;
  selectedQuestionIds: Set<string>;
  onAddQuestion: (questionId: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onDifficultyFilterChange: (value: DifficultyFilter) => void;
  onSearchChange: (value: string) => void;
}

export function PaperQuestionPicker({
  activeSection,
  categoryById,
  categoryFilter,
  categoryOptions,
  difficultyFilter,
  difficultyLabel,
  difficultyOptions,
  questions,
  search,
  selectedQuestionIds,
  onAddQuestion,
  onCategoryFilterChange,
  onDifficultyFilterChange,
  onSearchChange,
}: PaperQuestionPickerProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="mb-3">
        <h3 className="m-0 text-[13px] font-bold text-foreground">{t("questionBank.addQuestionsFromBank")}</h3>
        <p className="m-0 text-[11px] text-muted-foreground">
          {activeSection ? t("questionBank.addingToSection", { title: activeSection.title }) : t("questionBank.noActiveSection")}
        </p>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        <Input
          className={`${FORM_INPUT} shadow-none sm:col-span-2 md:col-span-3`}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("questionBank.searchPlaceholder")}
          aria-label={t("questionBank.searchPlaceholder")}
        />
        <FormSelect value={categoryFilter} onChange={onCategoryFilterChange} options={categoryOptions} />
        <FormSelect
          value={difficultyFilter}
          onChange={(value) => onDifficultyFilterChange(value as DifficultyFilter)}
          options={difficultyOptions}
        />
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 sm:max-h-[460px] lg:max-h-[560px]">
        {questions.length === 0 ? (
          <p className="m-0 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            {t("questionBank.noQuestionsAvailable")}
          </p>
        ) : (
          questions.map((question) => {
            const selected = selectedQuestionIds.has(question.id);
            const diffCls = QUESTION_DIFFICULTY_BADGE_CLASSES[question.difficulty] ?? "";
            return (
              <div key={question.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <p className="m-0 flex-1 text-xs font-semibold leading-snug text-foreground">{question.text}</p>
                  <Button
                    type="button"
                    onClick={() => onAddQuestion(question.id)}
                    disabled={!activeSection || selected}
                    size="sm"
                    className="h-auto w-full px-3 py-1.5 text-xs sm:w-auto"
                  >
                    {selected ? t("questionBank.questionAdded") : t("questionBank.addToPaper")}
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {getQuestionCategoryIds(question).map((categoryId) => {
                    const category = categoryById.get(categoryId);
                    if (!category) return null;
                    return (
                      <span key={categoryId} className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: category.color }}>
                        {category.name}
                      </span>
                    );
                  })}
                  <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${diffCls}`}>
                    {difficultyLabel(question.difficulty)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
