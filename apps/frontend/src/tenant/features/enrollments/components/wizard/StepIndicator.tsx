import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;
}

/**
 * Renders the visual step status elements for the wizard context.
 *
 * @param props - Component props.
 * @param props.steps - List of wizard steps configured.
 * @param props.current - The active step index.
 * @returns StepIndicator layout.
 */
export function StepIndicator({ steps, current }: StepIndicatorProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-0" role="list" aria-label={t("enrollments.wizard.stepsAria")}>
      {steps.map((step, index) => {
        const done    = index < current;
        const active  = index === current;
        const Icon    = step.icon;
        const stepState = done
          ? t("enrollments.wizard.stepCompleted")
          : active
            ? t("enrollments.wizard.stepCurrent")
            : t("enrollments.wizard.stepUpcoming");
        return (
          <React.Fragment key={step.id}>
            <div
              className="flex flex-col items-center gap-1.5 min-w-[80px]"
              role="listitem"
              aria-current={active ? "step" : undefined}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done   ? "bg-primary border-primary text-primary-foreground" :
                  active ? "bg-primary/10 border-primary text-primary" :
                           "bg-muted border-border text-muted-foreground"
                }`}
                aria-label={t("enrollments.wizard.stepStateAria", {
                  step: index + 1,
                  label: step.label,
                  state: stepState,
                })}
              >
                {done ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Icon className="w-4 h-4" aria-hidden="true" />
                )}
              </div>
              <span
                className={`text-xs font-semibold text-center leading-tight ${
                  active ? "text-primary font-bold" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 min-w-[16px] transition-colors ${done ? "bg-primary" : "bg-border"}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
