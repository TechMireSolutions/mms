import { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import type { useQuestionBankMutations } from '@/tenant/features/question-bank/hooks/useQuestionBankApi';

type QuestionBankTrashMutations = Pick<
  ReturnType<typeof useQuestionBankMutations>,
  'deleteQuestion' | 'restoreQuestion' | 'bulkDeleteQuestions' | 'bulkRestoreQuestions'
>;

export function useQuestionBankTrashActions(mutations: QuestionBankTrashMutations) {
  const { t } = useTranslation();
  const { deleteQuestion, restoreQuestion, bulkDeleteQuestions, bulkRestoreQuestions } = mutations;

  const notifyTrashFailure = useCallback((error: unknown) => {
    notify.error(t('questionBank.trash.actionFailed'), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const handleDeleteQuestion = useCallback(async (id: string) => {
    try {
      await deleteQuestion.mutateAsync(id);
      notify.success(t('questionBank.trash.deleted'));
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [deleteQuestion, notifyTrashFailure, t]);

  const handleRestoreQuestion = useCallback(async (id: string) => {
    try {
      await restoreQuestion.mutateAsync(id);
      notify.success(t('questionBank.trash.restored'));
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [restoreQuestion, notifyTrashFailure, t]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteQuestions.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('questionBank.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('questionBank.trash.deleted'));
      }
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [bulkDeleteQuestions, notifyTrashFailure, t]);

  const handleBulkRestore = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkRestoreQuestions.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('questionBank.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('questionBank.trash.restored'));
      }
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [bulkRestoreQuestions, notifyTrashFailure, t]);

  return {
    handleDeleteQuestion,
    handleRestoreQuestion,
    handleBulkDelete,
    handleBulkRestore,
  };
}
