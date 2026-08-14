import React from "react";
import { LayoutDashboard } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Checkbox } from "@/components/ui/checkbox";
import { SYSTEM_MODULES } from "@mms/shared";
import type { CreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";

interface CreateMadrasaModulesSectionProps {
  controller: CreateMadrasaController;
}

export function CreateMadrasaModulesSection({ controller }: CreateMadrasaModulesSectionProps): React.ReactElement {
  const { t, data, onChange } = controller;

  const toggleModule = (moduleId: string, checked: boolean) => {
    onChange((prev) => {
      const newModules = checked
        ? [...prev.modules, moduleId]
        : prev.modules.filter((id) => id !== moduleId);
      return { ...prev, modules: newModules };
    });
  };

  return (
    <SectionCard
      title={t("platform.modulesTitle" as any)}
      subtitle={t("platform.modulesSubtitle" as any)}
      icon={LayoutDashboard}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYSTEM_MODULES.map((module) => (
          <div
            key={module.id}
            className="flex items-start space-x-3 rounded-lg border p-4 shadow-sm"
          >
            <Checkbox
              id={`module-${module.id}`}
              checked={data.modules.includes(module.id)}
              disabled={module.required}
              onCheckedChange={(checked) => toggleModule(module.id, checked as boolean)}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor={`module-${module.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {module.label} {module.required && <span className="text-xs text-muted-foreground">(Required)</span>}
              </label>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
