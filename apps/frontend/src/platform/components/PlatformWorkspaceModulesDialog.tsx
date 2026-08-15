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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-h-11 rounded-xl font-bold"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading}
            className="min-h-11 rounded-xl font-bold"
          >
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-1 py-2 text-start">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-4">
            {SYSTEM_MODULES.map((module) => (
              <div
                key={module.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 p-4 shadow-2xs bg-card/50 hover:bg-card transition-colors"
              >
                <Checkbox
                  id={`module-${module.id}`}
                  checked={selectedModules.includes(module.id)}
                  disabled={module.required || isPending}
                  onCheckedChange={(checked) => toggleModule(module.id, checked as boolean)}
                  className="mt-0.5"
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor={`module-${module.id}`}
                    className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {module.label}{' '}
                    {module.required && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {t('platform.moduleRequired')}
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {module.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
