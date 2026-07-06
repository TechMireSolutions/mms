import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import WizardLayout from "@/platform/components/onboarding/WizardLayout";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain } from "@/lib/config/tenantConfig";
import {
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  isValidSubdomain,
  validatePasswordPolicy,
} from "@mms/shared";
import { defaultFooterForMadrasa } from "@/tenant/features/settings/components/branding/BrandingShared";
import { applyBrandingTheme } from "@/lib/brandingTheme";
import CreateMadrasa from "@/platform/pages/onboarding/steps/CreateMadrasa";
import AdminSetup from "@/platform/pages/onboarding/steps/AdminSetup";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { isApiError } from "@/lib/apiClient";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { PlatformLoadingScreen } from "@/platform/components/PlatformLoadingScreen";

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedTerms: boolean;
}

interface OnboardingStep {
  id: number;
  titleKey: "onboarding.stepInstitutionTitle" | "onboarding.stepAdminTitle";
  subtitleKey: "onboarding.stepInstitutionSubtitle" | "onboarding.stepAdminSubtitle";
  labelKey: "onboarding.stepInstitutionLabel" | "onboarding.stepAdminLabel";
  component: React.ComponentType<{
    data: OnboardingData;
    onChange: React.Dispatch<React.SetStateAction<OnboardingData>>;
  }>;
}

const STEP_DEFS: OnboardingStep[] = [
  {
    id: 1,
    titleKey: "onboarding.stepInstitutionTitle",
    subtitleKey: "onboarding.stepInstitutionSubtitle",
    labelKey: "onboarding.stepInstitutionLabel",
    component: CreateMadrasa,
  },
  {
    id: 2,
    titleKey: "onboarding.stepAdminTitle",
    subtitleKey: "onboarding.stepAdminSubtitle",
    labelKey: "onboarding.stepAdminLabel",
    component: AdminSetup,
  },
];

const initialData: OnboardingData = {
  name: "",
  tagline: DEFAULT_BRANDING_SETTINGS.tagline,
  subdomain: "",
  subdomainTouched: false,
  logoUrl: "",
  country: "",
  primaryColor: DEFAULT_BRANDING_SETTINGS.primaryColor,
  secondaryColor: DEFAULT_BRANDING_SETTINGS.secondaryColor,
  footerText: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreedTerms: false,
};

/** Platform-protected wizard to provision a new madrasa workspace. */
export default function OnboardingWizard(): React.JSX.Element {
  const {
    platformUser,
    isPlatformAuthenticated,
    platformAuthChecked,
    isCheckingPlatformAuth,
  } = usePlatformAuth();
  const { onboard } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const wizardSteps = useMemo(
    () => STEP_DEFS.map((def) => ({ id: def.id, label: t(def.labelKey) })),
    [t],
  );

  useEffect(() => {
    return () => {
      applyBrandingTheme();
    };
  }, []);

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (platformUser?.role !== "super_user") {
    return <Navigate to={ROUTES.home} replace />;
  }

  const currentStep = STEP_DEFS[step - 1];
  if (!currentStep) {
    throw new Error(`Invalid step state: step ${step} does not exist.`);
  }
  const StepComponent = currentStep.component;
  const isLastStep = step === STEP_DEFS.length;

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!data.name.trim()) return t("onboarding.errorMadrasaName");
      if (!data.subdomain || !isValidSubdomain(data.subdomain)) return t("onboarding.errorSubdomain");
    }
    if (step === 2) {
      if (!data.firstName.trim() || !data.lastName.trim()) return t("onboarding.errorAdminName");
      if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) return t("onboarding.errorAdminEmail");
      if (!data.agreedTerms) return t("onboarding.errorTerms");
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
      setStep((value) => value + 1);
      return;
    }
    void handleFinish();
  };

  const handleFinish = async (): Promise<void> => {
    setSubmitError(null);

    const stepError = validateCurrentStep();
    if (stepError) {
      setSubmitError(stepError);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setSubmitError(t("onboarding.errorPasswordMismatch"));
      return;
    }

    const policyCheck = validatePasswordPolicy(data.password, DEFAULT_GLOBAL_SETTINGS.passwordPolicy);
    if (!policyCheck.valid) {
      setSubmitError(policyCheck.message);
      return;
    }

    setLoading(true);

    try {
      const appDomain = getAppDomain();
      await onboard({
        madrasaName: data.name || "MMS",
        tagline: data.tagline.trim() || DEFAULT_BRANDING_SETTINGS.tagline,
        adminName: `${data.firstName} ${data.lastName}`.trim(),
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

      navigate(ROUTES.home, { replace: true });
    } catch (err: unknown) {
      const message = isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : t("onboarding.submitFailed");
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  const showSignInLink = submitError?.toLowerCase().includes("already exists");

  return (
    <WizardLayout
      currentStep={step}
      steps={wizardSteps}
      title={t(currentStep.titleKey)}
      subtitle={t(currentStep.subtitleKey)}
    >
      <StepComponent data={data} onChange={setData} />

      {submitError ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}{" "}
          {showSignInLink ? (
            <Link to={ROUTES.home} className="font-semibold underline">
              {t("onboarding.signInInstead")}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between mt-7 pt-5 border-t border-border">
        <button
          type="button"
          onClick={() => setStep((value) => value - 1)}
          disabled={step === 1}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t("onboarding.back")}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <>
              {isLastStep ? t("onboarding.createWorkspace") : t("onboarding.continue")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    </WizardLayout>
  );
}
