import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Globe,
  Send,
  X,
  Search,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsGlobalDraft } from '@/lib/contexts/SettingsGlobalDraftContext';
import { FormSelect } from '@/components/ui/FormSelect';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import { apiJson } from '@/lib/apiClient';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';
import { LLM_PROVIDERS_META, type LlmProviderType, type LlmConfig } from '@mms/shared';
import { Slider } from '@/components/ui/slider';


const PROVIDER_METADATA: Record<string, { badgeBg: string; textCol: string; accentBorder: string }> = {
  gemini: { badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300', textCol: 'text-indigo-600', accentBorder: 'border-indigo-500/20' },
  openai: { badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', textCol: 'text-emerald-600', accentBorder: 'border-emerald-500/20' },
  anthropic: { badgeBg: 'bg-amber-600/10 text-amber-700 dark:text-amber-300', textCol: 'text-amber-600', accentBorder: 'border-amber-500/20' },
  deepseek: { badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', textCol: 'text-blue-600', accentBorder: 'border-blue-500/20' },
  openrouter: { badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300', textCol: 'text-purple-600', accentBorder: 'border-purple-500/20' },
  groq: { badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', textCol: 'text-orange-600', accentBorder: 'border-orange-500/20' },
  alibaba: { badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', textCol: 'text-rose-600', accentBorder: 'border-rose-500/20' },
};

const PROVIDERS = Object.values(LLM_PROVIDERS_META);

export default function LlmSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    data,
    isGlobalDirty,
    saving,
    saved,
    upd,
    handleSaveGlobal,
  } = useSettingsGlobalDraft();

  const configs = data.llmConfigs ?? [];

  // Modal open states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<LlmConfig['provider']>('gemini');
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

  // Automatically fetch models when API Key, Provider, or Base URL changes
  useEffect(() => {
    const key = formApiKey.trim();
    // If editing and key is empty, it means we are using the saved masked key
    // We can fetch resolving it from backend using configId
    if (!key && (!editingConfig || !editingConfig.apiKey)) {
      setFetchedModels([]);
      return;
    }

    const timer = setTimeout(() => {
      const fetchModels = async () => {
        setFetchingModels(true);
        try {
          const res = await apiJson<{ success: boolean; models: string[] }>(
            '/api/ai/models',
            {
              method: 'POST',
              body: JSON.stringify({
                provider: formProvider,
                apiKey: key || undefined,
                configId: editingConfig?.id,
                baseUrl: formBaseUrl.trim() || undefined,
              }),
            }
          );
          if (res.success && res.models && res.models.length > 0) {
            setFetchedModels(res.models);
            setShowCustomModelInput(false);
            if (formModel.trim() === '' || !res.models.includes(formModel)) {
              // select default model if current is empty
              const defaultModel = LLM_PROVIDERS_META[formProvider]?.defaultModel ?? '';
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
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [formApiKey, formProvider, formBaseUrl, modalOpen]);

  const dragControls = useDragControls();

  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<{
    success: boolean;
    response?: string;
    message?: string;
    metrics?: {
      latencyMs: number;
      characterCount: number;
      wordCount: number;
    };
  } | null>(null);

  const handleModalTestConnection = async () => {
    setModalTesting(true);
    setModalTestResult(null);

    const targetModel = formModel.trim() || (LLM_PROVIDERS_META[formProvider]?.defaultModel ?? '');
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
      const res = await apiJson<{
        success: boolean;
        response?: string;
        message?: string;
        metrics?: {
          latencyMs: number;
          characterCount: number;
          wordCount: number;
        };
      }>(
        '/api/ai/test',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Test connectivity check',
            customConfig,
          }),
        }
      );
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

  // Connection testing state (can test within modal or globally)
  const [testPrompt, setTestPrompt] = useState('Write a short greeting for a school portal.');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    configId: string;
    success: boolean;
    response?: string;
    message?: string;
    metrics?: {
      latencyMs: number;
      characterCount: number;
      wordCount: number;
    };
  } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Health check statuses
  const [healthStatuses, setHealthStatuses] = useState<
    Record<string, 'verified' | 'failed' | 'testing' | 'untested'>
  >({});

  // Background health check logic
  const runHealthCheck = async (configId: string) => {
    setHealthStatuses((prev) => ({ ...prev, [configId]: 'testing' }));
    try {
      const res = await apiJson<{ success: boolean }>(
        '/api/ai/test',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Respond only with the word: ok',
            configId,
          }),
        }
      );
      setHealthStatuses((prev) => ({ ...prev, [configId]: res.success ? 'verified' : 'failed' }));
    } catch {
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'failed' }));
    }
  };

  useEffect(() => {
    // Run silent health checks for all configs when they are loaded or changed
    configs.forEach((config) => {
      if (!healthStatuses[config.id]) {
        void runHealthCheck(config.id);
      }
    });
  }, [configs]);

  // Sandbox states (conversational)
  interface SandboxMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    metrics?: {
      latencyMs: number;
      characterCount: number;
      wordCount: number;
    };
    error?: boolean;
  }

  const [sandboxMessages, setSandboxMessages] = useState<SandboxMessage[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxConfigId, setSandboxConfigId] = useState<string>('');
  const [sandboxSystemInstruction, setSandboxSystemInstruction] = useState('');
  const [sandboxTesting, setSandboxTesting] = useState(false);

  const handleSendSandboxMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = sandboxInput.trim();
    if (!promptText || sandboxTesting) return;

    const targetConfigId = sandboxConfigId || configs.find(c => c.isDefaultText)?.id || configs[0]?.id;
    if (!targetConfigId) return;

    const userMsg: SandboxMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: promptText,
    };

    setSandboxMessages((prev) => [...prev, userMsg]);
    setSandboxInput('');
    setSandboxTesting(true);

    const historyForApi = [...sandboxMessages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await apiJson<{
        success: boolean;
        response?: string;
        message?: string;
        metrics?: {
          latencyMs: number;
          characterCount: number;
          wordCount: number;
        };
      }>(
        '/api/ai/test',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: promptText,
            systemInstruction: sandboxSystemInstruction.trim() || undefined,
            configId: targetConfigId,
            messages: historyForApi,
          }),
        }
      );

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
    } catch (err: any) {
      setSandboxMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err.message || 'Failed to send message.',
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
    setFormModel(LLM_PROVIDERS_META.gemini.defaultModel);
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
    // Mask API Key on load - do not populate on frontend to prevent leakage.
    // If it's saved, we show placeholder and preserve it if not typed over.
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

    const targetModel = formModel.trim() || (LLM_PROVIDERS_META[formProvider]?.defaultModel ?? '');
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
      updatedConfigs = updatedConfigs.map((c) => ({ ...c, isDefaultText: false }));
    }

    if (editingConfig) {
      updatedConfigs = updatedConfigs.map((c) => (c.id === editingConfig.id ? nextConfig : c));
    } else {
      updatedConfigs.push(nextConfig);
    }

    // Ensure at least one default if configurations exist
    if (updatedConfigs.length > 0 && !updatedConfigs.some((c) => c.isDefaultText)) {
      updatedConfigs[0].isDefaultText = true;
    }

    upd('llmConfigs', updatedConfigs);
    setModalOpen(false);
  };

  const handleDeleteConfig = (id: string) => {
    const updatedConfigs = configs.filter((c) => c.id !== id);

    // If deleted config was default, reassign default to the first remaining
    if (configs.find((c) => c.id === id)?.isDefaultText && updatedConfigs.length > 0) {
      updatedConfigs[0].isDefaultText = true;
    }

    upd('llmConfigs', updatedConfigs);
    if (testResult?.configId === id) {
      setTestResult(null);
    }
  };

  const handleTestConnection = async (configId: string, customConfig?: LlmConfig) => {
    setTestingId(configId);
    setTestResult(null);

    try {
      const payload: Record<string, any> = { prompt: testPrompt };
      if (customConfig) {
        payload.configId = customConfig.id;
      } else {
        payload.configId = configId;
      }

      setHealthStatuses((prev) => ({ ...prev, [configId]: 'testing' }));

      const res = await apiJson<{
        success: boolean;
        response?: string;
        message?: string;
        metrics?: {
          latencyMs: number;
          characterCount: number;
          wordCount: number;
        };
      }>(
        '/api/ai/test',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      setTestResult({
        configId,
        success: res.success,
        response: res.response,
        message: res.message,
        metrics: res.metrics,
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: res.success ? 'verified' : 'failed' }));
    } catch (err: any) {
      setTestResult({
        configId,
        success: false,
        message: err.message || 'Test request failed',
      });
      setHealthStatuses((prev) => ({ ...prev, [configId]: 'failed' }));
    } finally {
      setTestingId(null);
    }
  };

  const selectedProviderMeta = LLM_PROVIDERS_META[formProvider];

  return (
    <SettingsPanel
      width="medium"
      introKey="settings.llmDesc"
      isDirty={isGlobalDirty}
      saved={saved}
      footer={
        <SettingsFormActions
          saveLabel={t('global.saveSettings')}
          savingLabel={t('global.saving')}
          onSave={() => void handleSaveGlobal()}
          dirty={isGlobalDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <div className="space-y-6">
        <SectionCard
          title={t('settings.llmTitle')}
          subtitle={t('settings.llmSubtitle')}
          icon={Brain}
          actions={
            <Button onClick={openAddModal} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> {t('settings.llmAddConfig')}
            </Button>
          }
        >
          <div className="space-y-4">
            <SettingsCallout>
              {t('settings.llmNotice')}
            </SettingsCallout>

            {configs.length > 0 && (
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground/75" />
                <Input
                  type="text"
                  placeholder={t('settings.llmSearchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            )}

            {configs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                <Brain className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="font-semibold text-sm">{t('settings.llmNoConfigsTitle')}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {t('settings.llmNoConfigsDesc')}
                </p>
              </div>
            ) : (() => {
              const filtered = configs.filter((c) => {
                const query = searchQuery.toLowerCase().trim();
                if (!query) return true;
                return (
                  c.name.toLowerCase().includes(query) ||
                  c.provider.toLowerCase().includes(query) ||
                  c.model.toLowerCase().includes(query)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center rounded-2xl border p-8 text-center bg-muted/10">
                    <Search className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="font-medium text-xs">{t('settings.llmNoMatches')}</p>
                  </div>
                );
              }

              return (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((config) => {
                    const meta = PROVIDER_METADATA[config.provider] || {
                      badgeBg: 'bg-muted text-muted-foreground',
                      textCol: 'text-muted-foreground',
                      accentBorder: 'border-border'
                    };
                    const status = healthStatuses[config.id] || 'untested';
                    return (
                      <motion.div
                        key={config.id}
                        layout
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.15 }}
                        className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                          config.isDefaultText
                            ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-sm'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 truncate">
                              <span className="shrink-0 flex items-center justify-center">
                                {status === 'testing' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                                ) : status === 'verified' ? (
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0" title="Active Connection" />
                                ) : status === 'failed' ? (
                                  <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.7)] shrink-0" title="Connection Failed" />
                                ) : (
                                  <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] shrink-0" title="Untested" />
                                )}
                              </span>
                              <h4 className="font-bold text-sm truncate">{config.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {config.isDefaultText && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">
                                  <Check className="h-3 w-3" /> {t('settings.llmTextDefault')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{t('settings.llmModelToken')}</span>
                              <span className="font-mono text-[10px] bg-muted px-2 py-1 rounded leading-none truncate">{config.model}</span>
                            </div>
                            {config.baseUrl && (
                              <div className="flex items-center gap-2 truncate">
                                <Globe className="h-4 w-4 shrink-0" />
                                <span className="font-mono text-[10px] truncate">{config.baseUrl}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleTestConnection(config.id)}
                            disabled={testingId !== null || isGlobalDirty}
                            className="h-7 text-[11px] px-3"
                          >
                            {testingId === config.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              t('settings.llmTestApi')
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(config)}
                            className="h-7 text-[11px] p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteConfig(config.id)}
                            className="h-7 text-[11px] text-destructive hover:bg-destructive/10 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </SectionCard>

        {testResult && (
          <SectionCard
            title={t('settings.llmTestResultTitle')}
            subtitle={t('settings.llmTestResultDesc')}
            icon={Sparkles}
          >
            <div
              className={`rounded-xl border p-4 text-sm ${
                testResult.success
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300'
                  : 'border-destructive/20 bg-destructive/5 text-destructive-foreground'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="space-y-1 w-full overflow-hidden">
                  <p className="font-semibold">
                    {testResult.success ? t('settings.llmTestSuccess') : t('settings.llmTestFailed')}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed opacity-90 font-mono text-xs mb-3">
                    {testResult.success ? testResult.response : testResult.message}
                  </p>
                  {testResult.success && testResult.metrics && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-emerald-500/10 pt-3 text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                      <div>
                        <span className="block font-normal text-muted-foreground/85">{t('settings.llmLatency')}</span>
                        <span>{testResult.metrics.latencyMs} ms</span>
                      </div>
                      <div>
                        <span className="block font-normal text-muted-foreground/85">{t('settings.llmWordCount')}</span>
                        <span>{testResult.metrics.wordCount} words</span>
                      </div>
                      <div>
                        <span className="block font-normal text-muted-foreground/85">{t('settings.llmCharCount')}</span>
                        <span>{testResult.metrics.characterCount} chars</span>
                      </div>
                      <div>
                        <span className="block font-normal text-muted-foreground/85">{t('settings.llmSpeed')}</span>
                        <span>
                          {testResult.metrics.latencyMs > 0
                            ? `${(testResult.metrics.wordCount / (testResult.metrics.latencyMs / 1000)).toFixed(1)} W/s`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {configs.length > 0 && (
          <SectionCard
            title={t('settings.llmSandboxTitle')}
            subtitle={t('settings.llmSandboxSubtitle')}
            icon={MessageSquare}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sandboxConfig">{t('settings.llmActiveConfig')}</Label>
                  <FormSelect
                    id="sandboxConfig"
                    value={sandboxConfigId || configs.find(c => c.isDefaultText)?.id || configs[0]?.id || ''}
                    onChange={(v) => setSandboxConfigId(v)}
                    options={configs.map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.provider} - ${c.model})` + (c.isDefaultText ? ' (Default)' : ''),
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sandboxSystem">{t('settings.llmSystemInstruction')}</Label>
                  <Input
                    id="sandboxSystem"
                    value={sandboxSystemInstruction}
                    onChange={(e) => setSandboxSystemInstruction(e.target.value)}
                    placeholder="e.g. Respond only in short bullet points"
                  />
                </div>
              </div>

              {/* Chat Session Window */}
              <div className="border border-border bg-muted/10 rounded-2xl flex flex-col overflow-hidden shadow-inner">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{t('settings.llmSandboxHistory')}</span>
                  </div>
                  {sandboxMessages.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSandboxMessages([])}
                      className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" /> {t('settings.llmClearHistory')}
                    </Button>
                  )}
                </div>

                {/* Messages Panel */}
                <div className="flex-1 min-h-[220px] max-h-[360px] overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {sandboxMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 my-6 opacity-60">
                      <Sparkles className="h-8 w-8 text-primary mb-2.5 animate-pulse" />
                      <p className="font-semibold text-xs text-foreground">{t('settings.llmSandboxReady')}</p>
                      <p className="text-[11px] text-muted-foreground max-w-[280px] mt-1">
                        {t('settings.llmSandboxReadyDesc')}
                      </p>
                    </div>
                  ) : (
                    sandboxMessages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                              isUser
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : msg.error
                                ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none font-mono text-[11px]'
                                : 'bg-card text-foreground border border-border rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {!isUser && msg.metrics && (
                            <div className="flex items-center gap-3 mt-1.5 px-2 text-[9px] font-semibold text-muted-foreground/80">
                              <span>{t('settings.llmLatency')}: {msg.metrics.latencyMs}ms</span>
                              <span>•</span>
                              <span>{t('settings.llmWordCount')}: {msg.metrics.wordCount}</span>
                              <span>•</span>
                              <span>{t('settings.llmSpeed')}: {msg.metrics.latencyMs > 0 ? `${(msg.metrics.wordCount / (msg.metrics.latencyMs / 1000)).toFixed(1)} W/s` : 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {sandboxTesting && (
                    <div className="flex items-center gap-2 text-muted-foreground px-2 py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      <span className="text-[10px] font-medium animate-pulse">{t('settings.llmThinking')}</span>
                    </div>
                  )}
                </div>

                {/* Chat Input Footer */}
                <form
                  onSubmit={(e) => {
                    void handleSendSandboxMessage(e);
                  }}
                  className="flex items-center gap-2 border-t border-border p-3 bg-card shrink-0"
                >
                  <Input
                    type="text"
                    placeholder={t('settings.llmSandboxInputPlaceholder')}
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    disabled={sandboxTesting}
                    className="flex-1 h-9 text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sandboxTesting || !sandboxInput.trim()}
                    className="h-9 px-3 gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('common.send')}</span>
                  </Button>
                </form>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {modalOpen && (
        <>
          {/* Subtle click-away backdrop */}
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 pointer-events-none" />

          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-ml-64 sm:right-auto z-50 w-auto sm:w-[512px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden max-h-[85vh]"
          >
            {/* Grab Handle Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 select-none shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-foreground leading-tight">
                    {editingConfig ? t('settings.llmModalEditTitle') : t('settings.llmModalAddTitle')}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {t('settings.llmModalRepositionDesc')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="p-1.5 h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveModalConfig();
              }}
              className="flex flex-col p-5 min-h-0 overflow-hidden"
            >
              {/* Scrollable inputs container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 min-h-0 max-h-[50vh]">
                <div className="space-y-2">
                  <Label htmlFor="configName">{t('settings.llmModalName')}</Label>
                  <Input
                    id="configName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t('settings.llmModalNamePlaceholder')}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="provider">{t('settings.llmModalProvider')}</Label>
                    <FormSelect
                      id="provider"
                      value={formProvider}
                      onChange={(v) => {
                        setFormProvider(v as LlmProviderType);
                        const meta = LLM_PROVIDERS_META[v as LlmProviderType];
                        if (meta) {
                          setFormModel(meta.defaultModel);
                        }
                      }}
                      options={Object.values(LLM_PROVIDERS_META).map(p => ({ value: p.value, label: p.label }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <Label htmlFor="model" className="flex items-center gap-1.5">
                        {t('settings.llmModalModelSelect')}
                        {fetchingModels && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      </Label>
                      {fetchedModels.length > 0 && (
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setShowCustomModelInput(!showCustomModelInput)}
                          className="text-[10px] text-primary hover:underline font-normal h-auto p-0"
                        >
                          {showCustomModelInput ? t('settings.llmModalSelectFromList') : t('settings.llmModalTypeManually')}
                        </Button>
                      )}
                    </div>
                    {!showCustomModelInput && fetchedModels.length > 0 ? (
                      <FormSelect
                        id="model"
                        value={formModel}
                        onChange={setFormModel}
                        options={fetchedModels.map((m) => ({ value: m, label: m }))}
                      />
                    ) : (
                      <Input
                        id="model"
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        placeholder={selectedProviderMeta?.defaultModel}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="flex items-center gap-2">
                    {t('settings.llmModalBaseUrl')}
                    <span className="text-[10px] bg-muted px-2 py-1 rounded text-muted-foreground font-normal">
                      {t('settings.llmModalOptional')}
                    </span>
                  </Label>
                  <Input
                    id="baseUrl"
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    placeholder={t('settings.llmModalBaseUrlPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">{t('settings.llmModalApiKey')}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder={
                      editingConfig && editingConfig.apiKey
                        ? t('settings.llmModalApiKeyPlaceholderSaved')
                        : t('settings.llmModalApiKeyPlaceholderEmpty')
                    }
                  />
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                  <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {t('settings.llmModalHyperparameters')}
                  </h5>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <Label htmlFor="temperature">{t('settings.llmModalTemperature')}</Label>
                        <span className="text-muted-foreground/80 font-mono text-[10px]">{formTemperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        id="temperature"
                        min={0.0}
                        max={2.0}
                        step={0.1}
                        value={[formTemperature]}
                        onValueChange={(val) => setFormTemperature(val[0])}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {t('settings.llmModalTemperatureDesc')}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <Label htmlFor="maxTokens">{t('settings.llmModalMaxTokens')}</Label>
                        </div>
                        <Input
                          id="maxTokens"
                          type="number"
                          min={1}
                          max={16384}
                          value={formMaxTokens}
                          onChange={(e) => setFormMaxTokens(parseInt(e.target.value, 10) || 2048)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {t('settings.llmModalMaxTokensDesc')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <Label htmlFor="topP">{t('settings.llmModalTopP')}</Label>
                          <span className="text-muted-foreground/80 font-mono text-[10px]">{formTopP.toFixed(2)}</span>
                        </div>
                        <Slider
                          id="topP"
                          min={0.0}
                          max={1.0}
                          step={0.05}
                          value={[formTopP]}
                          onValueChange={(val) => setFormTopP(val[0])}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {t('settings.llmModalTopPDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/10">
                  <div className="space-y-1">
                    <Label htmlFor="isDefault" className="text-sm font-semibold">
                      {t('settings.llmModalSetDefault')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.llmModalSetDefaultDesc')}
                    </p>
                  </div>
                  <Switch
                    id="isDefault"
                    checked={formIsDefaultText}
                    onCheckedChange={setFormIsDefaultText}
                  />
                </div>

                {modalTestResult && (
                  <div
                    className={`rounded-xl border p-4 text-xs mt-3 ${
                      modalTestResult.success
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300'
                        : 'border-destructive/20 bg-destructive/5 text-destructive-foreground'
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      {modalTestResult.success ? t('settings.llmTestSuccess') : t('settings.llmTestFailed')}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed opacity-90 font-mono text-[10px] mb-3">
                      {modalTestResult.success ? modalTestResult.response : modalTestResult.message}
                    </p>
                    {modalTestResult.success && modalTestResult.metrics && (
                      <div className="flex items-center gap-4 text-[9px] font-semibold text-emerald-800/80 dark:text-emerald-300/80 border-t border-emerald-500/10 pt-2">
                        <span>{t('settings.llmLatency')}: {modalTestResult.metrics.latencyMs} ms</span>
                        <span>{t('settings.llmWordCount')}: {modalTestResult.metrics.wordCount}</span>
                        <span>{t('settings.llmSpeed')}: {modalTestResult.metrics.latencyMs > 0 ? `${(modalTestResult.metrics.wordCount / (modalTestResult.metrics.latencyMs / 1000)).toFixed(1)} W/s` : 'N/A'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons container - permanently pinned outside the scrollable inputs list */}
              <div className="flex flex-wrap gap-2.5 justify-end border-t border-border pt-4 bg-card shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleModalTestConnection()}
                  disabled={modalTesting || (formApiKey.trim() === '' && !editingConfig)}
                  className="text-[11px] h-9 px-4 w-full sm:w-auto"
                >
                  {modalTesting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
                  {t('settings.llmModalTestDraft')}
                </Button>
                <div className="hidden sm:block flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="text-[11px] h-9 px-4 w-full sm:w-auto"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={!formName.trim()}
                  className="text-[11px] h-9 px-4 w-full sm:w-auto"
                >
                  {t('settings.llmModalApplyChanges')}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </SettingsPanel>
  );
}
