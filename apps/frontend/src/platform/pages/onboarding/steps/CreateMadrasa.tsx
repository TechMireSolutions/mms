import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { type OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { useCreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";
import { CreateMadrasaIdentitySection } from "@/platform/pages/onboarding/steps/CreateMadrasaIdentitySection";
import { CreateMadrasaIndustrySection } from "@/platform/pages/onboarding/steps/CreateMadrasaIndustrySection";
import { CreateMadrasaModulesSection } from "@/platform/pages/onboarding/steps/CreateMadrasaModulesSection";

interface CreateMadrasaProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * Institution name + subdomain + industry + module selection.
 * Theme, branding, and contact details are configured by the tenant admin after first login.
 */
export default function CreateMadrasa({ data, onChange }: CreateMadrasaProps): React.ReactElement {
  const controller = useCreateMadrasaController(data, onChange);

  return (
    <div className="space-y-6">
      <CreateMadrasaIdentitySection controller={controller} />
      <CreateMadrasaIndustrySection controller={controller} />
      <CreateMadrasaModulesSection controller={controller} />
    </div>
  );
}
