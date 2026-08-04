import type { JSX } from "react";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { QuestionBankTable } from "@/tenant/features/question-bank/components/QuestionBankTable";
import { QuestionBankListCards } from "@/tenant/features/question-bank/components/QuestionBankListCards";
import type { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import type { QuestionBankQuestion as Question } from "@mms/shared";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;
type QuestionBankField = QuestionBankConfig["orderedFields"][number];

interface QuestionBankListProps {
  viewMode: WorkDirectoryViewMode;
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
  showSourceCitation: boolean;
  allFilteredSelected: boolean;
  isColumnVisible: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onToggleSelectAllFiltered: (checked: boolean) => void;
}

export function QuestionBankList(props: QuestionBankListProps): JSX.Element {
  if (props.viewMode === "cards") {
    return (
      <QuestionBankListCards
        questions={props.questions}
        config={props.config}
        difficultyConfig={props.difficultyConfig}
        typeConfig={props.typeConfig}
        listMetaFields={props.listMetaFields}
        selectedIds={props.selectedIds}
        canWrite={props.canWrite}
        canDelete={props.canDelete}
        canTrashRows={props.canTrashRows}
        showDeleted={props.showDeleted}
        showSourceCitation={props.showSourceCitation}
        isColumnVisible={props.isColumnVisible}
        onEditQuestion={props.onEditQuestion}
        onTrashAction={props.onTrashAction}
        onToggleSelected={props.onToggleSelected}
      />
    );
  }

  return (
    <QuestionBankTable
      questions={props.questions}
      config={props.config}
      difficultyConfig={props.difficultyConfig}
      typeConfig={props.typeConfig}
      selectedIds={props.selectedIds}
      canWrite={props.canWrite}
      canDelete={props.canDelete}
      canTrashRows={props.canTrashRows}
      showDeleted={props.showDeleted}
      isColumnVisible={props.isColumnVisible}
      allFilteredSelected={props.allFilteredSelected}
      getColumnWidth={props.getColumnWidth}
      onColumnResize={props.onColumnResize}
      onEditQuestion={props.onEditQuestion}
      onTrashAction={props.onTrashAction}
      onToggleSelected={props.onToggleSelected}
      onToggleSelectAllFiltered={props.onToggleSelectAllFiltered}
    />
  );
}
