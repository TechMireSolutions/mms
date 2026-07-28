import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { AuthPageBackdrop } from "@/components/entry/AuthPageShell";
import { PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { cn } from "@/lib/utils";

export interface WizardStepConfig {
  id: number;
  label: string;
}

interface WizardLayoutProps {
  currentStep: number;
  steps: WizardStepConfig[];
  children: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Layout wrapper for platform onboarding wizard.
 */
export default function WizardLayout({
  currentStep,
  steps,
  children,
  title,
  subtitle,
}: WizardLayoutProps): React.JSX.Element {
  const { t, dir, isRtl } = useTranslation();
  const reducedMotion = useReducedMotion();
  const stepLabel = t("onboarding.stepOf", {
    current: String(currentStep),
    total: String(steps.length),
  });

  return (
    <div
      dir={dir}
      className="relative flex min-h-dvh flex-col overflow-hidden bg-background selection:bg-primary/10 selection:text-primary"
    >
      <AuthPageBackdrop />

      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2.5">
          <PlatformLogoMark size="sm" />
          <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
            {t("entry.productName")}
          </span>
        </div>

        <span className="text-xs font-semibold text-muted-foreground" aria-live="polite">
          {stepLabel}
        </span>
      </header>

      <div
        className="relative z-50 h-1 w-full bg-muted"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuetext={stepLabel}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          initial={false}
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
        />
      </div>

      <main id="main-content" className="relative z-10 flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label={stepLabel} className="mb-8 flex items-center gap-0 sm:mb-10">
          {steps.map((step, index) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1.5" aria-current={active ? "step" : undefined}>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                      done || active
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted text-muted-foreground",
                      active && "ring-4 ring-primary/20 shadow-sm shadow-primary/20",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden /> : <span aria-hidden>{step.id}</span>}
                  </div>
                  <span
                    className={cn(
                      "hidden text-[11px] font-semibold uppercase tracking-wider sm:block",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      "mx-1 mb-5 h-px w-12 sm:w-24 transition-colors duration-300",
                      currentStep > step.id ? "bg-primary/40" : "bg-border",
                    )}
                    aria-hidden
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </nav>

        <motion.section
          key={currentStep}
          initial={reducedMotion ? false : { opacity: 0, x: isRtl ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-xl shadow-black/[0.04] backdrop-blur-xl dark:shadow-black/25"
          aria-labelledby="wizard-step-title"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
          <header className="border-b border-border/50 bg-muted/10 px-6 py-5 sm:px-8">
            <h1 id="wizard-step-title" className="m-0 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="m-0 mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </header>
          <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        </motion.section>
      </main>
    </div>
  );
}
