import type { JSX } from "react";
import type { QuestionBankQuestion as Question } from "@mms/shared";
import { EntityCardFooterActions } from "@/components/ui/EntityCardFooterActions";
import { ENTITY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/entityCardChrome";
import { EntityCard } from "@/components/ui/EntityCard";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { QuestionsRowActions } from "@/tenant/features/question-bank/components/QuestionsRowActions";
import { renderQuestionMetaChip, SYSTEM_FIELD_IDS } from "@/tenant/features/question-bank/components/questionsListShared";
import type { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import { QuestionCardAnswerPreview } from "./QuestionCardAnswerPreview";

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;
type QuestionBankField = QuestionBankConfig["orderedFields"][number];

export interface QuestionCardProps {
  question: Question;
  config: QuestionBankConfig;
  difficultyConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  listMetaFields: QuestionBankField[];
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  canTrashRows: boolean;
  showDeleted: boolean;
  showSourceCitation: boolean;
  isColumnVisible: (key: string) => boolean;
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onRowClick?: (id: string) => void;
  reducedMotion: boolean;
}

export function QuestionCard({
  question,
  config,
  difficultyConfig,
  typeConfig,
  listMetaFields,
  selectedIds,
  canWrite,
  canDelete,
  canTrashRows,
  showDeleted,
  showSourceCitation,
  isColumnVisible,
  onEditQuestion,
  onTrashAction,
  onToggleSelected,
  onRowClick,
  reducedMotion,
}: QuestionCardProps): JSX.Element {
  const { t } = useTranslation();
  const canEdit = canWrite && !showDeleted;

  const { isSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: question,
    selectedIds,
    onToggleSelected,
    onView: canEdit ? () => onEditQuestion(question) : undefined,
    canSelect: canDelete,
  });

  const visibleCustomFields = config.orderedFields.filter(
    (field) => !SYSTEM_FIELD_IDS.has(field.id) && config.isFieldEnabled(field.id) && isColumnVisible(field.id),
  );

  return (
    <EntityCard
      key={question.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      {...cardProps}
      onClick={onRowClick ? () => onRowClick(question.id) : undefined}
    >
      <EntityCard.Header
        id={question.id}
        displayName={question.text}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t("questionBank.table.selectQuestion", { text: question.text })}
        onView={canEdit ? handleView : undefined}
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

      <QuestionCardAnswerPreview
        question={question}
        config={config}
        showSourceCitation={showSourceCitation}
        visibleCustomFields={visibleCustomFields}
        t={t}
      />

      <EntityCardFooterActions
        overflowActions={
          <QuestionsRowActions
            question={question}
            canWrite={canWrite}
            canDelete={canDelete}
            canTrashRows={canTrashRows}
            showDeleted={showDeleted}
            hideViewItem
            triggerClassName={ENTITY_CARD_OVERFLOW_TRIGGER_CLASS}
            onEditQuestion={onEditQuestion}
            onTrashAction={onTrashAction}
          />
        }
      />
    </EntityCard>
  );
}
