import { BookOpen } from "lucide-react";
import { type QuestionType } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { FORM_SELECT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { QuestionFormAnswerFields } from "./QuestionFormAnswerFields";

import type { QuestionFormDraft, QuestionFormErrors, UpdateQuestionDraft } from "./questionFormTypes";

interface QuestionFormContentSectionProps {
  questionDraft: QuestionFormDraft;
  errors: QuestionFormErrors;
  updateDraft: UpdateQuestionDraft;
}

export function QuestionFormContentSection({
  questionDraft,
  errors,
  updateDraft,
}: QuestionFormContentSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const trueLabel = t("questionBank.true");
  const falseLabel = t("questionBank.false");

  return (
    <div className="space-y-5 text-start">
      <Card accentColor="info" className="p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
          <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("questionBank.form.content")}</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t("questionBank.questionText")} required error={errors.text}>
              <Textarea
                id="qb-text"
                name="text"
                value={questionDraft.text || ""}
                onChange={(e) => updateDraft({ text: e.target.value })}
                placeholder={t("questionBank.questionTextPlaceholder")}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={t("questionBank.type")}>
              <FormSelect
                id="qb-type"
                className={FORM_SELECT}
                value={questionDraft.type}
                onChange={(val) => {
                  const nextType = val as QuestionType;
                  const options = nextType === "mcq" ? ["", "", "", ""] : nextType === "true_false" ? [trueLabel, falseLabel] : [];
                  updateDraft({ type: nextType, options, answer: "" });
                }}
                options={[
                  { value: "mcq", label: t("questionBank.type.mcq") },
                  { value: "true_false", label: t("questionBank.type.true_false") },
                  { value: "short", label: t("questionBank.type.short") },
                  { value: "fill_blank", label: t("questionBank.type.fill_blank") },
                  { value: "matching", label: t("questionBank.type.matching") },
                  { value: "ordering", label: t("questionBank.type.ordering") },
                  { value: "numeric", label: t("questionBank.type.numeric") },
                ]}
              />
            </Field>
          </div>

          <QuestionFormAnswerFields questionDraft={questionDraft} errors={errors} updateDraft={updateDraft} />
        </div>
      </Card>
    </div>
  );
}
