import React, { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SimpleTransactionWizardStepsProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
}

export function SimpleTransactionWizardSteps({
  currentStep,
  onSelectStep,
}: SimpleTransactionWizardStepsProps) {
  const { t } = useTranslation();

  const steps = useMemo(
    () => [
      { stepNumber: 1, label: t("accounting.journal.dashboard.wizard.stepSelect") },
      { stepNumber: 2, label: t("accounting.journal.dashboard.wizard.stepDetails") },
      { stepNumber: 3, label: t("accounting.journal.dashboard.wizard.stepReview") },
    ],
    [t],
  );

  return (
    <nav aria-label={t("accounting.journal.dashboard.wizard.stepsAria")} className="flex items-center gap-2">
      {steps.map((stepDefinition, index) => {
        const isCompleted = currentStep > stepDefinition.stepNumber;
        const isCurrent = currentStep === stepDefinition.stepNumber;
        const circleClass = isCompleted
          ? "bg-success text-white"
          : isCurrent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground";

        return (
          <React.Fragment key={stepDefinition.stepNumber}>
            <div className="flex items-center gap-1.5">
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => onSelectStep(stepDefinition.stepNumber)}
                  aria-label={`${stepDefinition.label} (${t("accounting.journal.dashboard.wizard.back")})`}
                  className="flex min-h-11 min-w-11 items-center justify-center -m-2.5 p-2.5 rounded-full hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${circleClass}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ) : (
                <div
                  className="flex min-h-11 min-w-11 items-center justify-center -m-2.5 p-2.5"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${circleClass}`}>
                    {stepDefinition.stepNumber}
                  </span>
                </div>
              )}
              <span className={`hidden text-xs font-semibold sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {stepDefinition.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-all ${isCompleted ? "bg-success" : "bg-border"}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
