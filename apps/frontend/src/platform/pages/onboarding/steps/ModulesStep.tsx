import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { OnboardingData } from "@/platform/pages/onboarding/onboardingWizardTypes";
import { useCreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";
import { CreateMadrasaModulesSection } from "@/platform/pages/onboarding/steps/CreateMadrasaModulesSection";

interface ModulesStepProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/** Step 2: recommended modules (editable). */
export default function ModulesStep({ data, onChange }: ModulesStepProps): React.ReactElement {
  const controller = useCreateMadrasaController(data, onChange);
  return <CreateMadrasaModulesSection controller={controller} />;
}
