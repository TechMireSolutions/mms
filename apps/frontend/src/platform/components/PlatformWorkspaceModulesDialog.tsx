import React, { useEffect, useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { SYSTEM_MODULES } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { PlatformModuleSelectCard } from '@/platform/components/workspace/PlatformModuleSelectCard';
import { PlatformModulePresetsBar } from '@/platform/components/workspace/PlatformModulePresetsBar';
import { useUpdateWorkspaceModules, useWorkspaceModules } from '@/platform/hooks/usePlatformWorkspaces';
import {
  Loader2,
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  School,
  Calendar,
  UserCheck,
  ClipboardList,
  Star,
  FileText,
  Library,
  DollarSign,
  TrendingUp,
  UserCog,
  Scale,
} from 'lucide-react';

const MODULE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  contacts: Users,
  messaging: MessageSquare,
  students: GraduationCap,
  teachers: School,
  sessions: Calendar,
  attendance: UserCheck,
  enrollment: ClipboardList,
  hasanat: Star,
  examination: FileText,
  questionBank: Library,
  finance: DollarSign,
  accounting: TrendingUp,
  obligations: Scale,
  users: UserCog,
};

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
      const nextSet = new Set(prev);
      if (checked) {
        nextSet.add(moduleId);
      } else {
        nextSet.delete(moduleId);
      }
      return [...nextSet];
    });
  };

  const applyPreset = (moduleIds: string[]) => {
    const requiredIds = SYSTEM_MODULES.filter((m) => m.required).map((m) => m.id);
    const combined = Array.from(new Set([...requiredIds, ...moduleIds]));
    setSelectedModules(combined);
  };

  const handleSave = async () => {
    try {
      await updateModules({ subdomain: workspace.subdomain, modules: selectedModules });
      onOpenChange(false);
    } catch {
      // Error is handled in the mutation
    }
  };

  const categories = (() => {
    const map = new Map<string, typeof SYSTEM_MODULES>();
    for (const mod of SYSTEM_MODULES) {
      const cat = mod.category || 'core';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(mod);
    }
    return Array.from(map.entries());
  })();

  const selectedModuleSet = new Set(selectedModules);

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={t('platform.modulesTitle')}
      subtitle={`${workspace.madrasaName} (${workspace.subdomain})`}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-h-11 rounded-xl font-bold px-4"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading}
            className="min-h-11 rounded-xl font-bold px-5 shadow-sm shadow-primary/20 interactive-scale cursor-pointer"
          >
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-1 py-2 text-start space-y-5">
        <PlatformModulePresetsBar onApplyPreset={applyPreset} disabled={isPending} />

        {isLoading ? (
          <CardSkeleton count={3} />
        ) : (
          <div className="space-y-6">
            {categories.map(([categoryKey, modules]) => (
              <div key={categoryKey} className="space-y-2.5">
                <h4 className="text-2xs font-black uppercase tracking-wider text-muted-foreground px-1">
                  {categoryKey}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modules.map((module) => {
                    const Icon = MODULE_ICONS[module.id] || LayoutDashboard;
                    const isSelected = selectedModuleSet.has(module.id);
                    return (
                      <PlatformModuleSelectCard
                        key={module.id}
                        module={module}
                        selected={isSelected}
                        disabled={isPending}
                        icon={Icon}
                        onToggle={toggleModule}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
