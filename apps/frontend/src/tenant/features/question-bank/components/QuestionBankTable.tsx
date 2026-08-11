import type { JSX } from 'react';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
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
  isColumnVisible: (key: string) => boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelectedQuestion: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
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
  isColumnVisible,
  allVisibleSelected,
  someVisibleSelected,
  getColumnWidth,
  onColumnResize,
  onEditQuestion,
  onTrashAction,
  onToggleSelectedQuestion,
  onToggleSelectAll,
}: QuestionBankTableProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`${WORK_SURFACE} hidden md:block`}>
      <Table className="table-fixed">
        <caption className="sr-only">{t('questionBank.questions')}</caption>
        <QuestionBankTableHeader
          canDelete={canDelete}
          isColumnVisible={isColumnVisible}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          onToggleSelectAll={onToggleSelectAll}
        />
        <TableBody className="divide-y divide-border/50">
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
              isColumnVisible={isColumnVisible}
              onEditQuestion={onEditQuestion}
              onTrashAction={onTrashAction}
              onToggleSelected={onToggleSelectedQuestion}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
