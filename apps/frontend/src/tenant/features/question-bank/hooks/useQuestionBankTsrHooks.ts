/**
 * Phase 7: Contract-driven query/mutation hooks for the Question Bank module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  QUESTION_BANK_QUESTIONS_QUERY_KEY,
  QUESTION_BANK_TESTS_QUERY_KEY,
  QUESTION_BANK_RESULTS_QUERY_KEY,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import { invalidateQuestionBankQueries } from '@/tenant/features/question-bank/hooks/invalidateQuestionBankQueries';

export function useQuestionBankContractList(query: Record<string, unknown> = {}, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.listQuestions.useQuery({
    queryKey: [...QUESTION_BANK_QUESTIONS_QUERY_KEY, 'contract-list', query],
    queryData: { query: query as any },
    staleTime: 15_000,
    enabled,
  });
}

export function useQuestionBankContractTests(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.listTests.useQuery({
    queryKey: [...QUESTION_BANK_TESTS_QUERY_KEY, 'contract-list'],
    queryData: { query: {} },
    staleTime: 30_000,
    enabled,
  });
}

export function useQuestionBankContractResults(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.listResults.useQuery({
    queryKey: [...QUESTION_BANK_RESULTS_QUERY_KEY, 'contract-list'],
    queryData: { query: {} },
    staleTime: 30_000,
    enabled,
  });
}

export function useQuestionBankContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.bulkDeleteQuestions.useMutation({
    onSuccess: () => invalidateQuestionBankQueries(queryClient),
  });
}

export function useQuestionBankContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.bulkRestoreQuestions.useMutation({
    onSuccess: () => invalidateQuestionBankQueries(queryClient),
  });
}

export function useQuestionBankContractDeleteQuestion() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.deleteQuestion.useMutation({
    onSuccess: () => invalidateQuestionBankQueries(queryClient),
  });
}

export function useQuestionBankContractRestoreQuestion() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.questionBank.restoreQuestion.useMutation({
    onSuccess: () => invalidateQuestionBankQueries(queryClient),
  });
}
