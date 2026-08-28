import React, { useEffect, useState, useMemo } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { SYSTEM_MODULES } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { useUpdateWorkspaceModules, useWorkspaceModules } from '@/platform/hooks/usePlatformWorkspaces';
import {
  Loader2,
  Sparkles,
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
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      if (checked) {
        return [...prev, moduleId];
      }
      return prev.filter((id) => id !== moduleId);
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

  const categories = useMemo(() => {
    const map = new Map<string, typeof SYSTEM_MODULES>();
    for (const mod of SYSTEM_MODULES) {
      const cat = mod.category || 'core';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(mod);
    }
    return Array.from(map.entries());
  }, []);

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
        {/* Preset Archetype Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span>{t('onboarding.presetsLabel')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(SYSTEM_MODULES.map((m) => m.id))}
              className="min-h-9 h-9 px-2.5 text-2xs font-bold rounded-lg border-border/70 hover:bg-primary/10 hover:text-primary gap-1 shadow-2xs cursor-pointer"
            >
              <School className="w-3.5 h-3.5 text-primary" aria-hidden />
              {t('onboarding.presetFull')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                applyPreset(['dashboard', 'contacts', 'messaging', 'students', 'teachers', 'attendance', 'hasanat', 'users'])
              }
              className="min-h-9 h-9 px-2.5 text-2xs font-bold rounded-lg border-border/70 hover:bg-primary/10 hover:text-primary gap-1 shadow-2xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden />
              {t('onboarding.presetHifz')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                applyPreset(['dashboard', 'contacts', 'messaging', 'students', 'attendance', 'finance', 'users'])
              }
              className="min-h-9 h-9 px-2.5 text-2xs font-bold rounded-lg border-border/70 hover:bg-primary/10 hover:text-primary gap-1 shadow-2xs cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden />
              {t('onboarding.presetWeekend')}
            </Button>
          </div>
        </div>

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
                    const isSelected = selectedModules.includes(module.id);
                    return (
                      <label
                        key={module.id}
                        htmlFor={`module-${module.id}`}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xs transition-all cursor-pointer select-none',
                          isSelected
                            ? 'border-primary/40 bg-primary/5 shadow-xs'
                            : 'border-border/60 bg-card/60 hover:bg-card hover:border-border',
                          module.required && 'cursor-default opacity-85',
                        )}
                      >
                        <Checkbox
                          id={`module-${module.id}`}
                          checked={isSelected}
                          disabled={module.required || isPending}
                          onCheckedChange={(checked) => toggleModule(module.id, checked as boolean)}
                          className="mt-0.5"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                            <span className="text-xs font-bold text-foreground truncate">
                              {module.label}
                            </span>
                            {module.required && (
                              <span className="ms-auto text-3xs font-semibold text-muted-foreground">
                                {t('platform.moduleRequired')}
                              </span>
                            )}
                          </div>
                          <p className="text-3xs text-muted-foreground leading-relaxed">
                            {module.description}
                          </p>
                        </div>
                      </label>
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
