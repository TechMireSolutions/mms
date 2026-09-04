import type { JSX } from 'react';
import { motion } from 'framer-motion';
import {
  formatQuestionSourcesCitation,
  getQuestionCategoryIds,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from '@/components/ui/ModuleRowActionsMenu';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { TableCell } from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { CategoryColorChip } from '@/tenant/features/question-bank/components/CategoryColorChip';
import { QuestionsRowActions } from '@/tenant/features/question-bank/components/QuestionsRowActions';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

export interface QuestionBankTableRowProps {
  question: Question;
  questionIndex: number;
  config: QuestionBankConfig;
  difficultyConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  selectedIds: string[] | ReadonlySet<string>;
  canWrite: boolean;
  canDelete: boolean;
  canTrashRows: boolean;
  showDeleted: boolean;
  isColumnVisible: (key: string) => boolean;
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onRowClick?: (id: string) => void;
}

export function QuestionBankTableRow({
  question,
  questionIndex,
  config,
  difficultyConfig,
  typeConfig,
  selectedIds,
  canWrite,
  canDelete,
  canTrashRows,
  showDeleted,
  isColumnVisible,
  onEditQuestion,
  onTrashAction,
  onToggleSelected,
  onRowClick,
}: QuestionBankTableRowProps): JSX.Element {
  const { t } = useTranslation();
  const categoryMap = new Map(config.categories.map((category) => [category.id, category]));
  const showSource = isColumnVisible('source');
  const citation = showSource
    ? formatQuestionSourcesCitation(question, t, config.sourceBooks)
    : '';
  const isSelected = Array.isArray(selectedIds) ? selectedIds.includes(question.id) : selectedIds.has(question.id);

  return (
    <motion.tr
      onClick={() => onRowClick?.(question.id)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: questionIndex * 0.03 }}
      className={`group transition-colors hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-primary/5" : ""}`}
    >
      {canDelete && (
        <TableCell className="px-3 py-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggleSelected(question.id, checked === true)}
            aria-label={t('questionBank.deleteQuestionAria', { text: question.text })}
          />
        </TableCell>
      )}
      {isColumnVisible('text') && (
        <TableCell className="max-w-sidebar-mobile px-4 py-3 text-sm font-semibold text-foreground">
          <p className="m-0 line-clamp-2">{question.text}</p>
        </TableCell>
      )}
      {isColumnVisible('category') && (
        <TableCell className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {getQuestionCategoryIds(question).map((categoryId) => {
              const category = categoryMap.get(categoryId);
              if (!category) return null;
              return (
                <CategoryColorChip key={categoryId} name={category.name} color={category.color} icon={category.icon} />
              );
            })}
          </div>
        </TableCell>
      )}
      {isColumnVisible('language') && (
        <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {config.questionLanguageLabel(question.questionLanguage)}
        </TableCell>
      )}
      {isColumnVisible('type') && (
        <TableCell className="whitespace-nowrap px-4 py-3">
          <StatusBadge status={question.type} config={typeConfig} size="sm" />
        </TableCell>
      )}
      {isColumnVisible('difficulty') && (
        <TableCell className="px-4 py-3">
          <StatusBadge status={question.difficulty} config={difficultyConfig} size="sm" />
        </TableCell>
      )}
      {showSource && (
        <TableCell className="max-w-cell-lg truncate px-4 py-3 text-xs text-muted-foreground">
          {citation || '—'}
        </TableCell>
      )}
      <TableCell className="px-4 py-3 text-end">
        <QuestionsRowActions
          question={question}
          canWrite={canWrite}
          canDelete={canDelete}
          canTrashRows={canTrashRows}
          showDeleted={showDeleted}
          hideViewItem
          triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
          onEditQuestion={onEditQuestion}
          onTrashAction={onTrashAction}
        />
      </TableCell>
    </motion.tr>
  );
}
