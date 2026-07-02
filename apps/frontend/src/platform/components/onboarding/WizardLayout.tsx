import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useBranding } from "@/tenant/hooks/useBranding";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border bg-card/70 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={`${branding.madrasaName || "MMS"} Logo`}
              className="w-7 h-7 rounded-md object-cover bg-background border border-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <span className="text-primary font-display text-sm font-bold">
                {branding.madrasaName ? branding.madrasaName.charAt(0) : "م"}
              </span>
            </div>
          )}
          <span className="font-semibold text-sm text-foreground">
            {branding.madrasaName || t("apex.landingTitle")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {t("onboarding.stepOf", { current: String(currentStep), total: String(steps.length) })}
        </span>
      </header>

      <div
        className="h-1 bg-muted w-full"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuetext={t("onboarding.stepOf", { current: String(currentStep), total: String(steps.length) })}
      >
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4">
        <nav aria-label={t("onboarding.stepOf", { current: String(currentStep), total: String(steps.length) })} className="flex items-center gap-0 mb-10">
          {steps.map((step, index) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1.5" aria-current={active ? "step" : undefined}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" aria-hidden /> : <span aria-hidden="true">{step.id}</span>}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:block ${
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
          aria-labelledby="wizard-step-title"
        >
          <header className="px-6 py-5 border-b border-border bg-muted/20">
            <h2 id="wizard-step-title" className="text-lg font-bold text-foreground m-0">
              {title}
            </h2>
            {subtitle ? <p className="text-sm text-muted-foreground mt-0.5 m-0">{subtitle}</p> : null}
          </header>
          <div className="px-6 py-6">{children}</div>
        </motion.section>
      </main>
    </div>
  );
}
