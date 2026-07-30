import type React from 'react';
import { AlertTriangle, Brain, Check, CheckCircle, Edit2, Globe, Loader2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsCallout } from '@/components/ui/SettingsShell';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { LlmConfig, LlmTestResult } from '@mms/shared';

type LlmHealthStatus = 'verified' | 'failed' | 'testing' | 'untested';

interface LlmConfigListSectionProps {
  configs: LlmConfig[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  healthStatuses: Record<string, LlmHealthStatus>;
  testingId: string | null;
  testResult: LlmTestResult | null;
  isGlobalDirty: boolean;
  openAddModal: () => void;
  openEditModal: (config: LlmConfig) => void;
  handleDeleteConfig: (configId: string) => void;
  handleTestConnection: (configId: string) => Promise<void>;
  formatLlmSpeed: (wordCount: number, latencyMs: number) => string;
  t: TranslationFunction;
}

export function LlmConfigListSection({
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
}: LlmConfigListSectionProps): React.JSX.Element {
  return (
    <>
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
            <SearchBar
              placeholder={t('settings.llmSearchPlaceholder')}
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
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
            const filtered = configs.filter((config) => {
              const query = searchQuery.toLowerCase().trim();
              if (!query) return true;
              return (
                config.name.toLowerCase().includes(query) ||
                config.provider.toLowerCase().includes(query) ||
                config.model.toLowerCase().includes(query)
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
                        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="flex shrink-0 items-center justify-center">
                              {status === 'testing' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                              ) : status === 'verified' ? (
                                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_var(--color-success)] shrink-0" title={t('settings.llmTestSuccess')} />
                              ) : status === 'failed' ? (
                                <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_var(--color-destructive)] shrink-0" title={t('settings.llmTestFailed')} />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-warning shadow-[0_0_8px_var(--color-warning)] shrink-0" title={t('settings.llmTestResultDesc')} />
                              )}
                            </span>
                            <h4 className="min-w-0 truncate text-sm font-bold">{config.name}</h4>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {config.isDefaultText && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                <Check className="h-3 w-3" /> {t('settings.llmTextDefault')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 font-medium text-foreground">{t('settings.llmModelToken')}</span>
                            <span className="min-w-0 truncate rounded bg-muted px-2 py-1 font-mono text-xs leading-none">{config.model}</span>
                          </div>
                          {config.baseUrl && (
                            <div className="flex min-w-0 items-center gap-2">
                              <Globe className="h-4 w-4 shrink-0" />
                              <span className="min-w-0 truncate font-mono text-xs">{config.baseUrl}</span>
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
                          className="text-xs px-3"
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
                          className="text-xs"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-xs text-destructive hover:bg-destructive/10"
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
                ? 'border-success/20 bg-success/5 text-success'
                : 'border-destructive/20 bg-destructive/5 text-destructive-foreground'
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-success/10 pt-3 text-xs font-semibold text-success/80">
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
                      <span>{formatLlmSpeed(testResult.metrics.wordCount, testResult.metrics.latencyMs)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </>
  );
}
