import React, { useMemo } from 'react';
import {
  SYSTEM_MODULE_NAV,
  SYSTEM_MODULES,
  SYSTEM_MODULES_BY_ID,
  translateSystemModuleDescription,
  translateSystemModuleLabel,
  type ModuleDefinition,
  type SystemModuleNavEntry,
} from '@mms/shared';
import { resolveModuleIcon } from '@/lib/config/moduleIcons';
import useTranslation from '@/hooks/useTranslation';
import { Switch } from '@/components/ui/switch';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';

interface ModuleToggleCardProps {
  module: ModuleDefinition;
  enabled: boolean;
  label: string;
  description: string;
  requiredLabel: string;
  onToggle: (enabled: boolean) => void;
}

function ModuleToggleCard({
  module,
  enabled,
  label,
  description,
  requiredLabel,
  onToggle,
}: ModuleToggleCardProps): React.JSX.Element {
  const Icon = resolveModuleIcon(module.icon);
  const toggleId = `module-toggle-${module.id}`;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
        enabled ? 'border-border bg-card shadow-sm' : 'border-border/50 bg-muted/30 opacity-75'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
          </div>
          {module.required ? (
            <SettingsMetaBadge variant="muted">{requiredLabel}</SettingsMetaBadge>
          ) : (
            <Switch
              id={toggleId}
              checked={enabled}
              onCheckedChange={onToggle}
              aria-label={label}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ModuleSettingsNavGridProps {
  enabledModules: Record<string, boolean>;
  onToggleModule: (moduleId: string, enabled: boolean) => void;
}

/** Renders module toggles in the same layout as app navigation (`SYSTEM_MODULE_NAV`). */
export default function ModuleSettingsNavGrid({
  enabledModules,
  onToggleModule,
}: ModuleSettingsNavGridProps): React.JSX.Element {
  const { t, language } = useTranslation();

  const moduleLabel = (mod: ModuleDefinition): string =>
    translateSystemModuleLabel(mod.id, language, mod.label);
  const moduleDesc = (mod: ModuleDefinition): string =>
    translateSystemModuleDescription(mod.id, language, mod.description);
  const isEnabled = (id: string): boolean => enabledModules[id] !== false;
  const requiredLabel = t('module.system.required');

  const blocks = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    let standaloneBatch: string[] = [];

    const renderCard = (id: string): React.ReactNode | null => {
      const mod = SYSTEM_MODULES_BY_ID[id];
      if (!mod) return null;
      return (
        <ModuleToggleCard
          key={id}
          module={mod}
          label={moduleLabel(mod)}
          description={moduleDesc(mod)}
          requiredLabel={requiredLabel}
          enabled={isEnabled(id)}
          onToggle={(value) => onToggleModule(id, value)}
        />
      );
    };

    const flushStandalone = (): void => {
      if (standaloneBatch.length === 0) return;
      const ids = [...standaloneBatch];
      standaloneBatch = [];
      nodes.push(
        <div key={`standalone-${ids.join('-')}`} className="grid gap-3 sm:grid-cols-2">
          {ids.map(renderCard)}
        </div>,
      );
    };

    const renderGroup = (entry: Extract<SystemModuleNavEntry, { type: 'group' }>): void => {
      const GroupIcon = resolveModuleIcon(entry.icon);
      nodes.push(
        <div key={entry.labelKey} className="space-y-3 rounded-xl border border-border bg-muted/15 p-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <GroupIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
            </div>
            <h4 className="text-sm font-bold text-foreground">{t(entry.labelKey)}</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{entry.moduleIds.map(renderCard)}</div>
        </div>,
      );
    };

    for (const entry of SYSTEM_MODULE_NAV) {
      if (entry.type === 'module') {
        standaloneBatch.push(entry.moduleId);
        if (standaloneBatch.length === 2) flushStandalone();
      } else {
        flushStandalone();
        renderGroup(entry);
      }
    }
    flushStandalone();

    return nodes;
  }, [enabledModules, language, onToggleModule, requiredLabel, t]);

  const moduleStats = useMemo(() => {
    const total = SYSTEM_MODULES.length;
    const enabled = SYSTEM_MODULES.filter((m) => enabledModules[m.id] !== false).length;
    return { total, enabled };
  }, [enabledModules]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium" aria-live="polite">
        <SettingsMetaBadge variant="primary">
          {t('module.system.stats', {
            enabled: moduleStats.enabled,
            total: moduleStats.total,
          })}
        </SettingsMetaBadge>
      </div>
      <p className="text-xs text-muted-foreground">{t('module.system.hint')}</p>
      <div className="space-y-4">{blocks}</div>
    </>
  );
}
