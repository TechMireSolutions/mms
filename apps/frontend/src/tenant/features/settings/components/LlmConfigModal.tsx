import type React from 'react';
import { Brain, X } from 'lucide-react';
import { motion, type DragControls } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import {
  type LlmConfig,
  type LlmProviderType,
  type LlmTestResult,
} from '@mms/shared';
import { LlmConfigModalBody } from '@/tenant/features/settings/components/LlmConfigModalBody';

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
          <LlmConfigModalBody
            editingConfig={editingConfig}
            formName={formName}
            setFormName={setFormName}
            formProvider={formProvider}
            setFormProvider={setFormProvider}
            formModel={formModel}
            setFormModel={setFormModel}
            formBaseUrl={formBaseUrl}
            setFormBaseUrl={setFormBaseUrl}
            formApiKey={formApiKey}
            setFormApiKey={setFormApiKey}
            formIsDefaultText={formIsDefaultText}
            setFormIsDefaultText={setFormIsDefaultText}
            formTemperature={formTemperature}
            setFormTemperature={setFormTemperature}
            formMaxTokens={formMaxTokens}
            setFormMaxTokens={setFormMaxTokens}
            formTopP={formTopP}
            setFormTopP={setFormTopP}
            fetchedModels={fetchedModels}
            fetchingModels={fetchingModels}
            showCustomModelInput={showCustomModelInput}
            setShowCustomModelInput={setShowCustomModelInput}
            selectedProviderDefaultModel={selectedProviderDefaultModel}
            modalTestResult={modalTestResult}
            modalTesting={modalTesting}
            setModalOpen={setModalOpen}
            handleModalTestConnection={handleModalTestConnection}
            formatLlmSpeed={formatLlmSpeed}
            t={t}
          />
        </form>
      </motion.div>
    </>
  );
}
