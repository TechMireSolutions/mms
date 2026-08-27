import type React from "react";
import CreateMadrasa from "@/platform/pages/onboarding/steps/CreateMadrasa";
import AdminSetup from "@/platform/pages/onboarding/steps/AdminSetup";
import { SYSTEM_MODULES } from "@mms/shared";

export interface OnboardingData {
  name: string;
  subdomain: string;
  subdomainTouched: boolean;
  firstName: string;
  lastName: string;
  email: string;
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
  subdomain: "",
  subdomainTouched: false,
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreedTerms: false,
  modules: SYSTEM_MODULES.map((m) => m.id),
};
