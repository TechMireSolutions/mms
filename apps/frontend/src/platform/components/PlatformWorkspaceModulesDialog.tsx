import React, { useEffect, useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { SYSTEM_MODULES } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateWorkspaceModules, useWorkspaceModules } from '@/platform/hooks/usePlatformWorkspaces';
import { Loader2 } from 'lucide-react';

interface PlatformWorkspaceModulesDialogProps {
  workspace: PlatformWorkspaceRowData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformWorkspaceModulesDialog({
  workspace,
  open,
  onOpenChange,
}: PlatformWorkspaceModulesDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: currentModules, isLoading } = useWorkspaceModules(workspace.subdomain, open);
  const { mutateAsync: updateModules, isPending } = useUpdateWorkspaceModules();

  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    if (currentModules) {
      setSelectedModules(currentModules);
    }
  }, [currentModules, open]);

  const toggleModule = (moduleId: string, checked: boolean) => {
    setSelectedModules((prev) => {
      if (checked) {
        return [...prev, moduleId];
      }
      return prev.filter((id) => id !== moduleId);
    });
  };

  const handleSave = async () => {
    try {
      await updateModules({ subdomain: workspace.subdomain, modules: selectedModules });
      onOpenChange(false);
    } catch {
      // Error is handled in the mutation
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('platform.modulesTitle')}
      subtitle={t('platform.modulesSubtitle')}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending || isLoading}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-4">
            {SYSTEM_MODULES.map((module) => (
              <div
                key={module.id}
                className="flex items-start space-x-3 rounded-lg border p-4 shadow-sm"
              >
                <Checkbox
                  id={`module-${module.id}`}
                  checked={selectedModules.includes(module.id)}
                  disabled={module.required || isPending}
                  onCheckedChange={(checked) => toggleModule(module.id, checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor={`module-${module.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {module.label} {module.required && <span className="text-xs text-muted-foreground">{t('platform.moduleRequired')}</span>}
                  </label>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
