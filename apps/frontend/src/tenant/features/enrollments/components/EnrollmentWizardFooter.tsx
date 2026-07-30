import React from "react";
import { ArrowRight, ArrowLeft, X, CheckCircle2 } from "lucide-react";
import type { Step } from "@/tenant/features/enrollments/components/wizard/StepIndicator";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { Button } from "@/components/ui/button";

interface EnrollmentWizardFooterProps {
  t: TranslationFunction;
  step: number;
  steps: Step[];
  canNext: boolean;
  canConfirm: boolean;
  submitting: boolean;
  onCancel: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function EnrollmentWizardFooter({
  t,
  step,
  steps,
  canNext,
  canConfirm,
  submitting,
  onCancel,
  onPrevious,
  onNext,
  onSubmit,
}: EnrollmentWizardFooterProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
      <div>
        {step === 0 ? (
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-auto"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.cancel')}
          </Button>
        ) : (
          <Button
            onClick={onPrevious}
            variant="outline"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors h-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.previous')}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {t("enrollments.wizard.stepOf", { step: step + 1, total: steps.length })}
        </span>
        {step < steps.length - 1 ? (
          <Button
            onClick={onNext}
            disabled={!canNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-auto"
          >
            {t('common.next')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            onClick={() => { void onSubmit(); }}
            disabled={!canConfirm || submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('enrollments.new')}
          </Button>
        )}
      </div>
    </div>
  );
}
