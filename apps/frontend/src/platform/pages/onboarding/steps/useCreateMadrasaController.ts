import type { Dispatch, SetStateAction } from "react";
import { type OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import {
  slugifySubdomain,
  SYSTEM_MODULES,
  getRecommendedModulesForIndustry,
  getRecommendedBlueprintForIndustry,
  type IndustryType,
} from "@mms/shared";
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

  const handleIndustryChange = (industry: IndustryType) => {
    const recommended = getRecommendedModulesForIndustry(industry);
    const blueprint = getRecommendedBlueprintForIndustry(industry);
    const requiredIds = SYSTEM_MODULES.filter((m) => m.required).map((m) => m.id);
    const combined = Array.from(new Set([...requiredIds, ...recommended]));
    onChange((prev) => ({
      ...prev,
      industryType: industry,
      blueprintId: prev.applyRecommendedStructure ? blueprint : "",
      modules: combined,
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
    handleIndustryChange,
  };
}

export type CreateMadrasaController = ReturnType<typeof useCreateMadrasaController>;
