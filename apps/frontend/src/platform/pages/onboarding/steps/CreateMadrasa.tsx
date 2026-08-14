import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { useCreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";
import { CreateMadrasaIdentitySection } from "@/platform/pages/onboarding/steps/CreateMadrasaIdentitySection";
import { CreateMadrasaThemeSection } from "@/platform/pages/onboarding/steps/CreateMadrasaThemeSection";
import { CreateMadrasaModulesSection } from "@/platform/pages/onboarding/steps/CreateMadrasaModulesSection";

interface CreateMadrasaProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * Institution identity + theme — mirrors Settings → Institution and Settings → Theme.
 */
export default function CreateMadrasa({ data, onChange }: CreateMadrasaProps): React.ReactElement {
  const controller = useCreateMadrasaController(data, onChange);

  return (
    <div className="space-y-6">
      <CreateMadrasaIdentitySection controller={controller} />
      <CreateMadrasaThemeSection controller={controller} />
      <CreateMadrasaModulesSection controller={controller} />
    </div>
  );
}
