import type { JSX } from 'react';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { QuestionBankTableHeader } from '@/tenant/features/question-bank/components/QuestionBankTableHeader';
import { QuestionBankTableRow } from '@/tenant/features/question-bank/components/QuestionBankTableRow';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

interface QuestionBankTableProps {
  questions: Question[];
  config: QuestionBankConfig;
  difficultyConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  selectedIds: string[];
  canWrite: boolean;
  canDelete: boolean;
  canTrashRows: boolean;
  showDeleted: boolean;
  showText: boolean;
  showCategory: boolean;
  showLanguage: boolean;
  showType: boolean;
  showDifficulty: boolean;
  showSource: boolean;
  allFilteredSelected: boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onToggleSelectAllFiltered: (checked: boolean) => void;
}

export function QuestionBankTable({
  questions,
  config,
  difficultyConfig,
  typeConfig,
  selectedIds,
  canWrite,
  canDelete,
  canTrashRows,
  showDeleted,
  showText,
  showCategory,
  showLanguage,
  showType,
  showDifficulty,
  showSource,
  allFilteredSelected,
  getColumnWidth,
  onColumnResize,
  onEditQuestion,
  onTrashAction,
  onToggleSelected,
  onToggleSelectAllFiltered,
}: QuestionBankTableProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">{t('questionBank.questions')}</caption>
        <QuestionBankTableHeader
          canDelete={canDelete}
          showText={showText}
          showCategory={showCategory}
          showLanguage={showLanguage}
          showType={showType}
          showDifficulty={showDifficulty}
          showSource={showSource}
          allFilteredSelected={allFilteredSelected}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          onToggleSelectAllFiltered={onToggleSelectAllFiltered}
        />
        <tbody className="divide-y divide-border/50">
          {questions.map((question, questionIndex) => (
            <QuestionBankTableRow
              key={question.id}
              question={question}
              questionIndex={questionIndex}
              config={config}
              difficultyConfig={difficultyConfig}
              typeConfig={typeConfig}
              selectedIds={selectedIds}
              canWrite={canWrite}
              canDelete={canDelete}
              canTrashRows={canTrashRows}
              showDeleted={showDeleted}
              showText={showText}
              showCategory={showCategory}
              showLanguage={showLanguage}
              showType={showType}
              showDifficulty={showDifficulty}
              showSource={showSource}
              onEditQuestion={onEditQuestion}
              onTrashAction={onTrashAction}
              onToggleSelected={onToggleSelected}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
