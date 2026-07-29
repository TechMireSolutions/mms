import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import WizardLayout from "@/platform/components/onboarding/WizardLayout";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain } from "@/lib/config/tenantConfig";
import {
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  isValidSubdomain,
  validatePasswordPolicy,
  isValidEmail,
} from "@mms/shared";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { defaultFooterForMadrasa } from "@/tenant/features/settings/components/branding/BrandingShared";
import { applyBrandingTheme } from "@/lib/brandingTheme";
import CreateMadrasa from "@/platform/pages/onboarding/steps/CreateMadrasa";
import AdminSetup from "@/platform/pages/onboarding/steps/AdminSetup";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { isApiError } from "@/lib/apiClient";

export interface OnboardingData {
  name: string;
  tagline: string;
  subdomain: string;
  subdomainTouched: boolean;
  logoUrl: string;
  country: string;
  province: string;
  city: string;
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
  province: "",
  city: "",
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
      if (!isValidEmail(data.email)) return t("onboarding.errorAdminEmail");
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
      setSubmitError(policyCheck.errorKey ? t(policyCheck.errorKey) : policyCheck.message);
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
        region: data.province,
        city: data.city,
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
        <Alert
          className="mt-4"
          message={
            <>
              {submitError}{" "}
              {showSignInLink ? (
                <Link to={ROUTES.home} className="inline-flex min-h-11 items-center font-semibold underline">
                  {t("onboarding.signInInstead")}
                </Link>
              ) : null}
            </>
          }
        />
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-border/50 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setStep((value) => value - 1)}
          disabled={step === 1 || loading}
          className="h-11 gap-1.5 rounded-xl text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {t("onboarding.back")}
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleNext}
          disabled={loading}
          className="h-11 gap-1.5 rounded-xl px-5 font-semibold shadow-md shadow-primary/10"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("common.loading")}
            </>
          ) : (
            <>
              {isLastStep ? t("onboarding.createWorkspace") : t("onboarding.continue")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </WizardLayout>
  );
}
