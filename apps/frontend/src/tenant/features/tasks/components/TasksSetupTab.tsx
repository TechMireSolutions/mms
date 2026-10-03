import React, { useState, useEffect } from 'react';
import { Save, UserCheck } from 'lucide-react';
import {
  type TaskSettings,
  DEFAULT_TASK_SETTINGS,
  type DelegationScope,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useTaskSettings, useUpdateTaskSettings } from '@/tenant/hooks/collections/tasks';
import { notify } from '@/lib/notify';

export interface TasksSetupTabProps {
  initialSettings?: TaskSettings;
  canEditSetup?: boolean;
}

function settingsEqual(a: TaskSettings, b: TaskSettings): boolean {
  return a.delegationScope === b.delegationScope
    && a.allowSelfAssignment === b.allowSelfAssignment;
}

export function TasksSetupTab({
  initialSettings = DEFAULT_TASK_SETTINGS,
  canEditSetup = true,
}: TasksSetupTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverSettings, isLoading } = useTaskSettings();
  const updateSettingsMutation = useUpdateTaskSettings();
  const [settings, setSettings] = useState<TaskSettings>(initialSettings);
  const baseline = serverSettings ?? initialSettings;
  const dirty = !settingsEqual(settings, baseline);

  useEffect(() => {
    if (serverSettings) setSettings(serverSettings);
  }, [serverSettings]);

  const handleSave = async () => {
    if (!dirty) return;
    try {
      await updateSettingsMutation.mutateAsync({
        ...settings,
        // Persist notify flags unchanged until messaging wiring exists.
        notifyOnAssignment: baseline.notifyOnAssignment,
        notifyOnStatusChange: baseline.notifyOnStatusChange,
      });
      notify.success(t('tasks.setup.saved'));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('tasks.setup.saveFailed'));
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-5">
        <div>
          <h3 className="font-semibold text-base text-foreground mb-1 text-wrap-balance">
            {t('tasks.setup.delegationScope')}
          </h3>
          <p className="text-xs text-muted-foreground text-wrap-pretty">
            {t('tasks.setup.delegationScopeDesc')}
          </p>
        </div>

        <div className="space-y-3">
          {(['descendants', 'direct_reports'] as const).map((scope) => (
            <label
              key={scope}
              className="flex items-start gap-3 p-3 rounded-md border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <input
                type="radio"
                name="delegationScope"
                value={scope}
                checked={settings.delegationScope === scope}
                onChange={() => setSettings({ ...settings, delegationScope: scope as DelegationScope })}
                disabled={!canEditSetup || isLoading}
                className="mt-1 text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t(scope === 'descendants' ? 'tasks.setup.descendants' : 'tasks.setup.directReports')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t(scope === 'descendants'
                    ? 'tasks.setup.descendantsDesc'
                    : 'tasks.setup.directReportsDesc')}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t('tasks.setup.allowSelfAssignment')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('tasks.setup.allowSelfAssignmentDesc')}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.allowSelfAssignment}
              onChange={(e) => setSettings({ ...settings, allowSelfAssignment: e.target.checked })}
              disabled={!canEditSetup || isLoading}
              className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('tasks.setup.allowSelfAssignment')}
            />
          </div>
        </div>

        {canEditSetup ? (
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              className="min-h-11 gap-1.5"
              onClick={() => void handleSave()}
              disabled={!dirty || updateSettingsMutation.isPending || isLoading}
            >
              <Save className="h-4 w-4" aria-hidden />
              <span>
                {updateSettingsMutation.isPending ? t('common.saving') : t('common.save')}
              </span>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
