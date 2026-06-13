import React, { useCallback, useMemo, useState } from 'react';
import {
  Boxes, LucideIcon,
  LayoutDashboard, GraduationCap, Users, Calendar, UserCheck,
  FileText, DollarSign, Star, UserCog, ClipboardList, TrendingUp, BookOpen,
} from 'lucide-react';
import { getEffectiveGlobalSettings, getGlobalSettings, saveGlobalSettings } from '../../lib/db';
import { clearGlobalSettingsPreview, previewGlobalSettings } from '@/lib/settingsPreview';
import {
  DEFAULT_GLOBAL_SETTINGS,
  mergeGlobalSettings,
  normalizeEnabledModules,
  SYSTEM_MODULE_NAV,
  SYSTEM_MODULES,
  SYSTEM_MODULES_BY_ID,
  translateSystemModuleDescription,
  translateSystemModuleLabel,
  type GlobalSettings,
  type ModuleDefinition,
  type SystemModuleNavEntry,
} from '@mms/shared';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/hooks/useSettingsDraft';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import { Switch } from '@/components/ui/switch';
import {
  SettingsCallout,
  SettingsMetaBadge,
  SettingsPanel,
} from '@/components/settings/SettingsShared';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, GraduationCap, Users, Calendar, UserCheck,
  FileText, DollarSign, Star, UserCog, ClipboardList, TrendingUp, BookOpen, Boxes,
};

interface ModuleCardProps {
  module: ModuleDefinition;
  enabled: boolean;
  label: string;
  description: string;
  requiredLabel: string;
  onToggle: (enabled: boolean) => void;
}

function ModuleCard({
  module,
  enabled,
  label,
  description,
  requiredLabel,
  onToggle,
}: ModuleCardProps): React.JSX.Element {
  const Icon = ICONS[module.icon] || Boxes;
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

/**
 * Enable/disable application modules. Layout mirrors app navigation (`SYSTEM_MODULE_NAV`).
 */
export default function SystemModulesSettings(): React.JSX.Element {
  const { t, language } = useTranslation();
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(() => getEffectiveGlobalSettings(), []);

  const onPreview = useCallback((draft: GlobalSettings) => {
    previewGlobalSettings({ enabledModules: normalizeEnabledModules(draft.enabledModules) });
  }, []);

  const onSave = useCallback(
    async (draft: GlobalSettings) => {
      const current = getGlobalSettings();
      saveGlobalSettings(
        mergeGlobalSettings({
          ...current,
          enabledModules: normalizeEnabledModules(draft.enabledModules),
        }),
      );
      clearGlobalSettingsPreview();
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
      notify.success(t('module.system.saved'), { description: t('module.system.savedDesc') });
    },
    [t],
  );

  const { data, dirty, saving, upd, handleSave, resetDraft } = useSettingsDraft({
    load,
    onPreview,
    onSave,
    skipDatabaseSyncWhenDirty: true,
  });

  const enabledModules = useMemo(
    () => normalizeEnabledModules(data.enabledModules),
    [data.enabledModules],
  );

  const moduleStats = useMemo(() => {
    const total = SYSTEM_MODULES.length;
    const enabled = SYSTEM_MODULES.filter((m) => enabledModules[m.id] !== false).length;
    return { total, enabled };
  }, [enabledModules]);

  const updModule = (id: string, enabled: boolean): void => {
    const mod = SYSTEM_MODULES_BY_ID[id];
    if (mod?.required) return;
    upd('enabledModules', normalizeEnabledModules({ ...enabledModules, [id]: enabled }));
    setSavedFlash(false);
  };

  const handleReset = (): void => {
    const reset = mergeGlobalSettings({
      ...getGlobalSettings(),
      enabledModules: DEFAULT_GLOBAL_SETTINGS.enabledModules,
    });
    saveGlobalSettings(reset);
    clearGlobalSettingsPreview();
    resetDraft();
    setSavedFlash(false);
    notify.success(t('module.system.resetToast'), { description: t('module.system.resetToastDesc') });
  };

  const isEnabled = (id: string): boolean => enabledModules[id] !== false;

  const moduleLabel = (mod: ModuleDefinition): string =>
    translateSystemModuleLabel(mod.id, language, mod.label);
  const moduleDesc = (mod: ModuleDefinition): string =>
    translateSystemModuleDescription(mod.id, language, mod.description);

  const blocks: React.ReactNode[] = [];
  let standaloneBatch: string[] = [];

  const flushStandalone = (): void => {
    if (standaloneBatch.length === 0) return;
    const ids = [...standaloneBatch];
    standaloneBatch = [];
    blocks.push(
      <div key={`standalone-${ids.join('-')}`} className="grid gap-3 sm:grid-cols-2">
        {ids.map((id) => {
          const mod = SYSTEM_MODULES_BY_ID[id];
          if (!mod) return null;
          return (
            <ModuleCard
              key={id}
              module={mod}
              label={moduleLabel(mod)}
              description={moduleDesc(mod)}
              requiredLabel={t('module.system.required')}
              enabled={isEnabled(id)}
              onToggle={(v) => updModule(id, v)}
            />
          );
        })}
      </div>,
    );
  };

  const renderGroup = (entry: Extract<SystemModuleNavEntry, { type: 'group' }>): void => {
    const GroupIcon = ICONS[entry.icon] || BookOpen;
    blocks.push(
      <div key={entry.labelKey} className="space-y-3 rounded-xl border border-border bg-muted/15 p-4">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <GroupIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
          </div>
          <h4 className="text-sm font-bold text-foreground">{t(entry.labelKey)}</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {entry.moduleIds.map((id) => {
            const mod = SYSTEM_MODULES_BY_ID[id];
            if (!mod) return null;
            return (
              <ModuleCard
                key={id}
                module={mod}
                label={moduleLabel(mod)}
                description={moduleDesc(mod)}
                requiredLabel={t('module.system.required')}
                enabled={isEnabled(id)}
                onToggle={(v) => updModule(id, v)}
              />
            );
          })}
        </div>
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

  return (
    <SettingsPanel
      width="narrow"
      introKey="settings.introModules"
      isDirty={dirty}
      saved={savedFlash}
      footer={
        <SettingsFormActions
          resetLabel={t('module.system.resetModules')}
          saveLabel={t('module.system.save')}
          savingLabel={t('module.system.saving')}
          savedLabel={t('module.system.savedLabel')}
          onReset={handleReset}
          onSave={() => void handleSave()}
          dirty={dirty}
          saving={saving}
          saved={savedFlash}
        />
      }
    >
      <SettingsCallout>{t('module.system.note')}</SettingsCallout>
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
    </SettingsPanel>
  );
}
