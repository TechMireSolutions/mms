import type React from 'react';
import { Check, Edit2, Globe, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { LlmConfig } from '@mms/shared';

type LlmHealthStatus = 'verified' | 'failed' | 'testing' | 'untested';

interface LlmConfigCardProps {
  config: LlmConfig;
  status: LlmHealthStatus;
  testingId: string | null;
  isGlobalDirty: boolean;
  t: TranslationFunction;
  openEditModal: (config: LlmConfig) => void;
  handleDeleteConfig: (configId: string) => void;
  handleTestConnection: (configId: string) => Promise<void>;
}

export function LlmConfigCard({
  config,
  status,
  testingId,
  isGlobalDirty,
  t,
  openEditModal,
  handleDeleteConfig,
  handleTestConnection,
}: LlmConfigCardProps): React.JSX.Element {
  return (
    <motion.div
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
                <span className="h-2 w-2 rounded-full bg-success shadow-glow-success-sm shrink-0" title={t('settings.llmTestSuccess')} />
              ) : status === 'failed' ? (
                <span className="h-2 w-2 rounded-full bg-destructive shadow-glow-destructive-sm shrink-0" title={t('settings.llmTestFailed')} />
              ) : (
                <span className="h-2 w-2 rounded-full bg-warning shadow-glow-warning-sm shrink-0" title={t('settings.llmTestResultDesc')} />
              )}
            </span>
            <h4 className="min-w-0 truncate text-sm font-bold">{config.name}</h4>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {config.isDefaultText && (
              <Badge pill tone="primary" className="gap-1 px-2 py-1">
                <Check className="h-3 w-3" /> {t('settings.llmTextDefault')}
              </Badge>
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
}
