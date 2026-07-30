import type React from 'react';
import { Brain, Plus, Search } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsCallout } from '@/components/ui/SettingsShell';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { LlmConfig, LlmTestResult } from '@mms/shared';
import { LlmConfigCard } from '@/tenant/features/settings/components/LlmConfigCard';
import { LlmConfigTestResultPanel } from '@/tenant/features/settings/components/LlmConfigTestResultPanel';

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

function filterLlmConfigs(configs: LlmConfig[], searchQuery: string): LlmConfig[] {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return configs;
  return configs.filter(
    (config) =>
      config.name.toLowerCase().includes(query) ||
      config.provider.toLowerCase().includes(query) ||
      config.model.toLowerCase().includes(query),
  );
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
  const filtered = filterLlmConfigs(configs, searchQuery);

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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border p-8 text-center bg-muted/10">
              <Search className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="font-medium text-xs">{t('settings.llmNoMatches')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((config) => (
                <LlmConfigCard
                  key={config.id}
                  config={config}
                  status={healthStatuses[config.id] || 'untested'}
                  testingId={testingId}
                  isGlobalDirty={isGlobalDirty}
                  t={t}
                  openEditModal={openEditModal}
                  handleDeleteConfig={handleDeleteConfig}
                  handleTestConnection={handleTestConnection}
                />
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {testResult && (
        <LlmConfigTestResultPanel
          testResult={testResult}
          formatLlmSpeed={formatLlmSpeed}
          t={t}
        />
      )}
    </>
  );
}
