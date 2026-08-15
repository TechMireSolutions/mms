import React from "react";
import { LayoutDashboard, Sparkles, BookOpen, GraduationCap, School } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { SYSTEM_MODULES } from "@mms/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { CreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";

interface CreateMadrasaModulesSectionProps {
  controller: CreateMadrasaController;
}

interface ModulePreset {
  id: string;
  labelKey: AppTranslationKey;
  icon: React.ElementType;
  modules: string[];
}

const PRESETS: ModulePreset[] = [
  {
    id: "full",
    labelKey: "onboarding.presetFull",
    icon: School,
    modules: SYSTEM_MODULES.map((m) => m.id),
  },
  {
    id: "hifz",
    labelKey: "onboarding.presetHifz",
    icon: BookOpen,
    modules: ["dashboard", "contacts", "messaging", "students", "teachers", "attendance", "hasanat", "users"],
  },
  {
    id: "weekend",
    labelKey: "onboarding.presetWeekend",
    icon: GraduationCap,
    modules: ["dashboard", "contacts", "messaging", "students", "attendance", "finance", "users"],
  },
];

export function CreateMadrasaModulesSection({ controller }: CreateMadrasaModulesSectionProps): React.JSX.Element {
  const { t, data, onChange } = controller;

  const toggleModule = (moduleId: string, checked: boolean) => {
    onChange((prev) => {
      const newModules = checked
        ? [...prev.modules, moduleId]
        : prev.modules.filter((id) => id !== moduleId);
      return { ...prev, modules: newModules };
    });
  };

  const applyPreset = (moduleIds: string[]) => {
    // Ensure all required modules stay enabled
    const requiredIds = SYSTEM_MODULES.filter((m) => m.required).map((m) => m.id);
    const combined = Array.from(new Set([...requiredIds, ...moduleIds]));
    onChange((prev) => ({ ...prev, modules: combined }));
  };

  return (
    <SectionCard
      title={t("platform.modulesTitle")}
      subtitle={t("platform.modulesSubtitle")}
      icon={LayoutDashboard}
    >
      <div className="space-y-4 text-start">
        {/* Preset Archetype Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span>{t("onboarding.presetsLabel")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.modules)}
                  className="min-h-9 h-9 px-2.5 text-xs font-bold rounded-lg border-border/70 hover:bg-primary/10 hover:text-primary gap-1.5 shadow-2xs"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" aria-hidden />
                  {t(preset.labelKey)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {SYSTEM_MODULES.map((module) => (
            <div
              key={module.id}
              className="flex items-start gap-3 rounded-xl border border-border/60 p-3.5 bg-card/50 hover:bg-card transition-colors shadow-2xs"
            >
              <Checkbox
                id={`module-${module.id}`}
                checked={data.modules.includes(module.id)}
                disabled={module.required}
                onCheckedChange={(checked) => toggleModule(module.id, checked as boolean)}
                className="mt-0.5"
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor={`module-${module.id}`}
                  className="text-sm font-bold text-foreground leading-none cursor-pointer flex items-center gap-1.5"
                >
                  {module.label}{' '}
                  {module.required && (
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {t("platform.moduleRequired")}
                    </span>
                  )}
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">{module.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
