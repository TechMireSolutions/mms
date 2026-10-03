import React, { useState, useEffect } from 'react';
import { Save, Bell, UserCheck } from 'lucide-react';
import {
  type TaskSettings,
  DEFAULT_TASK_SETTINGS,
  type DelegationScope,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useTaskSettings, useUpdateTaskSettings } from '@/tenant/hooks/collections/tasks';
import { notify } from '@/lib/notify';

export interface TasksSetupTabProps {
  initialSettings?: TaskSettings;
  canEditSetup?: boolean;
}

export function TasksSetupTab({
  initialSettings = DEFAULT_TASK_SETTINGS,
  canEditSetup = true,
}: TasksSetupTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverSettings, isLoading } = useTaskSettings();
  const updateSettingsMutation = useUpdateTaskSettings();

  const [settings, setSettings] = useState<TaskSettings>(initialSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (serverSettings) {
      setSettings(serverSettings);
    }
  }, [serverSettings]);

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settings);
      setSaved(true);
      notify.success('Task preferences updated successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-5">
        <div>
          <h3 className="font-semibold text-base text-foreground mb-1">
            {t('tasks.setup.delegationScope')}
          </h3>
          <p className="text-xs text-muted-foreground">
            Configure how far down the organizational hierarchy staff are authorized to assign tasks.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-md border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="delegationScope"
              value="descendants"
              checked={settings.delegationScope === 'descendants'}
              onChange={() => setSettings({ ...settings, delegationScope: 'descendants' as DelegationScope })}
              disabled={!canEditSetup || isLoading}
              className="mt-1 text-primary focus:ring-primary"
            />
            <div>
              <div className="text-sm font-medium text-foreground">
                {t('tasks.setup.descendants')}
              </div>
              <div className="text-xs text-muted-foreground">
                Managers can assign tasks to anyone in their reporting line, recursively down the organization tree.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-md border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="delegationScope"
              value="direct_reports"
              checked={settings.delegationScope === 'direct_reports'}
              onChange={() => setSettings({ ...settings, delegationScope: 'direct_reports' as DelegationScope })}
              disabled={!canEditSetup || isLoading}
              className="mt-1 text-primary focus:ring-primary"
            />
            <div>
              <div className="text-sm font-medium text-foreground">
                {t('tasks.setup.directReports')}
              </div>
              <div className="text-xs text-muted-foreground">
                Managers can only assign tasks to their immediate direct subordinates.
              </div>
            </div>
          </label>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t('tasks.setup.allowSelfAssignment')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Staff can assign personal tasks to themselves.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.allowSelfAssignment}
              onChange={(e) => setSettings({ ...settings, allowSelfAssignment: e.target.checked })}
              disabled={!canEditSetup || isLoading}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t('tasks.setup.notifyOnAssignment')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Send notifications when a user is delegated a new task.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOnAssignment}
              onChange={(e) => setSettings({ ...settings, notifyOnAssignment: e.target.checked })}
              disabled={!canEditSetup || isLoading}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
          </div>
        </div>

        {canEditSetup ? (
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending || isLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{updateSettingsMutation.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
