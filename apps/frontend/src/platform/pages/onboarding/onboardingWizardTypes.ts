import type React from "react";
import CreateMadrasa from "@/platform/pages/onboarding/steps/CreateMadrasa";
import AdminSetup from "@/platform/pages/onboarding/steps/AdminSetup";
import { DEFAULT_BRANDING_SETTINGS, SYSTEM_MODULES } from "@mms/shared";

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
  modules: string[];
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

export const ONBOARDING_STEP_DEFS: OnboardingStep[] = [
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

export const ONBOARDING_INITIAL_DATA: OnboardingData = {
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
  modules: SYSTEM_MODULES.map((m) => m.id),
};
