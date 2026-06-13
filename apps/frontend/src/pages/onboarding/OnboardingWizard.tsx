import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import WizardLayout from "../../components/onboarding/WizardLayout";
import { ROUTES } from "../../lib/routes";
import { tenantUrl, getAppDomain } from "../../lib/tenantConfig";
import {
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  isValidSubdomain,
  validatePasswordPolicy,
} from "@mms/shared";
import { defaultFooterForMadrasa } from "@/components/settings/BrandingShared";
import { applyBrandingTheme } from "@/lib/brandingTheme";
import CreateMadrasa from "./steps/CreateMadrasa";
import SelectPlan from "./steps/SelectPlan";
import AdminSetup from "./steps/AdminSetup";
import { useAuth } from "../../lib/AuthContext";

export interface OnboardingData {
  name: string;
  tagline: string;
  subdomain: string;
  subdomainTouched: boolean;
  logoUrl: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  plan: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  enable2FA: boolean;
  agreedTerms: boolean;
}

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType<{
    data: OnboardingData;
    onChange: React.Dispatch<React.SetStateAction<OnboardingData>>;
  }>;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Institution & theme",
    subtitle: "Set up your madrasa identity and colours — the same fields as Settings → Institution and Settings → Theme",
    component: CreateMadrasa,
  },
  {
    id: 2,
    title: "Choose your plan",
    subtitle: "Start for free — upgrade anytime as your institution grows",
    component: SelectPlan,
  },
  {
    id: 3,
    title: "Set up your admin account",
    subtitle: "Create the primary administrator account for your workspace",
    component: AdminSetup,
  },
];

const initialData: OnboardingData = {
  // Step 1
  name: "",
  tagline: DEFAULT_BRANDING_SETTINGS.tagline,
  subdomain: "",
  subdomainTouched: false,
  logoUrl: "",
  country: "",
  primaryColor: DEFAULT_BRANDING_SETTINGS.primaryColor,
  secondaryColor: DEFAULT_BRANDING_SETTINGS.secondaryColor,
  footerText: "",
  // Step 2
  plan: "pro",
  // Step 3
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  enable2FA: true,
  agreedTerms: false,
};

/**
 * Renders the OnboardingWizard component.
 * Allows new users to create their madrasa, select a plan, and initialize the admin workspace.
 *
 * @returns {React.ReactElement} The rendered OnboardingWizard page.
 */
export default function OnboardingWizard(): React.ReactElement {
  const { onboard } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [handoffCode, setHandoffCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentStep = STEPS[step - 1];
  if (!currentStep) {
    throw new Error(`Invalid step state: step ${step} does not exist.`);
  }
  const StepComponent = currentStep.component;
  const isLastStep = step === STEPS.length;

  useEffect(() => {
    return () => {
      applyBrandingTheme();
    };
  }, []);

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!data.name.trim()) {
        return "Enter your madrasa name.";
      }
      if (!data.subdomain || !isValidSubdomain(data.subdomain)) {
        return "Choose a valid workspace subdomain (letters, numbers, hyphens).";
      }
    }
    return null;
  };

  const handleNext = (): void => {
    const stepError = validateCurrentStep();
    if (stepError) {
      setSubmitError(stepError);
      return;
    }
    setSubmitError(null);

    if (!isLastStep) {
      setStep((s) => s + 1);
    } else {
      void handleFinish();
    }
  };

  const handleFinish = async (): Promise<void> => {
    setSubmitError(null);

    if (!data.subdomain || !isValidSubdomain(data.subdomain)) {
      setSubmitError("Choose a valid workspace subdomain (letters, numbers, hyphens).");
      return;
    }

    if (data.password !== data.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    const policyCheck = validatePasswordPolicy(
      data.password,
      DEFAULT_GLOBAL_SETTINGS.passwordPolicy
    );
    if (!policyCheck.valid) {
      setSubmitError(policyCheck.message);
      return;
    }

    setLoading(true);

    try {
      const appDomain = getAppDomain();
      const result = await onboard({
        madrasaName: data.name || "MMS",
        tagline: data.tagline.trim() || DEFAULT_BRANDING_SETTINGS.tagline,
        adminName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        subdomain: data.subdomain,
        country: data.country,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        logoUrl: data.logoUrl || undefined,
        adminPhone: data.phone || undefined,
        website: data.subdomain ? `https://${data.subdomain}.${appDomain}` : undefined,
        footerText: data.footerText.trim() || defaultFooterForMadrasa(data.name),
      });

      setHandoffCode(result.handoffCode);
      setLoading(false);
      setDone(true);
    } catch (err: unknown) {
      console.error("Onboarding failed:", err);
      setLoading(false);
      const message = err instanceof Error ? err.message : "Failed to register workspace admin";
      setSubmitError(message);
    }
  };

  if (done && handoffCode) {
    return <SuccessScreen data={data} handoffCode={handoffCode} />;
  }

  return (
    <WizardLayout
      currentStep={step}
      title={currentStep.title}
      subtitle={currentStep.subtitle}
    >
      <StepComponent data={data} onChange={setData} />

      {submitError && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}{" "}
          {submitError.toLowerCase().includes("admin account already exists") && (
            <Link to={ROUTES.login} className="font-semibold underline">
              Sign in instead
            </Link>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-7 pt-5 border-t border-border">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {/* Step dots */}
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`rounded-full transition-all duration-300 ${
                s.id === step
                  ? "w-5 h-2 bg-primary"
                  : s.id < step
                  ? "w-2 h-2 bg-primary/40"
                  : "w-2 h-2 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {isLastStep ? "Create Workspace" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </WizardLayout>
  );
}

/**
 * SuccessScreen subcomponent displayed when onboarding completes successfully.
 *
 * @param props - Component props.
 * @param props.data - Collected onboarding data.
 * @returns {React.ReactElement} The SuccessScreen element.
 */
function SuccessScreen({
  data,
  handoffCode,
}: {
  data: OnboardingData;
  handoffCode: string;
}): React.ReactElement {
  const appDomain = getAppDomain();
  const workspaceLoginUrl = tenantUrl(
    data.subdomain || "your-madrasa",
    `${ROUTES.login}?handoff=${encodeURIComponent(handoffCode)}`
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = workspaceLoginUrl;
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [workspaceLoginUrl]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full text-center"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Workspace created
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Welcome to {data.name || "Madrasa MS"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your workspace <strong className="text-foreground">{data.name || "Your Madrasa"}</strong> is ready.
            Add contact details, address, and social links anytime under{" "}
            <strong className="text-foreground">Settings → Institution</strong>; adjust colours and footer under{" "}
            <strong className="text-foreground">Settings → Theme</strong>.
          </p>

          <div className="mt-6 bg-muted/50 rounded-xl p-4 border border-border text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workspace URL</span>
              <span className="font-medium text-foreground">
                {data.subdomain || "your-madrasa"}.{appDomain}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground capitalize">{data.plan || "Pro"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Admin</span>
              <span className="font-medium text-foreground">{data.email || "admin@madrasa.app"}</span>
            </div>
          </div>

          <a
            href={workspaceLoginUrl}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            Open {data.subdomain}.{appDomain}
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-muted-foreground mt-2">Redirecting to your workspace…</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
