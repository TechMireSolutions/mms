import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  isValidSubdomain,
  validatePasswordPolicy,
  isValidEmail,
} from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";
import { getAppDomain } from "@/lib/config/tenantConfig";
import { defaultFooterForMadrasa } from "@/components/branding/BrandingShared";
import { applyBrandingTheme } from "@/lib/brandingTheme";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { isApiError } from "@/lib/apiClient";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import {
  ONBOARDING_INITIAL_DATA,
  ONBOARDING_STEP_DEFS,
  type OnboardingData,
} from "@/platform/pages/onboarding/onboardingWizardTypes";

export function useOnboardingWizardController() {
  const { onboard } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(ONBOARDING_INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSignInLink, setShowSignInLink] = useState(false);

  const wizardSteps = ONBOARDING_STEP_DEFS.map((def) => ({ id: def.id, label: t(def.labelKey) }));

  useEffect(() => {
    return () => {
      applyBrandingTheme();
    };
  }, []);

  const currentStep = ONBOARDING_STEP_DEFS[step - 1];
  if (!currentStep) {
    throw new Error(`Invalid step state: step ${step} does not exist.`);
  }

  const isLastStep = step === ONBOARDING_STEP_DEFS.length;

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

  const handleFinish = async (): Promise<void> => {
    setSubmitError(null);
    setShowSignInLink(false);

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
      setSubmitError(policyCheck.errorKey ? t(policyCheck.errorKey) : t("onboarding.submitFailed"));
      return;
    }

    setLoading(true);

    try {
      const appDomain = getAppDomain();
      await onboard({
        madrasaName: data.name.trim(),
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
      if (isApiError(err) && err.type === "conflict") {
        setSubmitError(t("onboarding.workspaceConflict"));
        setShowSignInLink(true);
      } else {
        setSubmitError(getPlatformErrorMessage(err, t));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (): void => {
    const stepError = validateCurrentStep();
    if (stepError) {
      setSubmitError(stepError);
      setShowSignInLink(false);
      return;
    }
    setSubmitError(null);
    setShowSignInLink(false);

    if (!isLastStep) {
      setStep((value) => value + 1);
      return;
    }
    void handleFinish();
  };

  return {
    t,
    step,
    setStep,
    data,
    setData,
    loading,
    submitError,
    wizardSteps,
    currentStep,
    isLastStep,
    handleNext,
    showSignInLink,
  };
}
