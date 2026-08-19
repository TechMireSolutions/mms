import { HelpCircle } from "lucide-react";
import { type AppTranslationKey, type QuestionType } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { QuestionTypeAnswerFields } from "@/tenant/features/question-bank/components/QuestionTypeAnswerFields";

import type { QuestionFormDraft, QuestionFormErrors, UpdateQuestionDraft } from "./questionFormTypes";

interface QuestionFormAnswerFieldsProps {
  questionDraft: QuestionFormDraft;
  errors: QuestionFormErrors;
  updateDraft: UpdateQuestionDraft;
}

const COMPOUND_ANSWER_TYPES = new Set<QuestionType>([
  "fill_blank",
  "matching",
  "numeric",
  "ordering",
]);

export function QuestionFormAnswerFields({
  questionDraft,
  errors,
  updateDraft,
}: QuestionFormAnswerFieldsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const trueLabel = t("questionBank.true");
  const falseLabel = t("questionBank.false");

  if (questionDraft.type === "mcq") {
    return (
      <div className="sm:col-span-2">
        <span className={FORM_LABEL}>{t("questionBank.optionsLabel")}</span>
        <div className="space-y-2 mt-1.5" role="radiogroup">
          {questionDraft.options.slice(0, 4).map((optionValue, optionIndex) => (
            <div key={optionIndex} className="relative flex items-center group/input w-full gap-2">
              <label
                htmlFor={`qb-choice-radio-${optionIndex}`}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
              >
                <input
                  id={`qb-choice-radio-${optionIndex}`}
                  type="radio"
                  name="answer"
                  value={optionValue}
                  checked={questionDraft.answer === optionValue && !!optionValue}
                  onChange={() => updateDraft({ answer: optionValue })}
                  aria-label={t("questionBank.markChoiceCorrect", { n: optionIndex + 1 })}
                  className="h-4 w-4 shrink-0 accent-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
              </label>
              <div className="relative flex items-center w-full">
                <HelpCircle className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  type="text"
                  className={`${FORM_INPUT} ps-10`}
                  value={optionValue}
                  onChange={(e) => {
                    const nextOptions = [...questionDraft.options];
                    nextOptions[optionIndex] = e.target.value;
                    updateDraft({ options: nextOptions });
                  }}
                  placeholder={t("questionBank.optionN", { n: optionIndex + 1 })}
                />
              </div>
            </div>
          ))}
        </div>
        <FieldErrorMessage message={errors.answer} />
      </div>
    );
  }

  if (questionDraft.type === "true_false") {
    return (
      <div className="sm:col-span-2">
        <span className={FORM_LABEL}>{t("questionBank.correctAnswer")} *</span>
        <div className="flex gap-3 mt-1.5">
          {[trueLabel, falseLabel].map((answerValue) => (
            <Button
              key={answerValue}
              type="button"
              variant="outline"
              onClick={() => updateDraft({ answer: answerValue })}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${questionDraft.answer === answerValue ? "border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {answerValue}
            </Button>
          ))}
        </div>
        <FieldErrorMessage message={errors.answer} />
      </div>
    );
  }

  if (questionDraft.type === "short") {
    return (
      <div className="sm:col-span-2">
        <Field label={t("questionBank.modelAnswer")}>
          <Textarea
            id="qb-answer"
            name="answer"
            value={questionDraft.answer || ""}
            onChange={(e) => updateDraft({ answer: e.target.value })}
            placeholder={t("questionBank.modelAnswerPlaceholder")}
          />
        </Field>
      </div>
    );
  }

  if (COMPOUND_ANSWER_TYPES.has(questionDraft.type)) {
    return (
      <QuestionTypeAnswerFields
        questionType={questionDraft.type}
        text={String(questionDraft.text ?? "")}
        options={questionDraft.options}
        answer={String(questionDraft.answer ?? "")}
        onOptionsChange={(next) => updateDraft({ options: next })}
        onAnswerChange={(next) => updateDraft({ answer: next })}
        t={(key) => t(key as AppTranslationKey)}
      />
    );
  }

  return null;
}
