import type { JSX } from 'react';
import { motion } from 'framer-motion';
import { Edit2, RotateCcw, Trash2 } from 'lucide-react';
import {
  formatQuestionSourcesCitation,
  getQuestionCategoryIds,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { CategoryColorChip } from '@/tenant/features/question-bank/components/CategoryColorChip';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

export interface QuestionBankTableRowProps {
  question: Question;
  questionIndex: number;
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
  onEditQuestion: (question: Question) => void;
  onTrashAction: (id: string) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
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
  showText,
  showCategory,
  showLanguage,
  showType,
  showDifficulty,
  showSource,
  onEditQuestion,
  onTrashAction,
  onToggleSelected,
}: QuestionBankTableRowProps): JSX.Element {
  const { t } = useTranslation();
  const getCategory = (id: string) => config.categories.find((category) => category.id === id);
  const citation = showSource
    ? formatQuestionSourcesCitation(question, t, config.sourceBooks)
    : '';

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: questionIndex * 0.03 }}
      className="group transition-colors hover:bg-muted/20"
    >
      {canDelete && (
        <td className="px-3 py-3">
          <Checkbox
            checked={selectedIds.includes(question.id)}
            onCheckedChange={(checked) => onToggleSelected(question.id, checked === true)}
            aria-label={t('questionBank.deleteQuestionAria', { text: question.text })}
          />
        </td>
      )}
      {showText && (
        <td className="max-w-[17.5rem] px-4 py-3 text-sm font-semibold text-foreground">
          <p className="m-0 line-clamp-2">{question.text}</p>
        </td>
      )}
      {showCategory && (
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {getQuestionCategoryIds(question).map((categoryId) => {
              const category = getCategory(categoryId);
              if (!category) return null;
              return (
                <CategoryColorChip key={categoryId} name={category.name} color={category.color} icon={category.icon} />
              );
            })}
          </div>
        </td>
      )}
      {showLanguage && (
        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {config.questionLanguageLabel(question.questionLanguage)}
        </td>
      )}
      {showType && (
        <td className="whitespace-nowrap px-4 py-3">
          <StatusBadge status={question.type} config={typeConfig} size="sm" />
        </td>
      )}
      {showDifficulty && (
        <td className="px-4 py-3">
          <StatusBadge status={question.difficulty} config={difficultyConfig} size="sm" />
        </td>
      )}
      {showSource && (
        <td className="max-w-[12.5rem] truncate px-4 py-3 text-xs text-muted-foreground">
          {citation || '—'}
        </td>
      )}
      <td className="px-4 py-3 text-end">
        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          {canWrite && !showDeleted && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEditQuestion(question)}
              className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('questionBank.editQuestionAria', { text: question.text })}
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
              aria-label={showDeleted ? t('questionBank.trash.restore') : t('questionBank.deleteQuestionAria', { text: question.text })}
            >
              {showDeleted ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
