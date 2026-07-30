import type { JSX } from "react";
import { motion } from "framer-motion";
import { Edit2, RotateCcw, Trash2 } from "lucide-react";
import {
  formatQuestionSourcesCitation,
  splitQuestionCompoundAnswer,
  type QuestionBankQuestion as Question,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import { renderQuestionMetaChip, SYSTEM_FIELD_IDS } from "@/tenant/features/question-bank/components/questionBankListShared";

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;
type QuestionBankField = QuestionBankConfig["orderedFields"][number];

interface QuestionBankListCardsProps {
  questions: Question[];
  config: QuestionBankConfig;
  difficultyConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  listMetaFields: QuestionBankField[];
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  canTrashRows: boolean;
  showDeleted: boolean;
  showText: boolean;
  showSourceCitation: boolean;
  isColumnVisible?: (key: string) => boolean;
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
}

export function QuestionBankListCards({
  questions,
  config,
  difficultyConfig,
  typeConfig,
  listMetaFields,
  selectedIds,
  canWrite,
  canDelete,
  canTrashRows,
  showDeleted,
  showText,
  showSourceCitation,
  isColumnVisible,
  onEditQuestion,
  onTrashAction,
  onToggleSelected,
}: QuestionBankListCardsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-3 md:hidden" role="list">
      {questions.map((question, questionIndex) => (
        <motion.article
          key={question.id}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: questionIndex * 0.03 }}
          className="group space-y-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {showText && config.isFieldEnabled("text") && (
                <p className="mb-2 text-sm font-semibold leading-snug text-foreground">{question.text}</p>
              )}
              {listMetaFields.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {listMetaFields.map((field) => renderQuestionMetaChip(question, field.id, config, difficultyConfig, typeConfig))}
                </div>
              )}
              {config.isFieldEnabled("options") && question.type === "mcq" && question.options && question.options.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {question.options.filter(Boolean).map((option, optionIndex) => (
                    <span
                      key={optionIndex}
                      className={`rounded-md border px-2 py-0.5 text-xs ${option === question.answer ? "border-primary/30 bg-primary/5 font-semibold text-primary" : "border-border bg-muted text-muted-foreground"}`}
                    >
                      {option === question.answer ? `✓ ` : ""}{option}
                    </span>
                  ))}
                </div>
              )}
              {config.isFieldEnabled("answer") && question.type === "true_false" && (
                <p className="mt-1.5 text-xs font-semibold text-primary">✓ {question.answer}</p>
              )}
              {question.type === "fill_blank" && question.answer && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("questionBank.previewFillBlank", {
                    answers: splitQuestionCompoundAnswer(question.answer).join(", "),
                  })}
                </p>
              )}
              {question.type === "matching" && question.options.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("questionBank.previewMatching")}
                  </p>
                  {question.options.map((left, index) => (
                    <p key={index} className="text-xs text-foreground">
                      {left} → {splitQuestionCompoundAnswer(question.answer)[index] ?? "—"}
                    </p>
                  ))}
                </div>
              )}
              {question.type === "numeric" && question.answer && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("questionBank.previewNumeric", { answer: question.answer })}
                  {question.options[0] ? ` (±${question.options[0]})` : ""}
                </p>
              )}
              {question.type === "ordering" && question.options.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("questionBank.previewOrdering")}
                  </p>
                  <ol className="mt-1 list-decimal space-y-0.5 ps-4 text-xs text-foreground">
                    {question.options.filter(Boolean).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}
              {showSourceCitation && (() => {
                const citation = formatQuestionSourcesCitation(question, t, config.sourceBooks);
                if (!citation) return null;
                return (
                  <p className="mt-2 text-xs leading-snug text-muted-foreground">
                    <span className="font-semibold text-foreground/80">{t("questionBank.sourceReference")}:</span>{" "}
                    {citation}
                  </p>
                );
              })()}
              {config.orderedFields
                .filter((field) => !SYSTEM_FIELD_IDS.has(field.id) && config.isFieldEnabled(field.id) && (isColumnVisible ? isColumnVisible(field.id) : true))
                .map((field) => {
                  const fieldValue = (question as unknown as Record<string, unknown>)[field.id];
                  if (fieldValue === undefined || fieldValue === "") return null;
                  return (
                    <p key={field.id} className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold">{config.fieldLabel(field.id, field.label)}:</span>{" "}
                      {Array.isArray(fieldValue) ? fieldValue.join(", ") : String(fieldValue)}
                    </p>
                  );
                })}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {canDelete && (
                <Checkbox
                  checked={selectedIds.includes(question.id)}
                  onCheckedChange={(checked) => onToggleSelected(question.id, checked === true)}
                  aria-label={t("questionBank.deleteQuestionAria", { text: question.text })}
                />
              )}
              {canWrite && !showDeleted && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditQuestion(question)}
                  className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t("questionBank.editQuestionAria", { text: question.text })}
                >
                  <Edit2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )}
              {canTrashRows && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onTrashAction(question.id)}
                  className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={showDeleted ? t("questionBank.trash.restore") : t("questionBank.deleteQuestionAria", { text: question.text })}
                >
                  {showDeleted ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
                </Button>
              )}
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
