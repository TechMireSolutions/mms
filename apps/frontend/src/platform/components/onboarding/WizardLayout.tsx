import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { useTranslation } from "@/hooks/useTranslation";
import WorkspaceLogo from "@/platform/components/WorkspaceLogo";

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
  const branding = useBranding();
  const { t, isRtl } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10 selection:text-primary">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/[0.04] via-background to-background"
        aria-hidden
      />

      <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <WorkspaceLogo
            logoUrl={branding.logoUrl}
            madrasaName={branding.madrasaName || t("entry.productName")}
            className="w-7 h-7 rounded-md shrink-0"
          />
          <span className="font-black text-sm text-foreground uppercase tracking-wider">
            {branding.madrasaName || t("entry.productName")}
          </span>
        </div>

        <span className="text-xs font-bold text-muted-foreground" aria-live="polite">
          {t("onboarding.stepOf", { current: String(currentStep), total: String(steps.length) })}
        </span>
      </header>

      <div
        className="h-1 bg-muted w-full relative z-50"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuetext={t("onboarding.stepOf", { current: String(currentStep), total: String(steps.length) })}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-violet-600 rounded-full"
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4 relative z-10">
        <nav aria-label={t("onboarding.stepOf", { current: String(currentStep), total: String(steps.length) })} className="flex items-center gap-0 mb-10">
          {steps.map((step, index) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1.5" aria-current={active ? "step" : undefined}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm shadow-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" aria-hidden /> : <span aria-hidden="true">{step.id}</span>}
                  </div>
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider hidden sm:block ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={`w-16 sm:w-24 h-px mx-1 mb-5 transition-colors duration-300 ${
                      currentStep > step.id ? "bg-primary/40" : "bg-border"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </nav>

        <motion.section
          key={currentStep}
          initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-2xl bg-card/65 backdrop-blur-sm border border-border/40 rounded-3xl shadow-lg hover:border-primary/20 transition-all duration-500 overflow-hidden"
          aria-labelledby="wizard-step-title"
        >
          <header className="px-6 py-6 border-b border-border/40 bg-muted/10">
            <h2 id="wizard-step-title" className="text-lg font-black text-foreground m-0 tracking-tight">
              {title}
            </h2>
            {subtitle ? <p className="text-sm font-medium text-muted-foreground mt-1 m-0">{subtitle}</p> : null}
          </header>
          <div className="px-6 py-8">{children}</div>
        </motion.section>
      </main>
    </div>
  );
}
