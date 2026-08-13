import { apiJson } from '@/lib/apiClient';
import type { QuestionBankSettings, QuestionBankModulePreferences } from '@mms/shared';

export const questionBankSetupConfigApi = {
  fetchFieldConfig: async (): Promise<Partial<QuestionBankSettings>> => {
    return await apiJson('/api/question-bank/config/fields');
  },

  updateFieldConfig: async (
    draft: Partial<QuestionBankSettings>,
  ): Promise<Partial<QuestionBankSettings>> => {
    return await apiJson('/api/question-bank/config/fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
  },

  fetchPreferences: async (): Promise<Partial<QuestionBankModulePreferences>> => {
    return await apiJson('/api/question-bank/config/preferences');
  },

  updatePreferences: async (
    draft: Partial<QuestionBankModulePreferences>,
  ): Promise<Partial<QuestionBankModulePreferences>> => {
    return await apiJson('/api/question-bank/config/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
  },

  fetchComposedConfig: async (): Promise<QuestionBankSettings> => {
    return await apiJson('/api/question-bank/config/composed');
  },
};
