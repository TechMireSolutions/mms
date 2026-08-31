import { useState } from 'react';
import { apiContract } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import {
  LLM_PROVIDERS_META,
  getLlmProviderDefaultModel,
  resolveLlmModel,
  type LlmConfig,
  type LlmProviderType,
  type LlmTestResult,
} from '@mms/shared';
import { useLlmModelFetch } from './useLlmModelFetch';

interface UseLlmSettingsModalOptions {
  configs: LlmConfig[];
  upd: (key: 'llmConfigs', value: LlmConfig[]) => void;
}

export function useLlmSettingsModal({ configs, upd }: UseLlmSettingsModalOptions) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null);

  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<LlmProviderType>('gemini');
  const [formModel, setFormModel] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formIsDefaultText, setFormIsDefaultText] = useState(false);
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formMaxTokens, setFormMaxTokens] = useState(2048);
  const [formTopP, setFormTopP] = useState(0.9);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<LlmTestResult | null>(null);

  const { fetchedModels, fetchingModels, showCustomModelInput, setShowCustomModelInput, clearFetchedModels } = useLlmModelFetch({
    formApiKey,
    formProvider,
    formBaseUrl,
    formModel,
    modalOpen,
    editingConfig,
    setFormModel,
  });

  const resetFormForAdd = () => {
    setEditingConfig(null);
    setFormName('');
    setFormProvider('gemini');
    setFormModel(getLlmProviderDefaultModel('gemini'));
    setFormBaseUrl('');
    setFormApiKey('');
    setFormIsDefaultText(configs.length === 0);
    setFormTemperature(0.7);
    setFormMaxTokens(2048);
    setFormTopP(0.9);
    setModalTestResult(null);
    setShowCustomModelInput(false);
  };

  const openAddModal = () => {
    resetFormForAdd();
    clearFetchedModels();
    setModalOpen(true);
  };

  const openEditModal = (config: LlmConfig) => {
    setEditingConfig(config);
    setFormName(config.name);
    setFormProvider(config.provider);
    setFormModel(config.model);
    setFormBaseUrl(config.baseUrl ?? '');
    setFormApiKey('');
    setFormIsDefaultText(config.isDefaultText);
    setFormTemperature(config.temperature ?? 0.7);
    setFormMaxTokens(config.maxTokens ?? 2048);
    setFormTopP(config.topP ?? 0.9);
    setModalTestResult(null);
    clearFetchedModels();
    setShowCustomModelInput(false);
    setModalOpen(true);
  };

  const handleModalTestConnection = async () => {
    setModalTesting(true);
    setModalTestResult(null);

    const targetModel = resolveLlmModel(formModel, formProvider);
    const targetApiKey = formApiKey.trim() === '' && editingConfig
      ? editingConfig.apiKey
      : formApiKey.trim();

    const customConfig = {
      id: editingConfig?.id ?? 'temp-config',
      name: formName.trim() || t('settings.llmTemporaryConfig'),
      provider: formProvider,
      model: targetModel,
      baseUrl: formBaseUrl.trim() || undefined,
      apiKey: targetApiKey,
      isDefaultText: formIsDefaultText,
      temperature: formTemperature,
      maxTokens: formMaxTokens,
      topP: formTopP,
    };

    try {
      const res = await apiContract.ai.test({
        body: {
          prompt: 'Test connectivity check',
          customConfig,
        },
      });
      const status = res.status;
      const body = res.body as LlmTestResult;
      if (status !== 200) {
        throw new Error(body.message || 'Failed to test connection');
      }
      setModalTestResult(body);
    } catch (err: unknown) {
      setModalTestResult({
        success: false,
        message: (err instanceof Error ? err.message : undefined) || t('settings.llmTestConnectionFailed'),
      });
    } finally {
      setModalTesting(false);
    }
  };

  const handleSaveModalConfig = () => {
    if (!formName.trim()) return;

    const targetModel = resolveLlmModel(formModel, formProvider);
    const targetApiKey = formApiKey.trim() === '' && editingConfig
      ? editingConfig.apiKey
      : formApiKey.trim();

    const nextConfig: LlmConfig = {
      id: editingConfig?.id ?? crypto.randomUUID(),
      name: formName.trim(),
      provider: formProvider,
      model: targetModel,
      baseUrl: formBaseUrl.trim() || undefined,
      apiKey: targetApiKey,
      isDefaultText: formIsDefaultText,
      temperature: formTemperature,
      maxTokens: formMaxTokens,
      topP: formTopP,
    };

    let updatedConfigs = [...configs];

    if (formIsDefaultText) {
      updatedConfigs = updatedConfigs.map((config) => ({ ...config, isDefaultText: false }));
    }

    if (editingConfig) {
      updatedConfigs = updatedConfigs.map((config) => (config.id === editingConfig.id ? nextConfig : config));
    } else {
      updatedConfigs.push(nextConfig);
    }

    if (updatedConfigs.length > 0 && !updatedConfigs.some((config) => config.isDefaultText)) {
      updatedConfigs[0] = { ...updatedConfigs[0], isDefaultText: true };
    }

    upd('llmConfigs', updatedConfigs);
    setModalOpen(false);
  };

  const selectedProviderMeta = LLM_PROVIDERS_META[formProvider];

  return {
    modalOpen,
    editingConfig,
    formName,
    setFormName,
    formProvider,
    setFormProvider,
    formModel,
    setFormModel,
    formBaseUrl,
    setFormBaseUrl,
    formApiKey,
    setFormApiKey,
    formIsDefaultText,
    setFormIsDefaultText,
    formTemperature,
    setFormTemperature,
    formMaxTokens,
    setFormMaxTokens,
    formTopP,
    setFormTopP,
    fetchedModels,
    fetchingModels,
    showCustomModelInput,
    setShowCustomModelInput,
    selectedProviderDefaultModel: selectedProviderMeta?.defaultModel,
    modalTestResult,
    modalTesting,
    setModalOpen,
    openAddModal,
    openEditModal,
    handleSaveModalConfig,
    handleModalTestConnection,
  };
}
