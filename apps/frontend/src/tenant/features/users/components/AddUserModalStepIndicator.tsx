import React from "react";
import { Check, Lock, ShieldCheck, User, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface AddUserModalStepDefinition {
  id: number;
  labelKey: "users.addStepContact" | "users.addStepRoles" | "users.addStepAccount";
  icon: LucideIcon;
}

export const ADD_USER_MODAL_STEP_DEFS: AddUserModalStepDefinition[] = [
  { id: 1, labelKey: "users.addStepContact", icon: User },
  { id: 2, labelKey: "users.addStepRoles", icon: ShieldCheck },
  { id: 3, labelKey: "users.addStepAccount", icon: Lock },
];

interface StepIndicatorProps {
  step: number;
}

export function StepIndicator({ step }: StepIndicatorProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex max-w-full items-center gap-0 overflow-x-auto pb-1">
      {ADD_USER_MODAL_STEP_DEFS.map((stepDefinition, stepIndex) => {
        const done = step > stepDefinition.id;
        const active = step === stepDefinition.id;
        const Icon = stepDefinition.icon;
        return (
          <React.Fragment key={stepDefinition.id}>
            <div className="flex min-w-[5rem] flex-col items-center gap-1">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                done ? "bg-primary border-primary text-primary-foreground" :
                active ? "border-primary bg-primary/10 text-primary" :
                "border-border bg-muted text-muted-foreground"
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>
                {t(stepDefinition.labelKey)}
              </span>
            </div>
            {stepIndex < ADD_USER_MODAL_STEP_DEFS.length - 1 && (
              <div className={`mx-1 mb-4 h-0.5 min-w-4 flex-1 transition-all ${step > stepDefinition.id ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
