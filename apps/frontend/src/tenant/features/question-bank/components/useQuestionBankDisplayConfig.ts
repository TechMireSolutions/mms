import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { QUESTION_TYPE_ICONS, isQuestionSourceFieldId, type QuestionBankQuestion } from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

export function useQuestionBankDisplayConfig(config: QuestionBankConfig) {
  const { t } = useTranslation();

  const difficultyConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    easy: { label: config.difficultyLabel('easy'), cls: SEMANTIC_BADGE.success },
    medium: { label: config.difficultyLabel('medium'), cls: SEMANTIC_BADGE.warning },
    hard: { label: config.difficultyLabel('hard'), cls: SEMANTIC_BADGE.destructive },
  }), [config]);

  const typeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => (
    Object.fromEntries(
      Object.keys(QUESTION_TYPE_ICONS).map((typeId) => [
        typeId,
        {
          label: `${QUESTION_TYPE_ICONS[typeId as keyof typeof QUESTION_TYPE_ICONS]} ${config.typeLabel(typeId)}`,
          cls: SEMANTIC_BADGE.muted,
        },
      ]),
    )
  ), [config]);

  return { difficultyConfig, typeConfig };
}

export function useQuestionBankTrashHandlers(options: {
  showDeleted: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const {
    showDeleted,
    selectedIds,
    setSelectedIds,
    onDelete,
    onRestore,
    onBulkDelete,
    onBulkRestore,
  } = options;

  const handleRowTrashAction = async (id: string): Promise<void> => {
    if (showDeleted) {
      await onRestore?.(id);
      return;
    }
    if (!confirm(t('questionBank.trash.deleteConfirm'))) return;
    await onDelete?.(id);
  };

  const handleBulkTrashAction = async (): Promise<void> => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t('questionBank.trash.bulkRestoreConfirm', { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t('questionBank.trash.bulkDeleteConfirm', { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  return { handleRowTrashAction, handleBulkTrashAction };
}

export function buildQuestionBankListMetaFields(
  config: QuestionBankConfig,
  isColumnVisible?: (key: string) => boolean,
) {
  return config.orderedFields.filter((field) => {
    if (!config.isFieldEnabled(field.id)) return false;
    const colKey =
      field.id === 'categoryId'
        ? 'category'
        : field.id === 'questionLanguage'
          ? 'language'
          : field.id;
    return isColumnVisible ? isColumnVisible(colKey) : true;
  });
}

export function shouldShowQuestionSourceCitation(
  config: QuestionBankConfig,
  showSource: boolean,
): boolean {
  return showSource && config.orderedFields.some(
    (field) => isQuestionSourceFieldId(field.id) && config.isFieldEnabled(field.id),
  );
}

export type { QuestionBankQuestion };
