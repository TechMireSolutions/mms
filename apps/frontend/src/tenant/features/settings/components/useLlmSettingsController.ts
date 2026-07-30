import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useDragControls } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsGlobalDraft } from '@/lib/contexts/SettingsGlobalDraftContext';
import { useOverlayBehavior } from '@/hooks/useOverlayBehavior';
import { apiJson } from '@/lib/apiClient';
import {
  LLM_PROVIDERS_META,
  formatLlmSpeed,
  getLlmProviderDefaultModel,
  resolveLlmModel,
  type LlmConfig,
  type LlmProviderType,
  type LlmTestResult,
} from '@mms/shared';
import type { SandboxMessage } from './llmSettingsTypes';

type LlmHealthStatus = 'verified' | 'failed' | 'testing' | 'untested';

export function useLlmSettingsController() {
  const { t } = useTranslation();
  const {
    data,
    isGlobalDirty,
    saving,
    saved,
    upd,
    handleSaveGlobal,
  } = useSettingsGlobalDraft();

  const configs = useMemo(() => data.llmConfigs ?? [], [data.llmConfigs]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null);

  const modalRef = useOverlayBehavior<HTMLDivElement>({
    open: modalOpen,
    onClose: () => setModalOpen(false),
  });

  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<LlmProviderType>('gemini');
  const [formModel, setFormModel] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formIsDefaultText, setFormIsDefaultText] = useState(false);
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formMaxTokens, setFormMaxTokens] = useState(2048);
  const [formTopP, setFormTopP] = useState(0.9);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);
  const dragControls = useDragControls();
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<LlmTestResult | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<LlmTestResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthStatuses, setHealthStatuses] = useState<Record<string, LlmHealthStatus>>({});
  const [sandboxMessages, setSandboxMessages] = useState<SandboxMessage[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxConfigId, setSandboxConfigId] = useState<string>('');
  const [sandboxSystemInstruction, setSandboxSystemInstruction] = useState('');
  const [sandboxTesting, setSandboxTesting] = useState(false);

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

  const runHealthCheck = useCallback(async (configId: string) => {
    setHealthStatuses((prev) => ({ ...prev, [configId]: 'testing' }));
    try {
      const res = await apiJson<{ success: boolean }>('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Respond only with the word: ok',
          configId,
        }),
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: res.success ? 'verified' : 'failed' }));
    } catch {
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'failed' }));
    }
  }, []);

  useEffect(() => {
    configs.forEach((config) => {
      if (!healthStatuses[config.id]) {
        void runHealthCheck(config.id);
      }
    });
  }, [configs, healthStatuses, runHealthCheck]);

  const handleModalTestConnection = async () => {
    setModalTesting(true);
    setModalTestResult(null);

    const targetModel = resolveLlmModel(formModel, formProvider);
    const targetApiKey = formApiKey.trim() === '' && editingConfig
      ? editingConfig.apiKey
      : formApiKey.trim();

    const customConfig = {
      id: editingConfig?.id ?? 'temp-config',
      name: formName.trim() || 'Temporary Config',
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
      const res = await apiJson<LlmTestResult>('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test connectivity check',
          customConfig,
        }),
      });
      setModalTestResult(res);
    } catch (err: unknown) {
      setModalTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test connection request failed',
      });
    } finally {
      setModalTesting(false);
    }
  };

  const handleSendSandboxMessage = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const promptText = sandboxInput.trim();
    if (!promptText || sandboxTesting) return;

    const targetConfigId = sandboxConfigId || configs.find((config) => config.isDefaultText)?.id || configs[0]?.id;
    if (!targetConfigId) return;

    const userMsg: SandboxMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: promptText,
    };

    setSandboxMessages((prev) => [...prev, userMsg]);
    setSandboxInput('');
    setSandboxTesting(true);

    const historyForApi = [...sandboxMessages, userMsg].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const res = await apiJson<LlmTestResult>('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: sandboxSystemInstruction.trim() || undefined,
          configId: targetConfigId,
          messages: historyForApi,
        }),
      });

      if (res.success && res.response) {
        setSandboxMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.response as string,
            metrics: res.metrics,
          },
        ]);
      } else {
        setSandboxMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.message || 'Error occurred while testing connection.',
            error: true,
          },
        ]);
      }
    } catch (err: unknown) {
      setSandboxMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Failed to send message.',
          error: true,
        },
      ]);
    } finally {
      setSandboxTesting(false);
    }
  };

  const openAddModal = () => {
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
    setFetchedModels([]);
    setShowCustomModelInput(false);
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
    setFetchedModels([]);
    setShowCustomModelInput(false);
    setModalOpen(true);
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

  const handleDeleteConfig = (configId: string) => {
    const updatedConfigs = configs.filter((config) => config.id !== configId);

    if (configs.find((config) => config.id === configId)?.isDefaultText && updatedConfigs.length > 0) {
      updatedConfigs[0] = { ...updatedConfigs[0], isDefaultText: true };
    }

    upd('llmConfigs', updatedConfigs);
    if (testResult?.configId === configId) {
      setTestResult(null);
    }
  };

  const handleTestConnection = async (configId: string) => {
    setTestingId(configId);
    setTestResult(null);

    try {
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'testing' }));

      const res = await apiJson<LlmTestResult>('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Write a short greeting for a school portal.', configId }),
      });
      setTestResult({
        configId,
        success: res.success,
        response: res.response,
        message: res.message,
        metrics: res.metrics,
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: res.success ? 'verified' : 'failed' }));
    } catch (err: unknown) {
      setTestResult({
        configId,
        success: false,
        message: err instanceof Error ? err.message : 'Test request failed',
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'failed' }));
    } finally {
      setTestingId(null);
    }
  };

  const selectedProviderMeta = LLM_PROVIDERS_META[formProvider];

  return {
    t,
    isGlobalDirty,
    saving,
    saved,
    handleSaveGlobal,
    configListProps: {
      configs,
      searchQuery,
      setSearchQuery,
      healthStatuses,
      testingId,
      testResult,
      isGlobalDirty,
      openAddModal,
      openEditModal,
      handleDeleteConfig,
      handleTestConnection,
      formatLlmSpeed,
      t,
    },
    sandboxProps: {
      configs,
      sandboxMessages,
      setSandboxMessages,
      sandboxInput,
      setSandboxInput,
      sandboxConfigId,
      setSandboxConfigId,
      sandboxSystemInstruction,
      setSandboxSystemInstruction,
      sandboxTesting,
      handleSendSandboxMessage,
      formatLlmSpeed,
      t,
    },
    modalProps: {
      modalOpen,
      modalRef,
      dragControls,
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
      handleSaveModalConfig,
      handleModalTestConnection,
      formatLlmSpeed,
      t,
    },
  };
}
