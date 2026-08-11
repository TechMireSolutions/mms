import type { JSX } from "react";
import {
  formatQuestionSourcesCitation,
  splitQuestionCompoundAnswer,
  type QuestionBankQuestion as Question,
} from "@mms/shared";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { QuestionBankRowActions } from "@/tenant/features/question-bank/components/QuestionBankRowActions";
import { renderQuestionMetaChip, SYSTEM_FIELD_IDS } from "@/tenant/features/question-bank/components/questionBankListShared";
import type { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;
type QuestionBankField = QuestionBankConfig["orderedFields"][number];

interface QuestionBankListCardsProps {
  questions: Question[];
  config: QuestionBankConfig;
  difficultyConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  listMetaFields: QuestionBankField[];
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canTrashRows: boolean;
  showDeleted: boolean;
  showSourceCitation: boolean;
  isColumnVisible: (key: string) => boolean;
  onToggleSelectAll: (checked: boolean) => void;
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
  allVisibleSelected,
  someVisibleSelected,
  canWrite,
  canDelete,
  canTrashRows,
  showDeleted,
  showSourceCitation,
  isColumnVisible,
  onToggleSelectAll,
  onEditQuestion,
  onTrashAction,
  onToggleSelected,
}: QuestionBankListCardsProps): JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = formatDirectoryPageCountLabel(questions.length, t, {
    singular: "questionBank.item.question",
    plural: "questionBank.item.questions",
  });

  return (
    <>
      {canDelete && questions.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="question-bank-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t("questionBank.table.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("questionBank.trash.selected", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {questions.map((question) => {
          const isSelected = selectedIds.includes(question.id);

          return (
            <DirectoryEntityCard key={question.id} isSelected={isSelected} reducedMotion={reducedMotion}>
              <DirectoryCardHeader
                id={question.id}
                displayName={question.text}
                isSelected={isSelected}
                showSelect={canDelete}
                onSelect={() => onToggleSelected(question.id, !isSelected)}
                selectAriaLabel={t("questionBank.table.selectQuestion", { text: question.text })}
                onView={() => {
                  if (canWrite && !showDeleted) onEditQuestion(question);
                }}
                viewAriaLabel={t("questionBank.editQuestionAria", { text: question.text })}
                reducedMotion={reducedMotion}
                subtitle={
                  listMetaFields.length > 0 ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {listMetaFields.map((field) => renderQuestionMetaChip(question, field.id, config, difficultyConfig, typeConfig))}
                    </div>
                  ) : undefined
                }
              />

              <div className="ms-1 space-y-2">
                {config.isFieldEnabled("options") && question.type === "mcq" && question.options && question.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
                  <p className="text-xs font-semibold text-primary">✓ {question.answer}</p>
                )}
                {question.type === "fill_blank" && question.answer && (
                  <p className="text-xs text-muted-foreground">
                    {t("questionBank.previewFillBlank", {
                      answers: splitQuestionCompoundAnswer(question.answer).join(", "),
                    })}
                  </p>
                )}
                {question.type === "matching" && question.options.length > 0 && (
                  <div className="space-y-1">
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
                  <p className="text-xs text-muted-foreground">
                    {t("questionBank.previewNumeric", { answer: question.answer })}
                    {question.options[0] ? ` (±${question.options[0]})` : ""}
                  </p>
                )}
                {question.type === "ordering" && question.options.length > 0 && (
                  <div>
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
                    <p className="text-xs leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground/80">{t("questionBank.sourceReference")}:</span>{" "}
                      {citation}
                    </p>
                  );
                })()}
                {config.orderedFields
                  .filter((field) => !SYSTEM_FIELD_IDS.has(field.id) && config.isFieldEnabled(field.id) && isColumnVisible(field.id))
                  .map((field) => {
                    const fieldValue = (question as unknown as Record<string, unknown>)[field.id];
                    if (fieldValue === undefined || fieldValue === "") return null;
                    return (
                      <p key={field.id} className="text-xs text-muted-foreground">
                        <span className="font-semibold">{config.fieldLabel(field.id, field.label)}:</span>{" "}
                        {Array.isArray(fieldValue) ? fieldValue.join(", ") : String(fieldValue)}
                      </p>
                    );
                  })}
              </div>

              <DirectoryCardFooter
                trailing={
                  <QuestionBankRowActions
                    question={question}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    canTrashRows={canTrashRows}
                    showDeleted={showDeleted}
                    hideViewItem
                    triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
                    onEditQuestion={onEditQuestion}
                    onTrashAction={onTrashAction}
                  />
                }
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}
