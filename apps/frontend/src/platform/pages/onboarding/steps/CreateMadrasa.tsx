import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { OnboardingData } from "@/platform/pages/onboarding/onboardingWizardTypes";
import OrganizationDetailsStep from "@/platform/pages/onboarding/steps/OrganizationDetailsStep";
import ModulesStep from "@/platform/pages/onboarding/steps/ModulesStep";

interface CreateMadrasaProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * Legacy combined step kept for imports/tests — wizard now uses split steps.
 * Renders organization details + modules for compatibility callers.
 */
export default function CreateMadrasa({ data, onChange }: CreateMadrasaProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <OrganizationDetailsStep data={data} onChange={onChange} />
      <ModulesStep data={data} onChange={onChange} />
    </div>
  );
}
