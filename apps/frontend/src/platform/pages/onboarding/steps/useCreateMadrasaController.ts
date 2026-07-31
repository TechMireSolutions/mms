import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import {
  DEFAULT_BRANDING_SETTINGS,
  mergeBrandingSettings,
  slugifySubdomain,
  COUNTRY_CODES,
} from "@mms/shared";
import { applyBrandingTheme } from "@/lib/brandingTheme";
import { getAppDomain } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import {
  NAME_MAX,
  defaultFooterForMadrasa,
} from "@/components/branding/BrandingShared";

export function useCreateMadrasaController(
  data: OnboardingData,
  onChange: Dispatch<SetStateAction<OnboardingData>>,
) {
  const { t } = useTranslation();
  const appDomain = getAppDomain();

  const updateField = <K extends keyof OnboardingData>(field: K, fieldValue: OnboardingData[K]) => {
    onChange((prev) => ({ ...prev, [field]: fieldValue }));
  };

  const previewBranding = mergeBrandingSettings({
    madrasaName: data.name,
    tagline: data.tagline,
    logoUrl: data.logoUrl || "",
    faviconUrl: data.logoUrl || "",
    country: data.country,
    website: data.subdomain ? `https://${data.subdomain}.${appDomain}` : "",
  });

  const resolvedFooter =
    data.footerText.trim() || defaultFooterForMadrasa(data.name, 'en');

  useEffect(() => {
    applyBrandingTheme({
      primaryColor: data.primaryColor || DEFAULT_BRANDING_SETTINGS.primaryColor,
      secondaryColor: data.secondaryColor || DEFAULT_BRANDING_SETTINGS.secondaryColor,
    });
  }, [data.primaryColor, data.secondaryColor]);

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

  const countryOptions = COUNTRY_CODES.map((c) => ({
    value: c.country,
    label: `${c.country} (${c.code})`,
  }));

  return {
    t,
    appDomain,
    data,
    onChange,
    updateField,
    previewBranding,
    resolvedFooter,
    handleNameChange,
    handleSubdomainChange,
    countryOptions,
  };
}

export type CreateMadrasaController = ReturnType<typeof useCreateMadrasaController>;
