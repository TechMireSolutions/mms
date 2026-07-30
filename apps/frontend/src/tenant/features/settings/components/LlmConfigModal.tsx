import type React from 'react';
import { Brain, Loader2, X } from 'lucide-react';
import { motion, type DragControls } from 'framer-motion';
import { FormSelect } from '@/components/ui/FormSelect';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import {
  LLM_PROVIDERS_META,
  type LlmConfig,
  type LlmProviderType,
  type LlmTestResult,
} from '@mms/shared';

interface LlmConfigModalProps {
  modalOpen: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  dragControls: DragControls;
  editingConfig: LlmConfig | null;
  formName: string;
  setFormName: (value: string) => void;
  formProvider: LlmProviderType;
  setFormProvider: (value: LlmProviderType) => void;
  formModel: string;
  setFormModel: (value: string) => void;
  formBaseUrl: string;
  setFormBaseUrl: (value: string) => void;
  formApiKey: string;
  setFormApiKey: (value: string) => void;
  formIsDefaultText: boolean;
  setFormIsDefaultText: (value: boolean) => void;
  formTemperature: number;
  setFormTemperature: (value: number) => void;
  formMaxTokens: number;
  setFormMaxTokens: (value: number) => void;
  formTopP: number;
  setFormTopP: (value: number) => void;
  fetchedModels: string[];
  fetchingModels: boolean;
  showCustomModelInput: boolean;
  setShowCustomModelInput: (value: boolean) => void;
  selectedProviderDefaultModel?: string;
  modalTestResult: LlmTestResult | null;
  modalTesting: boolean;
  setModalOpen: (open: boolean) => void;
  handleSaveModalConfig: () => void;
  handleModalTestConnection: () => Promise<void>;
  formatLlmSpeed: (wordCount: number, latencyMs: number) => string;
  t: TranslationFunction;
}

export function LlmConfigModal({
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
  selectedProviderDefaultModel,
  modalTestResult,
  modalTesting,
  setModalOpen,
  handleSaveModalConfig,
  handleModalTestConnection,
  formatLlmSpeed,
  t,
}: LlmConfigModalProps): React.JSX.Element | null {
  if (!modalOpen) {
    return null;
  }

  return (
    <>
      {/* Subtle click-away backdrop */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 pointer-events-none" />

      <motion.div
        ref={modalRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        role="dialog"
        aria-modal="true"
        aria-label={editingConfig ? t('settings.llmModalEditTitle') : t('settings.llmModalAddTitle')}
        className="fixed inset-x-4 top-4 z-50 flex max-h-[85vh] w-auto max-w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(32rem,calc(100%-2rem))]"
      >
        {/* Grab Handle Header */}
        <div
          onPointerDown={(event) => dragControls.start(event)}
          className="cursor-grab active:cursor-grabbing flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 select-none shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {editingConfig ? t('settings.llmModalEditTitle') : t('settings.llmModalAddTitle')}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {t('settings.llmModalRepositionDesc')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setModalOpen(false)}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveModalConfig();
          }}
          className="flex flex-col p-5 min-h-0 overflow-hidden"
        >
          {/* Scrollable inputs container */}
          <div className="flex-1 overflow-y-auto space-y-4 pe-1 mb-4 min-h-0 max-h-[50vh]">
            <div className="space-y-2">
              <Label htmlFor="configName">{t('settings.llmModalName')}</Label>
              <Input
                id="configName"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder={t('settings.llmModalNamePlaceholder')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provider">{t('settings.llmModalProvider')}</Label>
                <FormSelect
                  id="provider"
                  value={formProvider}
                  onChange={(providerValue) => {
                    setFormProvider(providerValue as LlmProviderType);
                    const meta = LLM_PROVIDERS_META[providerValue as LlmProviderType];
                    if (meta) {
                      setFormModel(meta.defaultModel);
                    }
                  }}
                  options={Object.values(LLM_PROVIDERS_META).map((provider) => ({ value: provider.value, label: provider.label }))}
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
                      className="text-xs text-primary hover:underline font-normal min-h-11 px-2"
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
                    options={fetchedModels.map((model) => ({ value: model, label: model }))}
                  />
                ) : (
                  <Input
                    id="model"
                    value={formModel}
                    onChange={(event) => setFormModel(event.target.value)}
                    placeholder={selectedProviderDefaultModel}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="flex items-center gap-2">
                {t('settings.llmModalBaseUrl')}
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-normal">
                  {t('settings.llmModalOptional')}
                </span>
              </Label>
              <Input
                id="baseUrl"
                value={formBaseUrl}
                onChange={(event) => setFormBaseUrl(event.target.value)}
                placeholder={t('settings.llmModalBaseUrlPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">{t('settings.llmModalApiKey')}</Label>
              <Input
                id="apiKey"
                type="password"
                value={formApiKey}
                onChange={(event) => setFormApiKey(event.target.value)}
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
                    <span className="text-muted-foreground/80 font-mono text-xs">{formTemperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0.0}
                    max={2.0}
                    step={0.1}
                    value={[formTemperature]}
                    onValueChange={(val) => setFormTemperature(val[0])}
                  />
                  <p className="text-xs text-muted-foreground">
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
                      onChange={(event) => setFormMaxTokens(parseInt(event.target.value, 10) || 2048)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('settings.llmModalMaxTokensDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <Label htmlFor="topP">{t('settings.llmModalTopP')}</Label>
                      <span className="text-muted-foreground/80 font-mono text-xs">{formTopP.toFixed(2)}</span>
                    </div>
                    <Slider
                      id="topP"
                      min={0.0}
                      max={1.0}
                      step={0.05}
                      value={[formTopP]}
                      onValueChange={(val) => setFormTopP(val[0])}
                    />
                    <p className="text-xs text-muted-foreground">
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
                    ? 'border-success/20 bg-success/5 text-success'
                    : 'border-destructive/20 bg-destructive/5 text-destructive-foreground'
                }`}
              >
                <p className="font-semibold mb-1">
                  {modalTestResult.success ? t('settings.llmTestSuccess') : t('settings.llmTestFailed')}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed opacity-90 font-mono text-xs mb-3">
                  {modalTestResult.success ? modalTestResult.response : modalTestResult.message}
                </p>
                {modalTestResult.success && modalTestResult.metrics && (
                  <div className="flex items-center gap-4 text-xs font-semibold text-success/80 border-t border-success/10 pt-2">
                    <span>{t('settings.llmLatency')}: {modalTestResult.metrics.latencyMs} ms</span>
                    <span>{t('settings.llmWordCount')}: {modalTestResult.metrics.wordCount}</span>
                    <span>{t('settings.llmSpeed')}: {formatLlmSpeed(modalTestResult.metrics.wordCount, modalTestResult.metrics.latencyMs)}</span>
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
              className="text-xs min-h-11 px-4 w-full sm:w-auto"
            >
              {modalTesting ? (
                <Loader2 className="h-3 w-3 animate-spin me-2" />
              ) : null}
              {t('settings.llmModalTestDraft')}
            </Button>
            <div className="hidden sm:block flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="text-xs min-h-11 px-4 w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!formName.trim()}
              className="text-xs min-h-11 px-4 w-full sm:w-auto"
            >
              {t('settings.llmModalApplyChanges')}
            </Button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
