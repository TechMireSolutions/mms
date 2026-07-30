import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/apiClient';
import { getLlmProviderDefaultModel, type LlmConfig, type LlmProviderType } from '@mms/shared';

interface UseLlmModelFetchOptions {
  formApiKey: string;
  formProvider: LlmProviderType;
  formBaseUrl: string;
  formModel: string;
  modalOpen: boolean;
  editingConfig: LlmConfig | null;
  setFormModel: (value: string) => void;
}

export function useLlmModelFetch({
  formApiKey,
  formProvider,
  formBaseUrl,
  formModel,
  modalOpen,
  editingConfig,
  setFormModel,
}: UseLlmModelFetchOptions) {
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);

  useEffect(() => {
    const key = formApiKey.trim();
    if (!key && (!editingConfig || !editingConfig.apiKey)) {
      setFetchedModels([]);
      return;
    }

    const timer = window.setTimeout(() => {
      const fetchModels = async () => {
        setFetchingModels(true);
        try {
          const res = await apiJson<{ success: boolean; models: string[] }>('/api/ai/models', {
            method: 'POST',
            body: JSON.stringify({
              provider: formProvider,
              apiKey: key || undefined,
              configId: editingConfig?.id,
              baseUrl: formBaseUrl.trim() || undefined,
            }),
          });
          if (res.success && res.models && res.models.length > 0) {
            setFetchedModels(res.models);
            setShowCustomModelInput(false);
            if (formModel.trim() === '' || !res.models.includes(formModel)) {
              const defaultModel = getLlmProviderDefaultModel(formProvider);
              if (res.models.includes(defaultModel)) {
                setFormModel(defaultModel);
              } else if (!formModel) {
                setFormModel(res.models[0]);
              }
            }
          } else {
            setFetchedModels([]);
          }
        } catch {
          setFetchedModels([]);
        } finally {
          setFetchingModels(false);
        }
      };
      void fetchModels();
    }, 800);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formApiKey, formProvider, formBaseUrl, modalOpen]);

  return { fetchedModels, fetchingModels, showCustomModelInput, setShowCustomModelInput, clearFetchedModels: () => setFetchedModels([]) };
}
