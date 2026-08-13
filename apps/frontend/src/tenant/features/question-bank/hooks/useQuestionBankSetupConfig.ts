import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionBankSetupConfigApi } from './questionBankSetupConfigApi';
import type { QuestionBankSettings } from '@mms/shared';
import {
  DEFAULT_QUESTION_BANK_SETTINGS,
  stripQuestionBankFieldConfigForPersist,
  composeQuestionBankSettings,
  normalizeQuestionBankModulePreferences,
  normalizeQuestionBankFieldConfigOnly,
} from '@mms/shared';

const QUERY_KEY_COMPOSED = ['question-bank', 'config', 'composed'] as const;
const QUERY_KEY_FIELDS = ['question-bank', 'config', 'fields'] as const;
const QUERY_KEY_PREFS = ['question-bank', 'config', 'preferences'] as const;

export function useComposedQuestionBankSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY_COMPOSED,
    queryFn: async () => await questionBankSetupConfigApi.fetchComposedConfig(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (draft: QuestionBankSettings) => {
      const fieldConfigOnly = stripQuestionBankFieldConfigForPersist(draft);
      const prefsOnly = normalizeQuestionBankModulePreferences(draft);
      
      const [updatedFields, updatedPrefs] = await Promise.all([
        questionBankSetupConfigApi.updateFieldConfig(fieldConfigOnly),
        questionBankSetupConfigApi.updatePreferences(prefsOnly),
      ]);
      
      return composeQuestionBankSettings(
        normalizeQuestionBankFieldConfigOnly(updatedFields),
        normalizeQuestionBankModulePreferences(updatedPrefs)
      );
    },
    onSuccess: (composedSettings) => {
      queryClient.setQueryData(QUERY_KEY_COMPOSED, composedSettings);
      
      // Update the individual cached slices if they exist
      const fieldConfigOnly = stripQuestionBankFieldConfigForPersist(composedSettings);
      const prefsOnly = normalizeQuestionBankModulePreferences(composedSettings);
      queryClient.setQueryData(QUERY_KEY_FIELDS, fieldConfigOnly);
      queryClient.setQueryData(QUERY_KEY_PREFS, prefsOnly);
    },
  });

  return {
    data: query.data ?? DEFAULT_QUESTION_BANK_SETTINGS,
    isLoading: query.isLoading,
    isError: query.isError,
    updateAsync: mutation.mutateAsync,
  };
}
