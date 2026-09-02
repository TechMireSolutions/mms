import type { Dispatch, SetStateAction } from "react";
import { type OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { slugifySubdomain } from "@mms/shared";
import { getAppDomain } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { NAME_MAX } from "@/components/branding/BrandingShared";

export function useCreateMadrasaController(
  data: OnboardingData,
  onChange: Dispatch<SetStateAction<OnboardingData>>,
) {
  const { t } = useTranslation();
  const appDomain = getAppDomain();

  const updateField = <K extends keyof OnboardingData>(field: K, fieldValue: OnboardingData[K]) => {
    onChange((prev) => ({ ...prev, [field]: fieldValue }));
  };

  const handleNameChange = (nameValue: string) => {
    onChange((prev) => ({
      ...prev,
      name: nameValue.slice(0, NAME_MAX),
      subdomain: prev.subdomainTouched ? prev.subdomain : slugifySubdomain(nameValue),
    }));
  };

  const handleSubdomainChange = (subdomainValue: string) => {
    onChange((prev) => ({
      ...prev,
      subdomain: slugifySubdomain(subdomainValue),
      subdomainTouched: true,
    }));
  };

  return {
    t,
    appDomain,
    data,
    onChange,
    updateField,
    handleNameChange,
    handleSubdomainChange,
  };
}

export type CreateMadrasaController = ReturnType<typeof useCreateMadrasaController>;
